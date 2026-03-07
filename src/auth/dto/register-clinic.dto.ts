import { IsString, IsEmail, IsNotEmpty, MinLength, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class RegisterClinicDto {
    // Clinic (Tenant) Info
    @ApiProperty()
    @IsString()
    @IsNotEmpty()
    clinicName: string;

    @ApiProperty({ required: false })
    @IsString()
    @IsOptional()
    taxId?: string;

    @ApiProperty()
    @IsEmail()
    clinicEmail: string;

    @ApiProperty({ required: false })
    @IsString()
    @IsOptional()
    clinicPhone?: string;

    @ApiProperty({ required: false })
    @IsString()
    @IsOptional()
    clinicDescription?: string;

    // Owner (User) Info
    @ApiProperty()
    @IsEmail()
    ownerEmail: string;

    @ApiProperty()
    @IsString()
    @IsNotEmpty()
    @MinLength(6)
    password: string;

    @ApiProperty()
    @IsString()
    @IsNotEmpty()
    firstName: string;

    @ApiProperty()
    @IsString()
    @IsNotEmpty()
    lastName: string;

    // Initial Branch Info
    @ApiProperty()
    @IsString()
    @IsNotEmpty()
    branchName: string;

    @ApiProperty({ required: false })
    @IsString()
    @IsOptional()
    branchAddress?: string;

    @ApiProperty({ required: false })
    @IsString()
    @IsOptional()
    branchPhone?: string;

    @ApiProperty({ required: false })
    @IsString()
    @IsOptional()
    paymentSlipUrl?: string;
}
