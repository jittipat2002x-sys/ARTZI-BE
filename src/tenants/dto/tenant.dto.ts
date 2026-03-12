import { IsString, IsOptional, IsEnum, IsEmail } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export enum TenantStatus {
    PENDING = 'PENDING',
    APPROVED = 'APPROVED',
    REJECTED = 'REJECTED',
    RENEW_PENDING = 'RENEW_PENDING',
}

export class UpdateTenantStatusDto {
    @ApiProperty({ enum: TenantStatus })
    @IsEnum(TenantStatus)
    status: TenantStatus;

    @ApiProperty({ required: false })
    @IsString()
    @IsOptional()
    reason?: string;

    @ApiProperty({ required: false })
    @IsString()
    @IsOptional()
    activePlan?: string;

    @ApiProperty({ required: false })
    @IsString()
    @IsOptional()
    planExpiresAt?: string;
}

export class CreateTenantDto {
    @ApiProperty()
    @IsString()
    name: string;

    @ApiProperty()
    @IsEmail()
    email: string;

    @ApiProperty({ required: false })
    @IsString()
    @IsOptional()
    phone?: string;

    @ApiProperty({ required: false })
    @IsString()
    @IsOptional()
    taxId?: string;

    @ApiProperty({ required: false })
    @IsString()
    @IsOptional()
    description?: string;

    @ApiProperty({ required: false })
    @IsString()
    @IsOptional()
    paymentSlipUrl?: string;
}

export class UpdateBrandingDto {
    @ApiProperty({ required: false, description: 'สีหลักของคลินิก เช่น #FF6B35' })
    @IsString()
    @IsOptional()
    brandColor?: string;

    @ApiProperty({ required: false, description: 'สีหลักในโหมดมืด (Dark Mode)' })
    @IsString()
    @IsOptional()
    brandColorDark?: string;

    @ApiProperty({ required: false, description: 'Logo คลินิก (base64 data URI)' })
    @IsString()
    @IsOptional()
    logoUrl?: string;
}

export class SubmitRenewalDto {
    @ApiProperty({ description: 'URL of the new payment slip' })
    @IsString()
    paymentSlipUrl: string;
}
