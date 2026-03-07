import { Controller, Get, Post, Patch, Delete, Param, Body, UseGuards, Request, ForbiddenException, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { BranchesService } from './branches.service';
import { CreateBranchDto, UpdateBranchDto } from './dto/branch.dto';

@ApiTags('branches')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('branches')
export class BranchesController {
    constructor(private readonly branchesService: BranchesService) { }

    @Get()
    @ApiOperation({ summary: 'List all branches of current tenant' })
    findAll(
        @Request() req: any,
        @Query('page') page?: string,
        @Query('limit') limit?: string,
        @Query('search') search?: string,
    ) {
        const isSaasAdmin = req.user.roleRef?.name === 'SAAS_ADMIN';
        if (!isSaasAdmin && !req.user.tenantId) throw new ForbiddenException('Only clinic users can manage branches');
        const tenantId = isSaasAdmin ? undefined : req.user.tenantId;

        const p = page ? parseInt(page) : 1;
        const l = limit ? parseInt(limit) : 10;

        return this.branchesService.findAll(tenantId, p, l, search);
    }

    @ApiOperation({ summary: 'Create new branch' })
    @Post()
    create(@Body() dto: CreateBranchDto, @Request() req: any) {
        if (!req.user.tenantId) throw new ForbiddenException('Only clinic users can manage branches');
        return this.branchesService.create({ ...dto, tenantId: req.user.tenantId });
    }

    @ApiOperation({ summary: 'Update branch' })
    @Patch(':id')
    update(@Param('id') id: string, @Body() dto: UpdateBranchDto, @Request() req: any) {
        if (!req.user.tenantId) throw new ForbiddenException('Only clinic users can manage branches');
        return this.branchesService.update(id, dto, req.user.tenantId);
    }

    @ApiOperation({ summary: 'Delete branch' })
    @Delete(':id')
    remove(@Param('id') id: string, @Request() req: any) {
        if (!req.user.tenantId) throw new ForbiddenException('Only clinic users can manage branches');
        return this.branchesService.delete(id, req.user.tenantId);
    }
}
