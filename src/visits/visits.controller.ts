import { Controller, Get, Post, Body, Param, Query } from '@nestjs/common';
import { VisitsService } from './visits.service';
import { CreateVisitDto } from './dto/create-visit.dto';

@Controller('visits')
export class VisitsController {
    constructor(private readonly visitsService: VisitsService) { }

    @Post()
    create(@Body() createVisitDto: CreateVisitDto) {
        return this.visitsService.create(createVisitDto);
    }

    @Get()
    findAll(
        @Query('customerId') customerId?: string,
        @Query('date') date?: string,
        @Query('appointmentId') appointmentId?: string
    ) {
        return this.visitsService.findAll(customerId, date, appointmentId);
    }

    @Get(':id')
    findOne(@Param('id') id: string) {
        return this.visitsService.findOne(id);
    }
}
