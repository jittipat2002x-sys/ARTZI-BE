import { Module } from '@nestjs/common';
import { ConsentTemplatesController } from './consent-templates.controller';
import { SignedConsentFormsController } from './signed-consent-forms.controller';
import { ConsentFormsService } from './consent-forms.service';
import { PrismaModule } from '../prisma/prisma.module';
import { MinioService } from '../common/services/minio.service';

@Module({
  imports: [PrismaModule],
  controllers: [ConsentTemplatesController, SignedConsentFormsController],
  providers: [ConsentFormsService, MinioService],
  exports: [ConsentFormsService],
})
export class ConsentFormsModule {}
