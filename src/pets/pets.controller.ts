import { Controller, Get, Post, Body, Patch, Param, Delete, Query, UseGuards, Request, ForbiddenException } from '@nestjs/common';
import { PetsService } from './pets.service';
import { CreatePetDto, UpdatePetDto } from './dto/pet.dto';
import { ApiTags, ApiOperation, ApiQuery, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('pets')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('pets')
export class PetsController {
    constructor(private readonly petsService: PetsService) { }

    private checkNotSaasAdmin(req: any) {
        if (req.user?.roleRef?.name === 'SAAS_ADMIN') {
            throw new ForbiddenException('Superadmin cannot access clinical data');
        }
    }

    @Post()
    @ApiOperation({ summary: 'Create a new pet' })
    create(@Request() req: any, @Body() createPetDto: CreatePetDto) {
        this.checkNotSaasAdmin(req);
        return this.petsService.create({
            ...createPetDto,
            tenantId: req.user.tenantId
        });
    }

    @Get()
    @ApiOperation({ summary: 'Get all pets' })
    @ApiQuery({ name: 'customerId', required: false })
    @ApiQuery({ name: 'search', required: false })
    findAll(
        @Query('customerId') customerId?: string,
        @Query('search') search?: string,
        @Request() req?: any
    ) {
        this.checkNotSaasAdmin(req);
        const tenantId = req?.user?.tenantId;
        return this.petsService.findAll(tenantId, customerId, search);
    }

    @Get(':id')
    @ApiOperation({ summary: 'Get a pet by id' })
    findOne(@Request() req: any, @Param('id') id: string) {
        this.checkNotSaasAdmin(req);
        return this.petsService.findOne(id, req.user.tenantId);
    }

    @Patch(':id')
    @ApiOperation({ summary: 'Update a pet' })
    update(@Request() req: any, @Param('id') id: string, @Body() updatePetDto: UpdatePetDto) {
        this.checkNotSaasAdmin(req);
        return this.petsService.update(id, updatePetDto, req.user.tenantId);
    }

    @Delete(':id')
    @ApiOperation({ summary: 'Delete a pet' })
    remove(@Request() req: any, @Param('id') id: string) {
        this.checkNotSaasAdmin(req);
        return this.petsService.remove(id, req.user.tenantId);
    }
}
