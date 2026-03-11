import { Module } from '@nestjs/common';
import { MedicalRecordsController } from './medical-records.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { MinioService } from '../common/services/minio.service';

@Module({
    imports: [PrismaModule],
    controllers: [MedicalRecordsController],
    providers: [MinioService]
})
export class MedicalRecordsModule { }
