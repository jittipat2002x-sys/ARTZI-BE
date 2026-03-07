import { Controller, Get, Post, Body, Patch, Param, Delete, Query, UseGuards, Request, ForbiddenException } from '@nestjs/common';
import { MasterDataService } from './master-data.service';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('master-data')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('master-data')
export class MasterDataController {
    constructor(private readonly masterDataService: MasterDataService) { }

    private checkSaasAdmin(req: any) {
        if (req.user?.roleRef?.name !== 'SAAS_ADMIN') {
            throw new ForbiddenException('Only SAAS_ADMIN can manage master data');
        }
    }

    // Product Categories
    @Get('product-categories')
    @ApiOperation({ summary: 'Get all product categories' })
    findAllProductCategories() {
        return this.masterDataService.getAllProductCategories();
    }

    @Post('product-categories')
    @ApiOperation({ summary: 'Create product category (SAAS_ADMIN only)' })
    createProductCategory(@Request() req: any, @Body() data: any) {
        this.checkSaasAdmin(req);
        return this.masterDataService.createProductCategory(data);
    }

    @Patch('product-categories/:id')
    @ApiOperation({ summary: 'Update product category (SAAS_ADMIN only)' })
    updateProductCategory(@Request() req: any, @Param('id') id: string, @Body() data: any) {
        this.checkSaasAdmin(req);
        return this.masterDataService.updateProductCategory(id, data);
    }

    @Delete('product-categories/:id')
    @ApiOperation({ summary: 'Delete product category (SAAS_ADMIN only)' })
    removeProductCategory(@Request() req: any, @Param('id') id: string) {
        this.checkSaasAdmin(req);
        return this.masterDataService.deleteProductCategory(id);
    }

    // Medicine Categories
    @Get('medicine-categories')
    @ApiOperation({ summary: 'Get all medicine categories' })
    findAllMedicineCategories() {
        return this.masterDataService.getAllMedicineCategories();
    }

    @Post('medicine-categories')
    @ApiOperation({ summary: 'Create medicine category (SAAS_ADMIN only)' })
    createMedicineCategory(@Request() req: any, @Body() data: any) {
        this.checkSaasAdmin(req);
        return this.masterDataService.createMedicineCategory(data);
    }

    @Patch('medicine-categories/:id')
    @ApiOperation({ summary: 'Update medicine category (SAAS_ADMIN only)' })
    updateMedicineCategory(@Request() req: any, @Param('id') id: string, @Body() data: any) {
        this.checkSaasAdmin(req);
        return this.masterDataService.updateMedicineCategory(id, data);
    }

    @Delete('medicine-categories/:id')
    @ApiOperation({ summary: 'Delete medicine category (SAAS_ADMIN only)' })
    removeMedicineCategory(@Request() req: any, @Param('id') id: string) {
        this.checkSaasAdmin(req);
        return this.masterDataService.deleteMedicineCategory(id);
    }

    // Units
    @Get('units')
    @ApiOperation({ summary: 'Get all units (optional medicine category filter)' })
    @ApiQuery({ name: 'medicineCategoryId', required: false })
    findAllUnits(@Query('medicineCategoryId') medicineCategoryId?: string) {
        return this.masterDataService.getAllUnits(medicineCategoryId);
    }

    @Post('units')
    @ApiOperation({ summary: 'Create unit (SAAS_ADMIN only)' })
    createUnit(@Request() req: any, @Body() data: any) {
        this.checkSaasAdmin(req);
        return this.masterDataService.createUnit(data);
    }

    @Patch('units/:id')
    @ApiOperation({ summary: 'Update unit (SAAS_ADMIN only)' })
    updateUnit(@Request() req: any, @Param('id') id: string, @Body() data: any) {
        this.checkSaasAdmin(req);
        return this.masterDataService.updateUnit(id, data);
    }

    @Delete('units/:id')
    @ApiOperation({ summary: 'Delete unit (SAAS_ADMIN only)' })
    removeUnit(@Request() req: any, @Param('id') id: string) {
        this.checkSaasAdmin(req);
        return this.masterDataService.deleteUnit(id);
    }

    // Usage Instructions
    @Get('usage-instructions')
    @ApiOperation({ summary: 'Get all usage instructions (optional type filter)' })
    @ApiQuery({ name: 'type', enum: ['FREQUENCY', 'TIME'], required: false })
    findAllUsageInstructions(@Query('type') type?: 'FREQUENCY' | 'TIME') {
        return this.masterDataService.getAllUsageInstructions(type);
    }

    @Post('usage-instructions')
    @ApiOperation({ summary: 'Create usage instruction (SAAS_ADMIN only)' })
    createUsageInstruction(@Request() req: any, @Body() data: any) {
        this.checkSaasAdmin(req);
        return this.masterDataService.createUsageInstruction(data);
    }

    @Patch('usage-instructions/:id')
    @ApiOperation({ summary: 'Update usage instruction (SAAS_ADMIN only)' })
    updateUsageInstruction(@Request() req: any, @Param('id') id: string, @Body() data: any) {
        this.checkSaasAdmin(req);
        return this.masterDataService.updateUsageInstruction(id, data);
    }

    @Delete('usage-instructions/:id')
    @ApiOperation({ summary: 'Delete usage instruction (SAAS_ADMIN only)' })
    removeUsageInstruction(@Request() req: any, @Param('id') id: string) {
        this.checkSaasAdmin(req);
        return this.masterDataService.deleteUsageInstruction(id);
    }
}
