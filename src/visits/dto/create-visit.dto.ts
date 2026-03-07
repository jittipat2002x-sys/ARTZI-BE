import { IsArray, IsDateString, IsNotEmpty, IsNumber, IsOptional, IsString, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateMedicalTreatmentDto {
    @IsString()
    @IsNotEmpty()
    inventoryId: string;

    @IsString()
    @IsOptional()
    inventoryName?: string;

    @IsNumber()
    @IsNotEmpty()
    quantity: number;

    @IsNumber()
    @IsNotEmpty()
    unitPrice: number;

    @IsString()
    @IsOptional()
    usageInstructions?: string;
}

export class CreateMedicalRecordDto {
    @IsString()
    @IsNotEmpty()
    petId: string;

    @IsString()
    @IsNotEmpty()
    vetId: string;

    @IsNumber()
    @IsOptional()
    weightAtVisit?: number;

    @IsNumber()
    @IsOptional()
    temperature?: number;

    @IsString()
    @IsOptional()
    symptoms?: string;

    @IsString()
    @IsOptional()
    diagnosis?: string;

    @IsString()
    @IsOptional()
    treatment?: string;

    @IsString()
    @IsOptional()
    prescription?: string;

    @IsString()
    @IsOptional()
    notes?: string;

    @IsArray()
    @IsString({ each: true })
    @IsOptional()
    appointmentIds?: string[];

    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => CreateMedicalTreatmentDto)
    @IsOptional()
    medications?: CreateMedicalTreatmentDto[];

    @IsDateString()
    @IsOptional()
    nextAppointmentDate?: string;

    @IsString()
    @IsOptional()
    nextAppointmentReason?: string;
}

export class CreateInvoiceItemDto {
    @IsString()
    @IsOptional()
    productId?: string;

    @IsString()
    @IsNotEmpty()
    name: string;

    @IsNumber()
    @IsNotEmpty()
    quantity: number;

    @IsNumber()
    @IsNotEmpty()
    unitPrice: number;
}

export class CreateVisitDto {
    @IsString()
    @IsNotEmpty()
    customerId: string;

    @IsString()
    @IsNotEmpty()
    branchId: string;

    @IsDateString()
    @IsOptional()
    visitDate?: string;

    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => CreateMedicalRecordDto)
    medicalRecords: CreateMedicalRecordDto[];

    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => CreateInvoiceItemDto)
    @IsOptional()
    generalItems?: CreateInvoiceItemDto[];

    @IsNumber()
    @IsNotEmpty()
    discount: number;

    @IsString()
    @IsOptional()
    paymentMethod?: string; // e.g. 'CASH', 'TRANSFER'
}
