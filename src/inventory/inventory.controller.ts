import { Controller, Get, Post, Body, Patch, Param, Delete, Query, UseGuards, Request, ForbiddenException } from '@nestjs/common';
import { InventoryService } from './inventory.service';
import { CreateInventoryDto, UpdateInventoryDto } from './dto/inventory.dto';
import { ApiTags, ApiOperation, ApiQuery, ApiBearerAuth } from '@nestjs/swagger';
import { ProductType, MedicineType } from '@prisma/client';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('inventory')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('inventory')
export class InventoryController {
    constructor(private readonly inventoryService: InventoryService) { }

    private checkNotSaasAdmin(req: any) {
        if (req.user?.roleRef?.name === 'SAAS_ADMIN') {
            throw new ForbiddenException('Superadmin cannot access clinical data');
        }
    }

    @Post()
    @ApiOperation({ summary: 'Create a new inventory or service item' })
    create(@Request() req: any, @Body() createInventoryDto: CreateInventoryDto) {
        this.checkNotSaasAdmin(req);
        return this.inventoryService.create(createInventoryDto);
    }

    @Get()
    @ApiOperation({ summary: 'Get all inventory items (optional branch filter)' })
    @ApiQuery({ name: 'branchId', required: false })
    @ApiQuery({ name: 'type', enum: ProductType, required: false })
    findAll(
        @Query('branchId') branchId?: string,
        @Query('type') type?: ProductType,
        @Query('medicineType') medicineType?: MedicineType,
        @Query('search') search?: string,
        @Query('page') page?: string,
        @Query('limit') limit?: string,
        @Query('stockAlert') stockAlert?: string,
        @Query('isActive') isActive?: string,
        @Request() req?: any
    ) {
        this.checkNotSaasAdmin(req);
        const tenantId = req.user.tenantId;
        return this.inventoryService.findAll(
            tenantId,
            branchId,
            type,
            medicineType,
            search,
            page ? parseInt(page as any) : 1,
            limit ? parseInt(limit as any) : 10,
            stockAlert === 'true',
            isActive === undefined ? undefined : isActive === 'true'
        );
    }

    @Get(':id')
    @ApiOperation({ summary: 'Get an inventory item by id' })
    findOne(@Request() req: any, @Param('id') id: string) {
        this.checkNotSaasAdmin(req);
        return this.inventoryService.findOne(id, req.user.tenantId);
    }

    @Patch(':id')
    @ApiOperation({ summary: 'Update an inventory item' })
    update(@Request() req: any, @Param('id') id: string, @Body() updateInventoryDto: UpdateInventoryDto) {
        this.checkNotSaasAdmin(req);
        return this.inventoryService.update(id, updateInventoryDto, req.user.tenantId);
    }

    @Delete(':id')
    @ApiOperation({ summary: 'Delete an inventory item' })
    remove(@Request() req: any, @Param('id') id: string) {
        this.checkNotSaasAdmin(req);
        return this.inventoryService.remove(id, req.user.tenantId);
    }
}
