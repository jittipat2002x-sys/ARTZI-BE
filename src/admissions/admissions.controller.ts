import { Controller, Get, Post, Body, Patch, Param, Query, Delete } from '@nestjs/common';
import { AdmissionsService } from './admissions.service';
import { CreateAdmissionDto, DischargeAdmissionDto, TransferAdmissionDto, UpdateAdmissionDetailsDto } from './dto/admission.dto';
import { ApiTags, ApiOperation } from '@nestjs/swagger';

@ApiTags('IPD Admissions')
@Controller('admissions')
export class AdmissionsController {
    constructor(private readonly admissionsService: AdmissionsService) { }

    @Post()
    @ApiOperation({ summary: 'Admit a pet to a cage' })
    admit(@Body() createAdmissionDto: CreateAdmissionDto) {
        return this.admissionsService.admit(createAdmissionDto);
    }

    @Patch(':id/discharge')
    @ApiOperation({ summary: 'Discharge a pet from a cage' })
    discharge(@Param('id') id: string, @Body() dischargeDto: DischargeAdmissionDto) {
        return this.admissionsService.discharge(id, dischargeDto);
    }

    @Patch(':id/transfer')
    @ApiOperation({ summary: 'Transfer a pet to a different cage' })
    transfer(@Param('id') id: string, @Body() transferDto: TransferAdmissionDto) {
        return this.admissionsService.transfer(id, transferDto.cageId);
    }

    @Get('active')
    @ApiOperation({ summary: 'List all currently admitted pets' })
    findAllActive(@Query('branchId') branchId: string) {
        return this.admissionsService.findAllActive(branchId);
    }

    @Get('history/:petId')
    @ApiOperation({ summary: 'Get admission history for a pet' })
    getAdmissionHistory(@Param('petId') petId: string) {
        return this.admissionsService.getAdmissionHistory(petId);
    }

    @Patch(':id')
    @ApiOperation({ summary: 'Update admission details' })
    update(@Param('id') id: string, @Body() updateDto: UpdateAdmissionDetailsDto) {
        return this.admissionsService.updateAdmission(id, updateDto);
    }

    @Delete(':id')
    @ApiOperation({ summary: 'Delete/Cancel an admission record' })
    remove(@Param('id') id: string) {
        return this.admissionsService.remove(id);
    }
}
