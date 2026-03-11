import { Body, Controller, Get, Param, Patch } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { UpdateMedicalTreatmentDto } from './dto/update-medical-treatment.dto';
import { MinioService } from '../common/services/minio.service';

@Controller('medical-records')
export class MedicalRecordsController {
    constructor(
        private readonly prisma: PrismaService,
        private readonly minioService: MinioService
    ) { }

    @Get('pet/:petId')
    async getPetHistory(@Param('petId') petId: string) {
        const records = await this.prisma.medicalRecord.findMany({
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
                },
                labTests: {
                    include: { files: true }
                }
            },
            orderBy: { visitDate: 'desc' }
        });

        console.log('--- DEBUG PET HISTORY ---');
        if (records && records.length > 0) {
            console.log('First record labTests keys:', Object.keys(records[0].labTests || {}));
            console.log('Record 0 labTests:', JSON.stringify(records[0].labTests));
        }

        if (records) {
            for (const record of records) {
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

        return records;
    }

    @Patch('medication/:id')
    async updateMedication(@Param('id') id: string, @Body() dto: UpdateMedicalTreatmentDto) {
        return this.prisma.medicalTreatment.update({
            where: { id },
            data: { dosage: dto.dosage }
        });
    }
}
