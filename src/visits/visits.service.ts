import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateVisitDto } from './dto/create-visit.dto';

@Injectable()
export class VisitsService {
    constructor(private readonly prisma: PrismaService) { }

    async create(createVisitDto: CreateVisitDto) {
        const {
            customerId,
            branchId,
            visitDate,
            medicalRecords,
            generalItems,
            discount,
            paymentMethod
        } = createVisitDto;

        // 1. Verify Customer exists and belongs to branch
        const customer = await this.prisma.customer.findUnique({
            where: { id: customerId },
        });
        if (!customer) {
            throw new BadRequestException('Customer not found');
        }

        // 2. Perform Transaction
        return this.prisma.$transaction(async (tx) => {
            // 2.1 Create the Visit entry
            const visit = await tx.visit.create({
                data: {
                    customerId,
                    branchId,
                    visitDate: visitDate ? new Date(visitDate) : new Date(),
                },
            });

            let totalInvoiceAmount = 0;

            // 2.3 Create initial Invoice
            const invoice = await tx.invoice.create({
                data: {
                    branchId,
                    customerId,
                    visitId: visit.id,
                    totalAmount: 0,
                    discount: discount || 0,
                    netAmount: 0,
                    status: 'UNPAID',
                    paymentMethod,
                    paymentDate: paymentMethod ? new Date() : null,
                },
            });

            // 2.2 Create Medical Records for each Pet
            const recordsToCreate = [];
            const treatmentsToCreate = [];

            for (const reqRecord of medicalRecords) {
                const pet = await tx.pet.findFirst({
                    where: { id: reqRecord.petId },
                });
                if (!pet) throw new BadRequestException(`Pet ${reqRecord.petId} not found`);

                const record = await tx.medicalRecord.create({
                    data: {
                        branchId,
                        visitId: visit.id,
                        petId: reqRecord.petId,
                        vetId: reqRecord.vetId,
                        visitDate: visit.visitDate, // Use the same date as the visit
                        weightAtVisit: reqRecord.weightAtVisit,
                        temperature: reqRecord.temperature,
                        symptoms: reqRecord.symptoms || '',
                        diagnosis: reqRecord.diagnosis || '',
                        treatment: reqRecord.treatment || '',
                        prescription: reqRecord.prescription || '',
                        notes: reqRecord.notes || '',
                    }
                });
                recordsToCreate.push(record);

                if (reqRecord.medications && reqRecord.medications.length > 0) {
                    for (const item of reqRecord.medications) {
                        const inventory = await tx.inventory.findUnique({
                            where: { id: item.inventoryId },
                        });
                        if (!inventory) throw new BadRequestException(`Inventory item ${item.inventoryId} not found`);

                        if (inventory.type !== 'SERVICE') {
                            await tx.inventory.update({
                                where: { id: inventory.id },
                                data: { quantity: { decrement: item.quantity } },
                            });
                        }

                        const lineTotal = item.quantity * item.unitPrice;
                        totalInvoiceAmount += lineTotal;

                        const newTreatment = await tx.medicalTreatment.create({
                            data: {
                                medicalRecordId: record.id,
                                inventoryId: item.inventoryId,
                                quantity: item.quantity,
                                dosage: item.usageInstructions || '',
                            },
                        });
                        treatmentsToCreate.push(newTreatment);

                        // Note: Since this item is specifically for a pet, it usually shouldn't 
                        // also exist as a general InvoiceItem. But to keep the Invoice total correct and 
                        // displayable later, we might want to also add it to generalItems or handle rendering differently.
                        // For now, we just add it to the final invoice amount.
                    }
                }

                // --- 2.2.0 Auto-complete existing scheduled appointments ---
                console.log(`[Auto-Complete] Record for pet ${reqRecord.petId} has appointmentIds:`, reqRecord.appointmentIds);

                if (reqRecord.appointmentIds && reqRecord.appointmentIds.length > 0) {
                    console.log(`[Auto-Complete] Explicitly completing appointments: ${reqRecord.appointmentIds.join(', ')}`);
                    for (const appId of reqRecord.appointmentIds) {
                        await tx.appointment.update({
                            where: { id: appId },
                            data: {
                                status: 'COMPLETED',
                                visitId: visit.id
                            } as any
                        });
                    }
                } else {
                    // Fallback to searching for appointments on the same day
                    const visitDateObj = visitDate ? new Date(visitDate) : new Date();
                    const vDateParts = new Intl.DateTimeFormat('en-GB', {
                        timeZone: 'Asia/Bangkok',
                        year: 'numeric',
                        month: '2-digit',
                        day: '2-digit',
                    }).formatToParts(visitDateObj);

                    const vDay = vDateParts.find(p => p.type === 'day')?.value;
                    const vMonth = vDateParts.find(p => p.type === 'month')?.value;
                    const vYear = vDateParts.find(p => p.type === 'year')?.value;
                    const vDateStr = `${vYear}-${vMonth}-${vDay}`;

                    const vStartOfDay = new Date(`${vDateStr}T00:00:00.000+07:00`);
                    const vEndOfDay = new Date(`${vDateStr}T23:59:59.999+07:00`);

                    console.log(`[Auto-Complete] Checking for pet ${reqRecord.petId} on ${vDateStr}`);
                    console.log(`[Auto-Complete] Range: ${vStartOfDay.toISOString()} - ${vEndOfDay.toISOString()}`);

                    const updateResult = await tx.appointment.updateMany({
                        where: {
                            petId: reqRecord.petId,
                            date: {
                                gte: vStartOfDay,
                                lte: vEndOfDay,
                            },
                            status: 'SCHEDULED',
                        },
                        data: {
                            status: 'COMPLETED',
                        }
                    });
                    console.log(`[Auto-Complete] Updated ${updateResult.count} appointments to COMPLETED`);
                }

                // --- 2.2.1 Create Next Appointment if specified ---
                if (reqRecord.nextAppointmentDate) {
                    const appointmentDate = new Date(reqRecord.nextAppointmentDate);

                    // Define start and end of the day in Bangkok timezone (UTC+7)
                    // This ensures we clear any duplicates on the same local day.
                    const localDateParts = new Intl.DateTimeFormat('en-GB', {
                        timeZone: 'Asia/Bangkok',
                        year: 'numeric',
                        month: '2-digit',
                        day: '2-digit',
                    }).formatToParts(appointmentDate);

                    const day = localDateParts.find(p => p.type === 'day')?.value;
                    const month = localDateParts.find(p => p.type === 'month')?.value;
                    const year = localDateParts.find(p => p.type === 'year')?.value;
                    const dateStr = `${year}-${month}-${day}`;

                    const startOfDay = new Date(`${dateStr}T00:00:00.000+07:00`);
                    const endOfDay = new Date(`${dateStr}T23:59:59.999+07:00`);

                    console.log(`[Appt Check] Pet: ${reqRecord.petId}, Day: ${dateStr}`);
                    console.log(`[Appt Check] Range: ${startOfDay.toISOString()} to ${endOfDay.toISOString()}`);

                    // 1. Delete ALL existing appointments for this pet on the SAME DAY
                    // that are still in 'SCHEDULED' or 'CANCELLED' status.
                    const deleteResult = await tx.appointment.deleteMany({
                        where: {
                            petId: reqRecord.petId,
                            date: {
                                gte: startOfDay,
                                lte: endOfDay,
                            },
                            status: { in: ['SCHEDULED', 'CANCELLED'] }
                        },
                    });

                    console.log(`[Appt Check] Deleted ${deleteResult.count} old appointments`);

                    // 2. Create the new appointment
                    await tx.appointment.create({
                        data: {
                            branchId,
                            petId: reqRecord.petId,
                            vetId: reqRecord.vetId,
                            date: appointmentDate,
                            reason: reqRecord.nextAppointmentReason || 'Follow-up visit',
                            status: 'SCHEDULED',
                        }
                    });
                }
            }

            // 2.4 Add General Items to the Invoice
            if (generalItems && generalItems.length > 0) {
                for (const gItem of generalItems) {
                    if (gItem.productId) {
                        const inventory = await tx.inventory.findUnique({
                            where: { id: gItem.productId },
                        });
                        if (!inventory) throw new BadRequestException(`Inventory item ${gItem.productId} not found`);

                        if (inventory.type !== 'SERVICE') {
                            await tx.inventory.update({
                                where: { id: inventory.id },
                                data: { quantity: { decrement: gItem.quantity } },
                            });
                        }
                    }

                    const lineTotal = gItem.quantity * gItem.unitPrice;
                    totalInvoiceAmount += lineTotal;

                    await tx.invoiceItem.create({
                        data: {
                            invoiceId: invoice.id,
                            productId: gItem.productId,
                            name: gItem.name,
                            quantity: gItem.quantity,
                            unitPrice: gItem.unitPrice,
                            totalPrice: lineTotal,
                        },
                    });
                }
            }

            // 2.5 Update Final Invoice Amounts
            const netAmount = Math.max(0, totalInvoiceAmount - (discount || 0));
            const updatedInvoice = await tx.invoice.update({
                where: { id: invoice.id },
                data: {
                    totalAmount: totalInvoiceAmount,
                    netAmount,
                },
                include: {
                    items: true
                }
            });

            // 2.6 Fetch full visit with relations for the success response
            return this.findOne(visit.id);
        });
    }

    async findAll(customerId?: string, dateStr?: string, appointmentId?: string) {
        const where: any = {};

        // If searching specifically for an appointment's visit, 
        // we don't need strict date filters which might mismatch due to early treatment
        if (appointmentId) {
            where.appointments = {
                some: { id: appointmentId }
            };
        } else {
            if (dateStr) {
                try {
                    // Parse date assuming it's in local YYYY-MM-DD format
                    const [year, month, day] = dateStr.split('-').map(Number);

                    // Create UTC markers for start and end of that day
                    // We expand by 12 hours on both sides to catch any timezone-shifted entries
                    // since the DB might store in UTC but the intent is "that local day"
                    const baseDate = new Date(Date.UTC(year, month - 1, day));
                    const startRange = new Date(baseDate.getTime() - (12 * 60 * 60 * 1000));
                    const endRange = new Date(baseDate.getTime() + (36 * 60 * 60 * 1000));

                    where.visitDate = {
                        gte: startRange,
                        lte: endRange
                    };
                } catch (e) {
                    console.error('Error parsing date for visit search:', e);
                }
            }
        }

        if (customerId) {
            where.customerId = customerId;
        }

        return this.prisma.visit.findMany({
            where,
            include: {
                customer: true,
                medicalRecords: {
                    include: {
                        pet: true,
                        vet: true,
                        medications: {
                            include: { inventory: true }
                        }
                    }
                },
                invoice: {
                    include: { items: true }
                }
            },
            orderBy: { visitDate: 'desc' }
        });
    }

    findOne(id: string) {
        return this.prisma.visit.findUnique({
            where: { id },
            include: {
                customer: true,
                medicalRecords: {
                    include: {
                        pet: true,
                        medications: {
                            include: { inventory: true }
                        }
                    }
                },
                invoice: {
                    include: { items: true }
                }
            }
        });
    }
}
