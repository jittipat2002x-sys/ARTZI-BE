import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateInventoryDto, UpdateInventoryDto } from './dto/inventory.dto';
import { ProductType, MedicineType } from '@prisma/client';

@Injectable()
export class InventoryService {
    constructor(private prisma: PrismaService) { }

    async create(createInventoryDto: CreateInventoryDto) {
        const data: any = { ...createInventoryDto };

        // Service type doesn't need quantity and cost
        if (data.type === 'SERVICE') {
            data.quantity = 0;
            data.cost = 0;
            data.lotNumber = null;
            data.expirationDate = null;
        }

        if (data.expirationDate) {
            data.expirationDate = new Date(data.expirationDate);
        }

        const item = await this.prisma.inventory.create({
            data,
            include: {
                category: true,
                masterMedicineCategory: true,
                masterUnit: true,
                masterUsageUnit: true,
                masterUsageFrequency: true,
                masterUsageTime: true,
            }
        });
        return item;
    }

    async findAll(tenantId: string, branchId?: string, type?: ProductType, medicineType?: MedicineType, search?: string, page: number = 1, limit: number = 10, stockAlert: boolean = false, isActive?: boolean) {
        const where: any = {
            branch: { tenantId }
        };

        if (isActive !== undefined) {
            where.isActive = isActive;
        }

        if (branchId) {
            where.branchId = branchId;
        }

        if (type) {
            where.type = type;
        }

        if (medicineType) {
            where.medicineType = medicineType;
        }

        if (search) {
            where.name = {
                contains: search,
                mode: 'insensitive',
            };
        }

        if (stockAlert) {
            where.OR = [
                {
                    quantity: {
                        lte: this.prisma.inventory.fields.lowStockThreshold // This might not work based on prisma version. Let's see what happens.
                    }
                },
                // Fallback, if lowStockThreshold is null, consider it low stock if quantity <= 0
                {
                    lowStockThreshold: null,
                    quantity: {
                        lte: 0
                    }
                }
            ];
            where.type = {
                not: 'SERVICE'
            };
        }

        const skip = (page - 1) * limit;

        const [items, total] = await Promise.all([
            this.prisma.inventory.findMany({
                where,
                include: {
                    branch: true,
                    category: true,
                    masterMedicineCategory: true,
                    masterUnit: true,
                    masterUsageUnit: true,
                    masterUsageFrequency: true,
                    masterUsageTime: true,
                },
                orderBy: { createdAt: 'desc' },
                skip,
                take: limit,
            }),
            this.prisma.inventory.count({ where })
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

    async findOne(id: string, tenantId: string) {
        const item = await this.prisma.inventory.findFirst({
            where: {
                id,
                branch: { tenantId }
            },
            include: {
                category: true,
                masterMedicineCategory: true,
                masterUnit: true,
                masterUsageUnit: true,
                masterUsageFrequency: true,
                masterUsageTime: true,
            }
        });
        if (!item) {
            throw new NotFoundException(`Inventory item with ID ${id} not found`);
        }
        return item;
    }

    async update(id: string, updateInventoryDto: UpdateInventoryDto, tenantId: string) {
        await this.findOne(id, tenantId); // Ensure it exists and belongs to tenant

        const data: any = { ...updateInventoryDto };

        if (data.type !== 'MEDICINE') {
            data.medicineType = 'NONE';
            data.usageAmount = null;
            data.usageUnit = null;
            data.usageFrequency = null;
            data.usageTime = null;
            data.usageMorning = false;
            data.usageNoon = false;
            data.usageEvening = false;
            data.usageNight = false;
            data.usageRemark = null;

            // Also clear master data relations if not appropriate
            data.masterMedicineCategoryId = null;
            data.usageUnitId = null;
            data.usageFrequencyId = null;
            data.usageTimeId = null;

            if (data.type === 'SERVICE') {
                data.quantity = 0;
                data.cost = 0;
                data.lotNumber = null;
                data.expirationDate = null;
            }
        }

        if (data.expirationDate) {
            data.expirationDate = new Date(data.expirationDate);
        }

        return this.prisma.inventory.update({
            where: { id },
            data,
            include: {
                category: true,
                masterMedicineCategory: true,
                masterUnit: true,
                masterUsageUnit: true,
                masterUsageFrequency: true,
                masterUsageTime: true,
            }
        });
    }

    async remove(id: string, tenantId: string) {
        const item = await this.prisma.inventory.findFirst({
            where: {
                id,
                branch: { tenantId }
            },
            include: {
                _count: {
                    select: {
                        prescriptions: true,
                        invoiceItems: true,
                    }
                }
            }
        });

        if (!item) {
            throw new NotFoundException(`Inventory item with ID ${id} not found`);
        }

        if (item._count.prescriptions > 0 || item._count.invoiceItems > 0) {
            throw new BadRequestException('ไม่สามารถลบรายการนี้ได้ เนื่องจากมีประวัติการใช้งานในใบสั่งยาหรือใบแจ้งหนี้แล้ว แนะนำให้เลือกปิดการใช้งานรายการแทน');
        }

        return this.prisma.inventory.delete({
            where: { id },
        });
    }

    async toggleStatus(id: string, tenantId: string, isActive: boolean) {
        await this.findOne(id, tenantId);
        return this.prisma.inventory.update({
            where: { id },
            data: { isActive },
        });
    }
}
