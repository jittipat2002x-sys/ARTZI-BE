import { IsString, IsNumber, IsOptional, IsEnum, IsDateString, IsNotEmpty, IsUUID, IsBoolean } from 'class-validator';
import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import { ProductType, MedicineType } from '@prisma/client';

export class CreateInventoryDto {
    @ApiProperty()
    @IsNotEmpty()
    @IsUUID()
    branchId: string;

    @ApiProperty()
    @IsString()
    name: string;

    @ApiPropertyOptional()
    @IsOptional()
    @IsBoolean()
    isActive?: boolean;

    @ApiProperty({ enum: ProductType })
    @IsEnum(ProductType)
    type: ProductType;

    @ApiPropertyOptional({ enum: MedicineType })
    @IsOptional()
    @IsEnum(MedicineType)
    medicineType?: MedicineType;

    @ApiPropertyOptional()
    @IsOptional()
    @IsString()
    description?: string;

    @ApiProperty()
    @IsNumber()
    price: number;

    @ApiPropertyOptional()
    @IsOptional()
    @IsNumber()
    cost?: number;

    @ApiPropertyOptional()
    @IsOptional()
    @IsNumber()
    quantity?: number;

    @ApiPropertyOptional()
    @IsOptional()
    @IsNumber()
    lowStockThreshold?: number;

    @ApiPropertyOptional()
    @IsOptional()
    @IsString()
    unit?: string;

    @ApiPropertyOptional()
    @IsOptional()
    @IsString()
    lotNumber?: string;

    @ApiPropertyOptional()
    @IsOptional()
    @IsString()
    barcode?: string;

    @ApiPropertyOptional()
    @IsOptional()
    @IsDateString()
    expirationDate?: string;

    @ApiPropertyOptional()
    @IsOptional()
    @IsUUID()
    categoryId?: string;

    @ApiPropertyOptional()
    @IsOptional()
    @IsUUID()
    masterMedicineCategoryId?: string;

    @ApiPropertyOptional()
    @IsOptional()
    @IsUUID()
    unitId?: string;

    @ApiPropertyOptional()
    @IsOptional()
    @IsUUID()
    usageUnitId?: string;

    @ApiPropertyOptional()
    @IsOptional()
    @IsUUID()
    usageFrequencyId?: string;

    @ApiPropertyOptional()
    @IsOptional()
    @IsUUID()
    usageTimeId?: string;

    // Drug Usage Instructions
    @ApiPropertyOptional()
    @IsOptional()
    @IsString()
    usageAmount?: string;

    @ApiPropertyOptional()
    @IsOptional()
    @IsString()
    usageUnit?: string;

    @ApiPropertyOptional()
    @IsOptional()
    @IsString()
    usageFrequency?: string;

    @ApiPropertyOptional()
    @IsOptional()
    @IsString()
    usageTime?: string;

    @ApiPropertyOptional()
    @IsOptional()
    usageMorning?: boolean;

    @ApiPropertyOptional()
    @IsOptional()
    usageNoon?: boolean;

    @ApiPropertyOptional()
    @IsOptional()
    usageEvening?: boolean;

    @ApiPropertyOptional()
    @IsOptional()
    usageNight?: boolean;

    @ApiPropertyOptional()
    @IsOptional()
    @IsString()
    usageRemark?: string;
}

export class UpdateInventoryDto extends PartialType(CreateInventoryDto) { }
