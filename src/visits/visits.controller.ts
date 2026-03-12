import { Controller, Get, Post, Body, Param, Query, Patch } from '@nestjs/common';
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
        @Query('appointmentId') appointmentId?: string,
        @Query('search') search?: string,
        @Query('page') page?: string,
        @Query('limit') limit?: string
    ) {
        return this.visitsService.findAll(
            customerId,
            date,
            appointmentId,
            search,
            page ? parseInt(page) : 1,
            limit ? parseInt(limit) : 10
        );
    }

    @Get(':id')
    findOne(@Param('id') id: string) {
        return this.visitsService.findOne(id);
    }

    @Patch(':id')
    update(@Param('id') id: string, @Body() updateVisitDto: CreateVisitDto) {
        return this.visitsService.update(id, updateVisitDto);
    }
}
