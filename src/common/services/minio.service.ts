import { Injectable, OnModuleInit, InternalServerErrorException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as Minio from 'minio';

@Injectable()
export class MinioService implements OnModuleInit {
    private minioClient: Minio.Client;
    private readonly bucketName: string;

    constructor(private configService: ConfigService) {
        this.minioClient = new Minio.Client({
            endPoint: this.configService.get<string>('MINIO_ENDPOINT', 'localhost'),
            port: parseInt(this.configService.get<string>('MINIO_PORT', '9000')),
            useSSL: this.configService.get<string>('MINIO_USE_SSL') === 'true',
            accessKey: this.configService.get<string>('MINIO_ACCESS_KEY', 'minioadmin'),
            secretKey: this.configService.get<string>('MINIO_SECRET_KEY', 'minioadmin'),
        });
        this.bucketName = this.configService.get<string>('MINIO_BUCKET_NAME', 'lab-tests');
    }

    async onModuleInit() {
        const bucketExists = await this.minioClient.bucketExists(this.bucketName);
        if (!bucketExists) {
            await this.minioClient.makeBucket(this.bucketName);
            // Optional: Set bucket policy to public-read for easier access if desired, 
            // but for medical data, signed URLs are better.
        }
    }

    async uploadFile(fileName: string, base64Data: string, contentType: string): Promise<string> {
        try {
            const buffer = Buffer.from(base64Data.replace(/^data:.*?;base64,/, ''), 'base64');
            const objectName = `${Date.now()}-${fileName}`;
            
            await this.minioClient.putObject(this.bucketName, objectName, buffer, buffer.length, {
                'Content-Type': contentType,
            });

            return objectName;
        } catch (error) {
            console.error('MinIO Upload Error:', error);
            throw new InternalServerErrorException('Failed to upload file to storage');
        }
    }

    async getFileUrl(objectName: string): Promise<string> {
        try {
            // Generates a signed URL valid for 24 hours
            return await this.minioClient.presignedGetObject(this.bucketName, objectName, 24 * 60 * 60);
        } catch (error) {
            console.error('MinIO Get URL Error:', error);
            return '';
        }
    }
}
