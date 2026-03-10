import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateVisitDto } from './dto/create-visit.dto';

import { MinioService } from '../common/services/minio.service';

@Injectable()
export class VisitsService {
    constructor(
        private readonly prisma: PrismaService,
        private readonly minioService: MinioService,
    ) { }

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

                // IPD Admission Integration
                if (reqRecord.ipdCageId) {
                    await (tx as any).admission.create({
                        data: {
                            branchId,
                            petId: reqRecord.petId,
                            cageId: reqRecord.ipdCageId,
                            medicalRecordId: record.id, // Link to the medical record we just created
                            notes: reqRecord.ipdNotes || '',
                            reason: reqRecord.diagnosis || reqRecord.symptoms || 'Admitted from treatment',
                            status: 'ADMITTED',
                            admittedAt: new Date(),
                        }
                    });
                }

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
                                    unitPrice: item.unitPrice, // Store the price
                                    dosage: item.usageInstructions || '',
                                } as any,
                            });
                            treatmentsToCreate.push(newTreatment);

                            // NEW: Create an InvoiceItem for this medical treatment linked to the record
                            await tx.invoiceItem.create({
                                data: {
                                    invoiceId: invoice.id,
                                    medicalRecordId: record.id, // Linking to the pet's medical record
                                    productId: item.inventoryId,
                                    name: inventory.name,
                                    quantity: item.quantity,
                                    unitPrice: item.unitPrice,
                                    totalPrice: lineTotal,
                                } as any
                            });
                        }
                    }

                // Lab Test Integration
                if (reqRecord.labTests && reqRecord.labTests.length > 0) {
                    for (const labReq of reqRecord.labTests) {
                        const labTest = await (tx as any).labTest.create({
                            data: {
                                medicalRecordId: record.id,
                                testType: labReq.testType,
                                result: labReq.result || '',
                                notes: labReq.notes || '',
                            }
                        });

                        if (labReq.files && labReq.files.length > 0) {
                            for (const fileReq of labReq.files) {
                                // Upload to MinIO
                                const objectName = await this.minioService.uploadFile(
                                    fileReq.name,
                                    fileReq.base64Data,
                                    fileReq.contentType
                                );

                                await (tx as any).labTestFile.create({
                                    data: {
                                        labTestId: labTest.id,
                                        url: objectName,
                                        name: fileReq.name,
                                    }
                                });
                            }
                        }
                    }
                }

                // --- 2.2.0 Auto-complete existing scheduled appointments ---
                if (reqRecord.appointmentIds && reqRecord.appointmentIds.length > 0) {
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

                    await tx.appointment.updateMany({
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
                }

                // --- 2.2.1 Create Next Appointment if specified ---
                if (reqRecord.nextAppointmentDate) {
                    const appointmentDate = new Date(reqRecord.nextAppointmentDate);
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

                    await tx.appointment.deleteMany({
                        where: {
                            petId: reqRecord.petId,
                            date: {
                                gte: startOfDay,
                                lte: endOfDay,
                            },
                            status: { in: ['SCHEDULED', 'CANCELLED'] }
                        },
                    });

                    // 2. Create the new appointment
                    await tx.appointment.create({
                        data: {
                            branchId,
                            petId: reqRecord.petId,
                            vetId: reqRecord.vetId,
                            date: appointmentDate,
                            reason: reqRecord.nextAppointmentReason || 'Follow-up visit',
                            status: 'SCHEDULED',
                            visitId: visit.id, // Linked to visit via visitId scalar
                        } as any
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
            await tx.invoice.update({
                where: { id: invoice.id },
                data: {
                    totalAmount: totalInvoiceAmount,
                    netAmount,
                }
            });

            // 2.6 Fetch full visit with relations for the success response
            return (this as any).findOne(visit.id, tx);
        });
    }

    async findAll(customerId?: string, dateStr?: string, appointmentId?: string, search?: string, page = 1, limit = 10) {
        const where: any = {};

        if (appointmentId) {
            where.appointments = {
                some: { id: appointmentId }
            };
        } else {
            if (dateStr) {
                try {
                    const [year, month, day] = dateStr.split('-').map(Number);
                    const baseDate = new Date(Date.UTC(year, month - 1, day));
                    // Thailand is UTC+7. 
                    // Start of day in local time is 17:00:00 UTC the day before.
                    const startRange = new Date(baseDate.getTime() - (7 * 60 * 60 * 1000));
                    // End of day in local time is 16:59:59.999 UTC on the same day.
                    const endRange = new Date(startRange.getTime() + (24 * 60 * 60 * 1000) - 1);

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

        if (search) {
            where.AND = [
                {
                    OR: [
                        {
                            customer: {
                                OR: [
                                    { firstName: { contains: search } },
                                    { lastName: { contains: search } },
                                    { phone: { contains: search } },
                                    { lineId: { contains: search } },
                                ]
                            }
                        },
                        {
                            medicalRecords: {
                                some: {
                                    pet: {
                                        OR: [
                                            { name: { contains: search } },
                                            { tagId: { contains: search } },
                                        ]
                                    }
                                }
                            }
                        }
                    ]
                }
            ];
        }

        const skip = (page - 1) * limit;

        const [data, total] = await Promise.all([
            (this.prisma.visit as any).findMany({
                where,
                include: {
                    customer: true,
                    medicalRecords: {
                        include: {
                            pet: true,
                            vet: true,
                            medications: {
                                include: { inventory: true }
                            },
                            admission: {
                                include: {
                                    cage: {
                                        include: { ward: true }
                                    }
                                }
                            },
                            labTests: {
                                include: { files: true }
                            }
                        }
                    },
                    invoice: {
                        include: { items: true }
                    },
                    appointments: {
                        include: { pet: true }
                    }
                },
                skip,
                take: limit,
                orderBy: { visitDate: 'desc' }
            }),
            this.prisma.visit.count({ where }),
        ]);

        // Post-process to add signed URLs for lab test files
        for (const visit of data) {
            for (const record of visit.medicalRecords) {
                if (record.labTests) {
                    for (const lab of record.labTests) {
                        if (lab.files) {
                            for (const file of lab.files) {
                                file.url = await this.minioService.getFileUrl(file.url);
                            }
                        }
                    }
                }
            }
        }

        return {
            data,
            meta: {
                total,
                page,
                lastPage: Math.ceil(total / limit),
            },
        };
    }

    async findOne(id: string, tx?: any) {
        const client = tx || this.prisma;
        const visit = await (client.visit as any).findUnique({
            where: { id },
            include: {
                customer: true,
                medicalRecords: {
                    include: {
                        pet: true,
                        vet: true,
                        medications: {
                            include: { inventory: true }
                        },
                        admission: {
                            include: {
                                cage: {
                                    include: { ward: true }
                                }
                            }
                        },
                        labTests: {
                            include: { files: true }
                        }
                    }
                },
                invoice: {
                    include: { items: true }
                },
                appointments: {
                    include: { pet: true }
                }
            }
        });

        if (visit) {
            for (const record of visit.medicalRecords) {
                if (record.labTests) {
                    for (const lab of record.labTests) {
                        if (lab.files) {
                            for (const file of lab.files) {
                                file.url = await this.minioService.getFileUrl(file.url);
                            }
                        }
                    }
                }
            }
        }

        return visit;
    }
}
