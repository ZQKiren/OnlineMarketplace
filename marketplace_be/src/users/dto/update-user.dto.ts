// src/users/dto/update-user.dto.ts
import { IsEmail, IsString, IsOptional, MinLength, MaxLength, Matches, IsPhoneNumber, IsEnum } from 'class-validator';
import { Role } from '@prisma/client';

export class UpdateUserDto {
  @IsOptional()
  @IsEmail({}, { message: 'Please provide a valid email address' })
  email?: string;

  @IsOptional()
  @IsString()
  @MinLength(6, { message: 'Password must be at least 6 characters long' })
  @MaxLength(50, { message: 'Password must not exceed 50 characters' })
  @Matches(/((?=.*\d)|(?=.*\W+))(?![.\n])(?=.*[A-Z])(?=.*[a-z]).*$/, {
    message: 'Password must contain at least 1 uppercase letter, 1 lowercase letter, and 1 number or special character',
  })
  password?: string;

  @IsOptional()
  @IsString()
  @MinLength(2, { message: 'Name must be at least 2 characters long' })
  @MaxLength(100, { message: 'Name must not exceed 100 characters' })
  name?: string;

  @IsOptional()
  @IsString()
  @Matches(/^(0[1-9][0-9]{8}|(\+84)[1-9][0-9]{8})$/, {
    message: 'Please provide a valid Vietnamese phone number (0xxxxxxxxx or +84xxxxxxxxx)'
  })
  phone?: string;

  @IsOptional()
  @IsString()
  @MaxLength(255, { message: 'Avatar URL must not exceed 255 characters' })
  avatar?: string;

  @IsOptional()
  @IsEnum(Role, { message: 'Role must be either USER or ADMIN' })
  role?: Role;
}