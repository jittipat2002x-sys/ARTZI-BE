import { Module } from '@nestjs/common';
import { VisitsController } from './visits.controller';
import { VisitsService } from './visits.service';
import { MinioService } from '../common/services/minio.service';

@Module({
  controllers: [VisitsController],
  providers: [VisitsService, MinioService]
})
export class VisitsModule {}
