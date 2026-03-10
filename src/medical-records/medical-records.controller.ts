import { Body, Controller, Get, Param, Patch } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { UpdateMedicalTreatmentDto } from './dto/update-medical-treatment.dto';

@Controller('medical-records')
export class MedicalRecordsController {
    constructor(private readonly prisma: PrismaService) { }

    @Get('pet/:petId')
    async getPetHistory(@Param('petId') petId: string) {
        return this.prisma.medicalRecord.findMany({
            where: { petId },
            include: {
                vet: {
                    select: { id: true, firstName: true, lastName: true }
                },
                visit: {
                    include: {
                        invoice: {
                            include: { items: true }
                        }
                    }
                },
                pet: {
                    include: {
                        appointments: {
                            where: { status: 'SCHEDULED' },
                            orderBy: { date: 'asc' }
                        }
                    }
                },
                medications: {
                    include: {
                        inventory: {
                            select: {
                                id: true,
                                name: true,
                                type: true,
                                medicineType: true,
                                masterMedicineCategory: {
                                    select: { nameTh: true }
                                }
                            }
                        }
                    }
                },
                admission: {
                    include: {
                        cage: {
                            include: { ward: true }
                        }
                    }
                }
            },
            orderBy: { visitDate: 'desc' }
        });
    }

    @Patch('medication/:id')
    async updateMedication(@Param('id') id: string, @Body() dto: UpdateMedicalTreatmentDto) {
        return this.prisma.medicalTreatment.update({
            where: { id },
            data: { dosage: dto.dosage }
        });
    }
}
