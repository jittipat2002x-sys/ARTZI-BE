import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { UpdateTenantStatusDto, SubmitRenewalDto } from './dto/tenant.dto';

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
        
        // If approved, extend expiry date
        if (updateDto.status === 'APPROVED') {
            const now = new Date();
            let newExpiry: Date;
            let baseDate: Date;

            if (updateDto.planExpiresAt) {
                newExpiry = new Date(updateDto.planExpiresAt);
                baseDate = now; // For the transaction log, we start from now if it's a manual set
            } else {
                // Default: Extend by 30 days
                // If current plan is already valid, extend from current expiry. 
                // If expired or null, start from NOW.
                baseDate = (tenant.planExpiresAt && new Date(tenant.planExpiresAt) > now) 
                    ? new Date(tenant.planExpiresAt) 
                    : now;
                
                newExpiry = new Date(baseDate);
                newExpiry.setDate(newExpiry.getDate() + 30); // Extend by 30 days
            }

            data.planExpiresAt = newExpiry;

            // Log to Subscription history
            await this.prisma.subscription.create({
                data: {
                    tenantId: id,
                    planName: updateDto.activePlan || tenant.activePlan || 'FREE',
                    amountPaid: 0, // Manual tracking
                    billingCycle: 'MONTHLY',
                    startDate: baseDate,
                    endDate: newExpiry,
                    paymentStatus: 'PAID',
                }
            });
        }

        return this.prisma.tenant.update({
            where: { id },
            data,
        });
    }

    async submitRenewal(tenantId: string, dto: SubmitRenewalDto) {
        const tenant = await this.prisma.tenant.findUnique({ where: { id: tenantId } });
        if (!tenant) throw new NotFoundException('Clinic not found');

        return this.prisma.tenant.update({
            where: { id: tenantId },
            data: {
                status: 'RENEW_PENDING',
                paymentSlipUrl: dto.paymentSlipUrl,
            }
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

    async getSubscriptions(tenantId: string) {
        return this.prisma.subscription.findMany({
            where: { tenantId },
            orderBy: { createdAt: 'desc' },
        });
    }
}
