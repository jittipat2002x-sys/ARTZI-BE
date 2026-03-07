import { Module } from '@nestjs/common';
import { MedicalRecordsController } from './medical-records.controller';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
    imports: [PrismaModule],
    controllers: [MedicalRecordsController]
})
export class MedicalRecordsModule { }
