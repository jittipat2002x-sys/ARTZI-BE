import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class MasterDataService {
    constructor(private prisma: PrismaService) { }

    // Product Categories
    async getAllProductCategories() {
        return this.prisma.masterProductCategory.findMany({
            where: { isActive: true },
            orderBy: { nameTh: 'asc' },
        });
    }

    async createProductCategory(data: any) {
        return this.prisma.masterProductCategory.create({ data });
    }

    async updateProductCategory(id: string, data: any) {
        return this.prisma.masterProductCategory.update({
            where: { id },
            data,
        });
    }

    async deleteProductCategory(id: string) {
        return this.prisma.masterProductCategory.update({
            where: { id },
            data: { isActive: false },
        });
    }

    // Medicine Categories
    async getAllMedicineCategories() {
        return this.prisma.masterMedicineCategory.findMany({
            where: { isActive: true },
            orderBy: { nameTh: 'asc' },
        });
    }

    async createMedicineCategory(data: any) {
        return this.prisma.masterMedicineCategory.create({ data });
    }

    async updateMedicineCategory(id: string, data: any) {
        return this.prisma.masterMedicineCategory.update({
            where: { id },
            data,
        });
    }

    async deleteMedicineCategory(id: string) {
        return this.prisma.masterMedicineCategory.update({
            where: { id },
            data: { isActive: false },
        });
    }

    // Units
    async getAllUnits(medicineCategoryId?: string) {
        return this.prisma.masterUnit.findMany({
            where: {
                isActive: true,
                ...(medicineCategoryId && {
                    OR: [
                        { medicineCategoryId },
                        { medicineCategoryId: null },
                    ],
                }),
            },
            include: { medicineCategory: true },
            orderBy: { nameTh: 'asc' },
        });
    }

    async createUnit(data: any) {
        return this.prisma.masterUnit.create({ data });
    }

    async updateUnit(id: string, data: any) {
        return this.prisma.masterUnit.update({
            where: { id },
            data,
        });
    }

    async deleteUnit(id: string) {
        return this.prisma.masterUnit.update({
            where: { id },
            data: { isActive: false },
        });
    }

    // Usage Instructions
    async getAllUsageInstructions(type?: 'FREQUENCY' | 'TIME') {
        return this.prisma.masterUsageInstruction.findMany({
            where: {
                isActive: true,
                ...(type && { type }),
            },
            orderBy: { nameTh: 'asc' },
        });
    }

    async createUsageInstruction(data: any) {
        return this.prisma.masterUsageInstruction.create({ data });
    }

    async updateUsageInstruction(id: string, data: any) {
        return this.prisma.masterUsageInstruction.update({
            where: { id },
            data,
        });
    }

    async deleteUsageInstruction(id: string) {
        return this.prisma.masterUsageInstruction.update({
            where: { id },
            data: { isActive: false },
        });
    }
}
