import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class AppointmentsService {
    constructor(private readonly prisma: PrismaService) { }

    async findAll(
        tenantId: string,
        userBranchIds: string[],
        page = 1,
        limit = 10,
        status?: string,
        branchId?: string,
        dateStr?: string
    ) {
        const skip = (page - 1) * limit;
        let whereClause: any = {};

        // 1. Mandatory Scope: User's assigned branches or tenant
        if (userBranchIds && userBranchIds.length > 0) {
            whereClause.branchId = { in: userBranchIds };
        } else if (tenantId) {
            whereClause.branch = { tenantId };
        }

        // 2. Specific Filters
        if (branchId && branchId !== 'all') {
            // Ensure the requested branch is within the user's allowed branches
            if (userBranchIds.length > 0 && !userBranchIds.includes(branchId)) {
                // Return empty if asking for branch they don't have access to
                return { data: [], meta: { total: 0, page, lastPage: 0 } };
            }
            whereClause.branchId = branchId;
        }

        if (status && status !== 'all') {
            whereClause.status = status;
        }

        if (dateStr) {
            // Assume dateStr is 'YYYY-MM-DD'
            const startOfDay = new Date(`${dateStr}T00:00:00.000+07:00`);
            const endOfDay = new Date(`${dateStr}T23:59:59.999+07:00`);
            whereClause.date = {
                gte: startOfDay,
                lte: endOfDay,
            };
        }

        const [data, total] = await Promise.all([
            this.prisma.appointment.findMany({
                where: whereClause,
                include: {
                    pet: {
                        include: {
                            customer: true
                        }
                    },
                    vet: {
                        select: {
                            id: true,
                            firstName: true,
                            lastName: true,
                        }
                    },
                    branch: {
                        select: {
                            id: true,
                            name: true,
                        }
                    }
                },
                skip,
                take: limit,
                orderBy: { date: 'desc' }, // Latest first as requested
            }),
            this.prisma.appointment.count({ where: whereClause })
        ]);

        return {
            data,
            meta: {
                total,
                page,
                lastPage: Math.ceil(total / limit),
            },
        };
    }

    async update(id: string, updateData: any) {
        const appointment = await this.prisma.appointment.findUnique({ where: { id } });
        if (!appointment) {
            throw new NotFoundException(`Appointment with ID ${id} not found`);
        }

        // allowed fields to update: date, reason, status, vetId
        const dataToUpdate: any = {};
        if (updateData.date) dataToUpdate.date = new Date(updateData.date);
        if (updateData.reason) dataToUpdate.reason = updateData.reason;
        if (updateData.status) dataToUpdate.status = updateData.status;
        if (updateData.vetId) dataToUpdate.vetId = updateData.vetId;

        return this.prisma.appointment.update({
            where: { id },
            data: dataToUpdate,
            include: {
                pet: {
                    include: { customer: true }
                },
                vet: true
            }
        });
    }
}
