import { IsString, IsNotEmpty, IsOptional, IsUUID } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateAdmissionDto {
    @ApiProperty()
    @IsNotEmpty()
    @IsUUID()
    branchId: string;

    @ApiProperty()
    @IsNotEmpty()
    @IsUUID()
    petId: string;

    @ApiProperty()
    @IsNotEmpty()
    @IsUUID()
    cageId: string;

    @ApiPropertyOptional()
    @IsOptional()
    @IsString()
    notes?: string;

    @ApiPropertyOptional()
    @IsOptional()
    isBoarding?: boolean;

    @ApiPropertyOptional()
    @IsOptional()
    dailyPrice?: number;

    @ApiPropertyOptional()
    @IsOptional()
    estimatedDays?: number;
}

export class UpdateAdmissionDetailsDto {
    @ApiPropertyOptional()
    @IsOptional()
    isBoarding?: boolean;

    @ApiPropertyOptional()
    @IsOptional()
    dailyPrice?: number;

    @ApiPropertyOptional()
    @IsOptional()
    estimatedDays?: number;

    @ApiPropertyOptional()
    @IsOptional()
    @IsString()
    notes?: string;

    @ApiPropertyOptional()
    @IsOptional()
    @IsString()
    reason?: string;
}

export class DischargeAdmissionDto {
    @ApiPropertyOptional()
    @IsOptional()
    @IsString()
    notes?: string;
}

export class TransferAdmissionDto {
    @ApiProperty()
    @IsNotEmpty()
    @IsUUID()
    cageId: string;
}
