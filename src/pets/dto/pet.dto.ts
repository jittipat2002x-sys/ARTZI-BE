import { IsString, IsNotEmpty, IsOptional, IsUUID, IsNumber, IsDateString } from 'class-validator';
import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';

export class CreatePetDto {
    @ApiProperty()
    @IsNotEmpty()
    @IsUUID()
    tenantId: string;

    @ApiProperty()
    @IsNotEmpty()
    @IsUUID()
    customerId: string;

    @ApiProperty()
    @IsNotEmpty()
    @IsString()
    name: string;

    @ApiProperty()
    @IsNotEmpty()
    @IsString()
    species: string;

    @ApiPropertyOptional()
    @IsOptional()
    @IsString()
    breed?: string;

    @ApiPropertyOptional()
    @IsOptional()
    @IsString()
    sex?: string;

    @ApiPropertyOptional()
    @IsOptional()
    @IsDateString()
    birthDate?: string | Date;

    @ApiPropertyOptional()
    @IsOptional()
    @IsString()
    color?: string;

    @ApiPropertyOptional()
    @IsOptional()
    @IsNumber()
    weight?: number;

    @ApiPropertyOptional()
    @IsOptional()
    @IsString()
    tagId?: string;

    @ApiPropertyOptional()
    @IsOptional()
    @IsUUID()
    branchId?: string;
}

export class UpdatePetDto extends PartialType(CreatePetDto) { }
