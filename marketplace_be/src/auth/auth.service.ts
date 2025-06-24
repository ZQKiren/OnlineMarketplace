// src/auth/auth.service.ts - COMPLETE VERSION WITH BLOCKED CHECK
import { Injectable, UnauthorizedException, ConflictException, ForbiddenException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../prisma/prisma.service';
import * as bcrypt from 'bcrypt';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { CreateUserDto } from '../users/dto/create-user.dto';
import { Role } from '@prisma/client';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
  ) {}

  async register(registerDto: RegisterDto) {
    const { email, password, name, phone } = registerDto;

    // Check if user exists
    const existingUser = await this.prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      throw new ConflictException('Email already exists');
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user with CreateUserDto structure
    const createUserDto: CreateUserDto = {
      email,
      password: hashedPassword,
      name,
      phone,
      role: Role.USER, // Default role for registration
    };

    // Create user
    const user = await this.prisma.user.create({
      data: createUserDto,
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        phone: true,
        avatar: true,
        isBlocked: true, // ✅ Include isBlocked
        loyaltyPoints: true,
        createdAt: true,
      },
    });

    // Generate token
    const token = this.generateToken(user);

    console.log('✅ Registration successful:', user.email);

    return {
      user,
      token,
    };
  }

  async login(loginDto: LoginDto) {
    const { email, password } = loginDto;

    // Find user
    const user = await this.prisma.user.findUnique({
      where: { email },
      select: {
        id: true,
        email: true,
        name: true,
        phone: true,
        avatar: true,
        role: true,
        isBlocked: true, 
        password: true, 
        loyaltyPoints: true,
        createdAt: true,
        _count: {
          select: {
            products: true,
            orders: true,
            reviews: true,
          },
        },
      },
    });

    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    // Check if user is blocked BEFORE password check
    if (user.isBlocked) {
      console.log('🚫 Blocked user attempted login:', user.email);
      throw new ForbiddenException('Your account has been blocked. Please contact support.');
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    // Remove password from response
    const { password: _, ...userWithoutPassword } = user;

    // Generate token (includes isBlocked in payload for validation)
    const token = this.generateToken(user);

    console.log('✅ Login successful for user:', user.email);

    return {
      user: userWithoutPassword,
      token,
    };
  }

  private generateToken(user: any) {
    const payload = {
      sub: user.id,
      email: user.email,
      role: user.role,
      isBlocked: user.isBlocked, // ✅ Include in JWT payload for validation
    };

    return this.jwtService.sign(payload);
  }
}