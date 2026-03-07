import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { UpdateTenantStatusDto } from './dto/tenant.dto';

@Injectable()
export class TenantsService {
    constructor(private prisma: PrismaService) { }

    async findAll(status?: string, page: number = 1, limit: number = 10, search?: string) {
        const where: any = status ? { status } : {};

        if (search) {
            where.OR = [
                { name: { contains: search, mode: 'insensitive' } },
                { email: { contains: search, mode: 'insensitive' } },
            ];
        }
        const skip = (page - 1) * limit;

        const [items, total] = await Promise.all([
            this.prisma.tenant.findMany({
                where,
                include: {
                    _count: {
                        select: { branches: true, users: true }
                    }
                },
                orderBy: { createdAt: 'desc' },
                skip,
                take: limit,
            }),
            this.prisma.tenant.count({ where })
        ]);

        return {
            data: items,
            meta: {
                total,
                page,
                limit,
                lastPage: Math.ceil(total / limit),
            }
        };
    }

    async findOne(id: string) {
        const tenant = await this.prisma.tenant.findUnique({
            where: { id },
            include: {
                branches: true,
                users: {
                    select: {
                        id: true,
                        email: true,
                        firstName: true,
                        lastName: true,
                        roleRef: {
                            select: {
                                id: true,
                                name: true,
                            }
                        },
                    }
                },
                approvedBy: {
                    select: {
                        id: true,
                        firstName: true,
                        lastName: true,
                    }
                }
            },
        });

        if (!tenant) {
            throw new NotFoundException('Clinic not found');
        }

        return tenant;
    }

    async updateStatus(id: string, updateDto: UpdateTenantStatusDto, adminId: string) {
        const tenant = await this.prisma.tenant.findUnique({ where: { id } });
        if (!tenant) {
            throw new NotFoundException('Clinic not found');
        }

        const data: any = {
            status: updateDto.status,
            approvedById: updateDto.status === 'APPROVED' ? adminId : undefined,
            approvedAt: updateDto.status === 'APPROVED' ? new Date() : undefined,
            isActive: updateDto.status === 'APPROVED',
        };

        if (updateDto.activePlan) data.activePlan = updateDto.activePlan;
        if (updateDto.planExpiresAt) data.planExpiresAt = new Date(updateDto.planExpiresAt);

        return this.prisma.tenant.update({
            where: { id },
            data,
        });
    }

    async delete(id: string) {
        const tenant = await this.prisma.tenant.findUnique({ where: { id } });
        if (!tenant) {
            throw new NotFoundException('Clinic not found');
        }
        return this.prisma.tenant.delete({ where: { id } });
    }
    async updateBranding(tenantId: string, data: { brandColor?: string; logoUrl?: string }) {
        const tenant = await this.prisma.tenant.findUnique({ where: { id: tenantId } });
        if (!tenant) {
            throw new NotFoundException('Clinic not found');
        }
        return this.prisma.tenant.update({
            where: { id: tenantId },
            data: {
                brandColor: data.brandColor,
                logoUrl: data.logoUrl,
            },
        });
    }
}
