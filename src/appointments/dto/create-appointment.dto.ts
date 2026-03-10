import { IsOptional, IsString, IsNotEmpty, IsDateString, IsArray } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateAppointmentDto {
    @ApiProperty()
    @IsNotEmpty()
    @IsArray()
    @IsString({ each: true })
    petIds: string[];

    @ApiProperty()
    @IsOptional()
    @IsString()
    vetId?: string;

    @ApiProperty()
    @IsNotEmpty()
    @IsDateString()
    date: string;

    @ApiProperty()
    @IsNotEmpty()
    @IsString()
    reason: string;
}
