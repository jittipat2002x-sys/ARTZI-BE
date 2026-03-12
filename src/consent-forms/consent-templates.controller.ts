import { Body, Controller, Get, Param, Post, Patch, Req, UseGuards } from '@nestjs/common';
import { ConsentFormsService } from './consent-forms.service';
import { CreateTemplateDto, UpdateTemplateDto } from './dto/template.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@UseGuards(JwtAuthGuard)
@Controller('consent-templates')
export class ConsentTemplatesController {
  constructor(private readonly consentFormsService: ConsentFormsService) {}

  @Get()
  async findAll(@Req() req: any) {
    // Note: Assuming tenantId comes from req.user (standard pattern in this app)
    const tenantId = req.user?.tenantId;
    return this.consentFormsService.findAllTemplates(tenantId);
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.consentFormsService.findTemplateById(id);
  }

  @Post()
  async create(@Req() req: any, @Body() dto: CreateTemplateDto) {
    const tenantId = req.user?.tenantId;
    return this.consentFormsService.createTemplate(tenantId, dto);
  }

  @Patch(':id')
  async update(@Param('id') id: string, @Body() dto: UpdateTemplateDto) {
    return this.consentFormsService.updateTemplate(id, dto);
  }
}
