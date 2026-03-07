import { Controller, Get, Post, Body, Patch, Param, Delete, Query, UseGuards, Request, ForbiddenException } from '@nestjs/common';
import { CustomersService } from './customers.service';
import { CreateCustomerDto, UpdateCustomerDto } from './dto/customer.dto';
import { ApiTags, ApiOperation, ApiQuery, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('customers')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('customers')
export class CustomersController {
    constructor(private readonly customersService: CustomersService) { }

    private checkNotSaasAdmin(req: any) {
        if (req.user?.roleRef?.name === 'SAAS_ADMIN') {
            throw new ForbiddenException('Superadmin cannot access clinical data');
        }
    }

    @Post()
    @ApiOperation({ summary: 'Create a new customer' })
    create(@Request() req: any, @Body() createCustomerDto: CreateCustomerDto) {
        this.checkNotSaasAdmin(req);
        return this.customersService.create({
            ...createCustomerDto,
            tenantId: req.user.tenantId
        });
    }

    @Get()
    @ApiOperation({ summary: 'Get all customers' })
    @ApiQuery({ name: 'search', required: false })
    @ApiQuery({ name: 'page', required: false })
    @ApiQuery({ name: 'limit', required: false })
    @ApiQuery({ name: 'branchId', required: false })
    findAll(
        @Query('search') search?: string,
        @Query('page') page?: string,
        @Query('limit') limit?: string,
        @Query('branchId') branchId?: string,
        @Request() req?: any
    ) {
        this.checkNotSaasAdmin(req);
        const tenantId = req?.user?.tenantId;
        if (!tenantId) {
            return {
                data: [],
                meta: {
                    total: 0,
                    page: page ? parseInt(page) : 1,
                    lastPage: 0,
                },
            };
        }
        return this.customersService.findAll(
            tenantId,
            search,
            page ? parseInt(page) : 1,
            limit ? parseInt(limit) : 10,
            branchId
        );
    }

    @Get(':id')
    @ApiOperation({ summary: 'Get a customer by id' })
    findOne(@Request() req: any, @Param('id') id: string) {
        this.checkNotSaasAdmin(req);
        return this.customersService.findOne(id, req.user.tenantId);
    }

    @Patch(':id')
    @ApiOperation({ summary: 'Update a customer' })
    update(@Request() req: any, @Param('id') id: string, @Body() updateCustomerDto: UpdateCustomerDto) {
        this.checkNotSaasAdmin(req);
        return this.customersService.update(id, updateCustomerDto, req.user.tenantId);
    }

    @Delete(':id')
    @ApiOperation({ summary: 'Delete a customer' })
    remove(@Request() req: any, @Param('id') id: string) {
        this.checkNotSaasAdmin(req);
        return this.customersService.remove(id, req.user.tenantId);
    }
}
