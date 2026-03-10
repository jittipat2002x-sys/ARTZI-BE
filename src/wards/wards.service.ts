import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateWardDto, UpdateWardDto } from './dto/ward.dto';
import { CreateCageDto, UpdateCageDto } from './dto/cage.dto';

@Injectable()
export class WardsService {
    constructor(private prisma: PrismaService) { }

    // Wards
    async createWard(createWardDto: CreateWardDto) {
        return this.prisma.ward.create({
            data: createWardDto,
        });
    }

    async findAllWards(branchId: string) {
        return this.prisma.ward.findMany({
            where: { branchId },
            include: {
                cages: {
                    include: {
                        admissions: {
                            where: { status: 'ADMITTED' },
                            include: {
                                pet: {
                                    include: { customer: true }
                                }
                            },
                        },
                    },
                    orderBy: { name: 'asc' }
                },
            },
            orderBy: { name: 'asc' }
        });
    }

    async findOneWard(id: string) {
        const ward = await this.prisma.ward.findUnique({
            where: { id },
            include: { cages: true },
        });
        if (!ward) throw new NotFoundException('Ward not found');
        return ward;
    }

    async updateWard(id: string, updateWardDto: UpdateWardDto) {
        return this.prisma.ward.update({
            where: { id },
            data: updateWardDto,
        });
    }

    async removeWard(id: string) {
        // Check if any cage in this ward has admissions
        const wardWithAdmissions = await this.prisma.ward.findUnique({
            where: { id },
            include: {
                cages: {
                    include: {
                        _count: {
                            select: { admissions: true }
                        }
                    }
                }
            }
        });

        if (!wardWithAdmissions) throw new NotFoundException('Ward not found');

        const totalAdmissions = wardWithAdmissions.cages.reduce((sum, cage) => sum + cage._count.admissions, 0);

        if (totalAdmissions > 0) {
            throw new BadRequestException('ไม่สามารถลบหออภิบาลนี้ได้ เนื่องจากมีประวัติการเข้าพักในกรงภายในหอนี้ แนะนำให้เลือกปิดการใช้งานกรงแทน');
        }

        return this.prisma.ward.delete({
            where: { id },
        });
    }

    // Cages
    async createCage(createCageDto: CreateCageDto) {
        return this.prisma.cage.create({
            data: createCageDto,
        });
    }

    async updateCage(id: string, updateCageDto: UpdateCageDto) {
        return this.prisma.cage.update({
            where: { id },
            data: updateCageDto,
        });
    }

    async removeCage(id: string) {
        // Check if cage has any admissions
        const cageWithAdmissions = await this.prisma.cage.findUnique({
            where: { id },
            include: {
                _count: {
                    select: { admissions: true }
                }
            }
        });

        if (!cageWithAdmissions) throw new NotFoundException('Cage not found');

        if (cageWithAdmissions._count.admissions > 0) {
            throw new BadRequestException('ไม่สามารถลบกรงนี้ได้ เนื่องจากมีประวัติการเข้าพักมาแล้ว แนะนำให้เลือกปิดการใช้งานกรงแทน');
        }

        return this.prisma.cage.delete({
            where: { id },
        });
    }
}
