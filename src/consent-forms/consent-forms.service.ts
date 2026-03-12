import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { MinioService } from '../common/services/minio.service';

@Injectable()
export class ConsentFormsService {
  constructor(
    private prisma: PrismaService,
    private minioService: MinioService,
  ) {}

  // Template Methods
  async findAllTemplates(tenantId: string) {
    return this.prisma.consentTemplate.findMany({
      where: { tenantId, isActive: true },
    });
  }

  async findTemplateById(id: string) {
    return this.prisma.consentTemplate.findUnique({
      where: { id },
    });
  }

  async createTemplate(tenantId: string, data: { name: string; content: string }) {
    return this.prisma.consentTemplate.create({
      data: {
        ...data,
        tenantId,
      },
    });
  }

  async updateTemplate(id: string, data: { name?: string; content?: string; isActive?: boolean }) {
    return this.prisma.consentTemplate.update({
      where: { id },
      data,
    });
  }

  // Signed Form Methods
  async signForm(data: {
    templateId: string;
    petId: string;
    medicalRecordId?: string;
    signedBy: string;
    signatureBase64: string;
    contentSnapshot: string;
  }) {
    // 1. Upload signature to MinIO
    const fileName = `signature-${data.petId}.png`;
    const objectName = await this.minioService.uploadFile(fileName, data.signatureBase64, 'image/png');

    // 2. Save to database
    return this.prisma.signedConsentForm.create({
      data: {
        templateId: data.templateId,
        petId: data.petId,
        medicalRecordId: data.medicalRecordId,
        signedBy: data.signedBy,
        signatureUrl: objectName,
        contentSnapshot: data.contentSnapshot,
      },
    });
  }

  async findSignedFormsByPet(petId: string) {
    const forms = await this.prisma.signedConsentForm.findMany({
      where: { petId },
      include: { template: true },
      orderBy: { createdAt: 'desc' },
    });

    // Finalize URLs for frontend preview
    const result = [];
    for (const form of forms) {
      result.push({
        ...form,
        signatureUrl: await this.minioService.getFileUrl(form.signatureUrl)
      });
    }

    return result;
  }
}
