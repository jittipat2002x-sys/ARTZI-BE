import { Controller, Get, Post, Body, Patch, Param, Delete, Query } from '@nestjs/common';
import { WardsService } from './wards.service';
import { CreateWardDto, UpdateWardDto } from './dto/ward.dto';
import { CreateCageDto, UpdateCageDto } from './dto/cage.dto';
import { ApiTags, ApiOperation } from '@nestjs/swagger';

@ApiTags('Wards & Cages')
@Controller('wards')
export class WardsController {
    constructor(private readonly wardsService: WardsService) { }

    @Post()
    @ApiOperation({ summary: 'Create a new ward' })
    createWard(@Body() createWardDto: CreateWardDto) {
        return this.wardsService.createWard(createWardDto);
    }

    @Get()
    @ApiOperation({ summary: 'List all wards in a branch' })
    findAllWards(@Query('branchId') branchId: string) {
        return this.wardsService.findAllWards(branchId);
    }

    @Get(':id')
    @ApiOperation({ summary: 'Get a ward by ID' })
    findOneWard(@Param('id') id: string) {
        return this.wardsService.findOneWard(id);
    }

    @Patch(':id')
    @ApiOperation({ summary: 'Update a ward' })
    updateWard(@Param('id') id: string, @Body() updateWardDto: UpdateWardDto) {
        return this.wardsService.updateWard(id, updateWardDto);
    }

    @Delete(':id')
    @ApiOperation({ summary: 'Delete a ward' })
    removeWard(@Param('id') id: string) {
        return this.wardsService.removeWard(id);
    }

    // Cages
    @Post('cages')
    @ApiOperation({ summary: 'Create a new cage' })
    createCage(@Body() createCageDto: CreateCageDto) {
        return this.wardsService.createCage(createCageDto);
    }

    @Patch('cages/:id')
    @ApiOperation({ summary: 'Update a cage' })
    updateCage(@Param('id') id: string, @Body() updateCageDto: UpdateCageDto) {
        return this.wardsService.updateCage(id, updateCageDto);
    }

    @Delete('cages/:id')
    @ApiOperation({ summary: 'Delete a cage' })
    removeCage(@Param('id') id: string) {
        return this.wardsService.removeCage(id);
    }
}
