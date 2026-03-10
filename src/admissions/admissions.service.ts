import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateAdmissionDto, DischargeAdmissionDto, UpdateAdmissionDetailsDto } from './dto/admission.dto';

@Injectable()
export class AdmissionsService {
    constructor(private prisma: PrismaService) { }

    async admit(createAdmissionDto: CreateAdmissionDto) {
        // Multiple pets per cage is now allowed (e.g. same owner)

        return (this.prisma as any).admission.create({
            data: {
                ...createAdmissionDto,
                status: 'ADMITTED',
                admittedAt: new Date(),
            },
            include: {
                pet: true,
                cage: true
            }
        });
    }

    async discharge(id: string, dischargeDto: DischargeAdmissionDto) {
        const admission = await this.prisma.admission.findUnique({
            where: { id },
        });

        if (!admission) throw new NotFoundException('Admission not found');
        if (admission.status === 'DISCHARGED') {
            throw new BadRequestException('Already discharged');
        }

        return this.prisma.admission.update({
            where: { id },
            data: {
                status: 'DISCHARGED',
                dischargedAt: new Date(),
                notes: dischargeDto.notes || admission.notes,
            },
        });
    }

    async transfer(id: string, cageId: string) {
        const admission = await this.prisma.admission.findUnique({
            where: { id },
        });

        if (!admission) throw new NotFoundException('Admission not found');
        if (admission.status === 'DISCHARGED') {
            throw new BadRequestException('Cannot transfer a discharged pet');
        }

        return this.prisma.admission.update({
            where: { id },
            data: { cageId },
            include: {
                pet: true,
                cage: {
                    include: { ward: true }
                }
            }
        });
    }

    async findAllActive(branchId: string) {
        return this.prisma.admission.findMany({
            where: {
                branchId,
                status: 'ADMITTED',
            },
            include: {
                pet: {
                    include: { customer: true },
                },
                cage: {
                    include: { ward: true },
                },
            },
        });
    }

    async getAdmissionHistory(petId: string) {
        return this.prisma.admission.findMany({
            where: { petId },
            include: {
                cage: {
                    include: { ward: true },
                },
            },
            orderBy: { createdAt: 'desc' },
        });
    }

    async updateAdmission(id: string, updateDto: UpdateAdmissionDetailsDto) {
        const admission = await this.prisma.admission.findUnique({
            where: { id },
        });

        if (!admission) throw new NotFoundException('Admission not found');

        return this.prisma.admission.update({
            where: { id },
            data: updateDto,
            include: {
                pet: {
                    include: { customer: true }
                },
                cage: {
                    include: { ward: true }
                }
            }
        });
    }

    async remove(id: string) {
        const admission = await this.prisma.admission.findUnique({
            where: { id },
        });

        if (!admission) throw new NotFoundException('Admission not found');

        return (this.prisma as any).admission.delete({
            where: { id },
        });
    }
}
