import { IsEmail, IsNotEmpty, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class RegisterDto {
    @ApiProperty()
    @IsEmail()
    email!: string;

    @ApiProperty()
    @IsNotEmpty()
    @MinLength(6)
    password!: string;

    @ApiProperty()
    @IsNotEmpty()
    firstName!: string;

    @ApiProperty()
    @IsNotEmpty()
    lastName!: string;
}

export class LoginDto {
    @ApiProperty()
    @IsEmail()
    email!: string;

    @ApiProperty()
    @IsNotEmpty()
    password!: string;
}
