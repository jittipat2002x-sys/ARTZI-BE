import { IsString, IsNotEmpty, IsOptional, IsUUID, IsBoolean, IsNumber } from 'class-validator';
import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';

export class CreateCageDto {
    @ApiProperty()
    @IsNotEmpty()
    @IsUUID()
    wardId: string;

    @ApiProperty()
    @IsNotEmpty()
    @IsString()
    name: string;

    @ApiPropertyOptional()
    @IsOptional()
    @IsString()
    type?: string;

    @ApiPropertyOptional()
    @IsOptional()
    @IsString()
    size?: string;

    @ApiPropertyOptional()
    @IsOptional()
    @IsBoolean()
    isActive?: boolean;

    @ApiPropertyOptional()
    @IsOptional()
    @IsNumber()
    defaultPrice?: number;
}

export class UpdateCageDto extends PartialType(CreateCageDto) { }
