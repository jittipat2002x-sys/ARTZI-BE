import { Controller, Get, Patch, Delete, Param, Body, UseGuards, Query, Request, ForbiddenException } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { TenantsService } from './tenants.service';
import { UpdateTenantStatusDto, UpdateBrandingDto } from './dto/tenant.dto';

@ApiTags('tenants')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('tenants')
export class TenantsController {
    constructor(private readonly tenantsService: TenantsService) { }

    @ApiOperation({ summary: 'List all clinics (SuperAdmin)' })
    @Get()
    findAll(
        @Query('status') status?: string,
        @Query('page') page?: string,
        @Query('limit') limit?: string,
        @Query('search') search?: string,
    ) {
        return this.tenantsService.findAll(
            status,
            page ? parseInt(page) : 1,
            limit ? parseInt(limit) : 10,
            search
        );
    }

    // ⚠️ Static routes MUST come before :id param route
    @ApiOperation({ summary: 'Get branding for current tenant' })
    @Get('my/branding')
    async getMyBranding(@Request() req: any) {
        if (!req.user.tenantId) throw new ForbiddenException('Only clinic users can access branding');
        const tenant = await this.tenantsService.findOne(req.user.tenantId);
        return { brandColor: tenant.brandColor, logoUrl: tenant.logoUrl };
    }

    @ApiOperation({ summary: 'Update clinic branding (color + logo)' })
    @Patch('my/branding')
    async updateBranding(@Request() req: any, @Body() dto: UpdateBrandingDto) {
        if (!req.user.tenantId) throw new ForbiddenException('Only clinic users can update branding');
        return this.tenantsService.updateBranding(req.user.tenantId, dto);
    }

    @ApiOperation({ summary: 'Get clinic details' })
    @Get(':id')
    findOne(@Param('id') id: string) {
        return this.tenantsService.findOne(id);
    }

    @ApiOperation({ summary: 'Update clinic approval status' })
    @Patch(':id/status')
    updateStatus(
        @Param('id') id: string,
        @Body() updateDto: UpdateTenantStatusDto,
        @Request() req: any,
    ) {
        return this.tenantsService.updateStatus(id, updateDto, req.user.id);
    }

    @ApiOperation({ summary: 'Delete clinic' })
    @Delete(':id')
    delete(@Param('id') id: string) {
        return this.tenantsService.delete(id);
    }
}
