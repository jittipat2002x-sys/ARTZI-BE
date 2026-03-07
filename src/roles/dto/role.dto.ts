import { IsString, IsOptional, IsBoolean, IsArray } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateRoleDto {
    @ApiProperty({ example: 'VET', description: 'ชื่อ Role' })
    @IsString()
    name: string;

    @ApiPropertyOptional({ example: 'สัตวแพทย์', description: 'คำอธิบาย Role' })
    @IsString()
    @IsOptional()
    description?: string;
}

export class UpdateRoleDto {
    @ApiPropertyOptional()
    @IsString()
    @IsOptional()
    name?: string;

    @ApiPropertyOptional()
    @IsString()
    @IsOptional()
    description?: string;

    @ApiPropertyOptional()
    @IsBoolean()
    @IsOptional()
    isActive?: boolean;
}

export class AssignMenusDto {
    @ApiProperty({ example: ['uuid-1', 'uuid-2'], description: 'List of menu IDs to assign' })
    @IsArray()
    @IsString({ each: true })
    menuIds: string[];
}
