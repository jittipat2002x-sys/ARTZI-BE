import { Body, Controller, Post, Get, HttpCode, HttpStatus, Req } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { RegistrationService } from './registration.service';
import { LoginDto, RegisterDto } from './dto/auth.dto';
import { RegisterClinicDto } from './dto/register-clinic.dto';
import { Public } from './decorators/public.decorator';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
    constructor(
        private readonly authService: AuthService,
        private readonly registrationService: RegistrationService,
    ) { }

    @Public()
    @Post('register')
    @ApiOperation({ summary: 'Register a new user' })
    @ApiResponse({ status: 201, description: 'User successfully created.' })
    @ApiResponse({ status: 409, description: 'Email already exists.' })
    async register(@Body() registerDto: RegisterDto) {
        return this.authService.register(registerDto);
    }

    @Public()
    @Post('register-clinic')
    @ApiOperation({ summary: 'Register a new clinic (Tenant + Owner + Branch)' })
    @ApiResponse({ status: 201, description: 'Clinic successfully registered.' })
    @ApiResponse({ status: 409, description: 'Clinic or Owner email already exists.' })
    async registerClinic(@Body() registerClinicDto: RegisterClinicDto) {
        return this.registrationService.registerClinic(registerClinicDto);
    }

    @Public()
    @Post('login')
    @HttpCode(HttpStatus.OK)
    @ApiOperation({ summary: 'Login and get JWT token' })
    @ApiResponse({ status: 200, description: 'Return access token.' })
    @ApiResponse({ status: 401, description: 'Invalid credentials.' })
    async login(@Body() loginDto: LoginDto) {
        return this.authService.login(loginDto);
    }

    @Get('me')
    @ApiOperation({ summary: 'Get current user info' })
    async getMe(@Req() req: any) {
        return req.user;
    }

    @Get('me/menus')
    @ApiOperation({ summary: 'Get menus for current authenticated user based on their role' })
    async getMyMenus(@Req() req: any) {
        return this.authService.getMenusForUser(req.user.id);
    }
}
