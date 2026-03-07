import { Body, Controller, Delete, Get, Param, Patch, Post, Request, Query } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { RolesService } from './roles.service';
import { CreateRoleDto, UpdateRoleDto, AssignMenusDto } from './dto/role.dto';

@ApiTags('roles')
@Controller('roles')
export class RolesController {
    constructor(private readonly rolesService: RolesService) { }

    @Get()
    @ApiOperation({ summary: 'List all roles' })
    async findAll(
        @Request() req: any,
        @Query('page') page?: string,
        @Query('limit') limit?: string,
    ) {
        const user = req.user;
        const isSaasAdmin = user.roleRef?.name === 'SAAS_ADMIN';

        const p = page ? parseInt(page) : 1;
        const l = limit ? parseInt(limit) : 10;

        const result = await this.rolesService.findAll(p, l);

        if (!isSaasAdmin) {
            // Filter out SAAS_ADMIN role for others
            result.data = result.data.filter((r: any) => r.name !== 'SAAS_ADMIN');
            // Recalculate total if needed, but usually SAAS_ADMIN is just one role
        }

        return result;
    }

    @Get(':id')
    @ApiOperation({ summary: 'Get role by ID' })
    async findById(@Param('id') id: string) {
        return this.rolesService.findById(id);
    }

    @Post()
    @ApiOperation({ summary: 'Create a new role' })
    async create(@Body() dto: CreateRoleDto) {
        return this.rolesService.create(dto);
    }

    @Patch(':id')
    @ApiOperation({ summary: 'Update a role' })
    async update(@Param('id') id: string, @Body() dto: UpdateRoleDto) {
        return this.rolesService.update(id, dto);
    }

    @Delete(':id')
    @ApiOperation({ summary: 'Delete a role' })
    async delete(@Param('id') id: string) {
        return this.rolesService.delete(id);
    }

    @Post(':id/menus')
    @ApiOperation({ summary: 'Assign menus to a role' })
    async assignMenus(@Param('id') id: string, @Body() dto: AssignMenusDto) {
        return this.rolesService.assignMenus(id, dto.menuIds);
    }

    @Get(':id/menus')
    @ApiOperation({ summary: 'Get menus for a role' })
    async getMenus(@Param('id') id: string) {
        return this.rolesService.getMenusForRole(id);
    }
}
