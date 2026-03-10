import { Controller, Get, Post, Patch, Param, Body, UseGuards, Req, Query } from '@nestjs/common';
import { AppointmentsService } from './appointments.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CreateAppointmentDto } from './dto/create-appointment.dto';

@Controller('appointments')
@UseGuards(JwtAuthGuard)
export class AppointmentsController {
    constructor(private readonly appointmentsService: AppointmentsService) { }

    @Get()
    findAll(
        @Req() req: any,
        @Query('page') page?: number,
        @Query('limit') limit?: number,
        @Query('status') status?: string,
        @Query('branchId') branchId?: string,
        @Query('date') date?: string,
        @Query('search') search?: string,
    ) {
        const branchIds = req.user.branches?.map((b: any) => b.branchId) || [];
        const tenantId = req.user.tenantId;
        return this.appointmentsService.findAll(
            tenantId,
            branchIds,
            Number(page) || 1,
            Number(limit) || 10,
            status,
            branchId,
            date,
            search
        );
    }

    @Post()
    create(@Req() req: any, @Body() createAppointmentDto: CreateAppointmentDto) {
        // Will use the first branch of the user for creation if not otherwise specified.
        const branchId = req.user.branches?.[0]?.branchId;
        return this.appointmentsService.create(createAppointmentDto, branchId);
    }

    @Patch(':id')
    update(@Param('id') id: string, @Body() updateAppointmentDto: any) {
        return this.appointmentsService.update(id, updateAppointmentDto);
    }
}

