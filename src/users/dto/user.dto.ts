import { IsString, IsOptional, IsEmail, MinLength } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateUserDto {
    @ApiProperty({ example: 'user@example.com' })
    @IsEmail()
    email: string;

    @ApiProperty({ example: 'password123' })
    @IsString()
    @MinLength(6)
    password: string;

    @ApiProperty({ example: 'สมชาย' })
    @IsString()
    firstName: string;

    @ApiProperty({ example: 'ใจดี' })
    @IsString()
    lastName: string;

    @ApiPropertyOptional({ description: 'Role ID' })
    @IsString()
    @IsOptional()
    roleId?: string;

    @ApiPropertyOptional({ type: [String], description: 'List of branch IDs' })
    @IsString({ each: true })
    @IsOptional()
    branchIds?: string[];
}

export class UpdateUserDto {
    @ApiPropertyOptional()
    @IsEmail()
    @IsOptional()
    email?: string;

    @ApiPropertyOptional()
    @IsString()
    @MinLength(6)
    @IsOptional()
    password?: string;

    @ApiPropertyOptional()
    @IsString()
    @IsOptional()
    firstName?: string;

    @ApiPropertyOptional()
    @IsString()
    @IsOptional()
    lastName?: string;

    @ApiPropertyOptional()
    @IsString()
    @IsOptional()
    roleId?: string;

    @ApiPropertyOptional({ type: [String] })
    @IsString({ each: true })
    @IsOptional()
    branchIds?: string[];
}
