import { Body, Controller, Delete, Get, Param, Patch, Post } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { MenusService } from './menus.service';
import { CreateMenuDto, UpdateMenuDto } from './dto/menu.dto';

@ApiTags('menus')
@Controller('menus')
export class MenusController {
    constructor(private readonly menusService: MenusService) { }

    @Get()
    @ApiOperation({ summary: 'Get all menus (tree structure)' })
    async findAll() {
        return this.menusService.findAll();
    }

    @Get('flat')
    @ApiOperation({ summary: 'Get all menus (flat list)' })
    async findAllFlat() {
        return this.menusService.findAllFlat();
    }

    @Get(':id')
    @ApiOperation({ summary: 'Get menu by ID' })
    async findById(@Param('id') id: string) {
        return this.menusService.findById(id);
    }

    @Post()
    @ApiOperation({ summary: 'Create a new menu' })
    async create(@Body() dto: CreateMenuDto) {
        return this.menusService.create(dto);
    }

    @Patch(':id')
    @ApiOperation({ summary: 'Update a menu' })
    async update(@Param('id') id: string, @Body() dto: UpdateMenuDto) {
        return this.menusService.update(id, dto);
    }

    @Delete(':id')
    @ApiOperation({ summary: 'Delete a menu' })
    async delete(@Param('id') id: string) {
        return this.menusService.delete(id);
    }
}
