import { IsString, IsOptional } from 'class-validator';

export class UpdateMedicalTreatmentDto {
    @IsString()
    @IsOptional()
    dosage?: string;
}
