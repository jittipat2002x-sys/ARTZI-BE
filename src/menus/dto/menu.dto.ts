import { IsString, IsOptional, IsBoolean, IsInt } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateMenuDto {
    @ApiProperty({ example: 'แดชบอร์ด', description: 'ชื่อเมนู' })
    @IsString()
    name: string;

    @ApiPropertyOptional({ example: '/dashboard', description: 'URL path' })
    @IsString()
    @IsOptional()
    path?: string;

    @ApiPropertyOptional({ example: 'LayoutDashboard', description: 'Icon name' })
    @IsString()
    @IsOptional()
    icon?: string;

    @ApiPropertyOptional({ description: 'Parent menu ID for sub-menus' })
    @IsString()
    @IsOptional()
    parentId?: string;

    @ApiPropertyOptional({ example: 0, description: 'Sort order' })
    @IsInt()
    @IsOptional()
    sortOrder?: number;
}

export class UpdateMenuDto {
    @ApiPropertyOptional()
    @IsString()
    @IsOptional()
    name?: string;

    @ApiPropertyOptional()
    @IsString()
    @IsOptional()
    path?: string;

    @ApiPropertyOptional()
    @IsString()
    @IsOptional()
    icon?: string;

    @ApiPropertyOptional()
    @IsString()
    @IsOptional()
    parentId?: string;

    @ApiPropertyOptional()
    @IsInt()
    @IsOptional()
    sortOrder?: number;

    @ApiPropertyOptional()
    @IsBoolean()
    @IsOptional()
    isActive?: boolean;
}
