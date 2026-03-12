import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { ConsentFormsService } from './consent-forms.service';
import { SignFormDto } from './dto/sign-form.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@UseGuards(JwtAuthGuard)
@Controller('signed-consent-forms')
export class SignedConsentFormsController {
  constructor(private readonly consentFormsService: ConsentFormsService) {}

  @Post()
  async sign(@Body() dto: SignFormDto) {
    return this.consentFormsService.signForm(dto);
  }

  @Get('pet/:petId')
  async findByPet(@Param('petId') petId: string) {
    return this.consentFormsService.findSignedFormsByPet(petId);
  }
}
