// src/auth/strategies/jwt.strategy.ts - COMPLETE VERSION WITH BLOCKED CHECK
import { Injectable, UnauthorizedException, ForbiddenException, Logger } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  private readonly logger = new Logger(JwtStrategy.name);

  constructor(
    private configService: ConfigService,
    private prisma: PrismaService,
  ) {
    const jwtSecret = configService.get<string>('JWT_SECRET');
    if (!jwtSecret) {
      throw new Error('JWT_SECRET is not defined in the environment variables');
    }

    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: jwtSecret,
    });

    this.logger.log('JwtStrategy initialized with secret:', jwtSecret ? '***' : 'MISSING');
  }

  async validate(payload: any) {
    this.logger.log('JWT Strategy - validate called with payload:', {
      sub: payload.sub,
      email: payload.email,
      role: payload.role,
      isBlocked: payload.isBlocked
    });

    try {
      // ✅ CRITICAL: Always check current user status in database
      const user = await this.prisma.user.findUnique({
        where: { id: payload.sub },
        select: {
          id: true,
          email: true,
          name: true,
          role: true,
          isBlocked: true,
          avatar: true,
          loyaltyPoints: true,
        },
      });

      if (!user) {
        this.logger.error('User not found for ID:', payload.sub);
        throw new UnauthorizedException('User not found');
      }

      // ✅ CRITICAL: Check if user is currently blocked
      if (user.isBlocked) {
        this.logger.error('Blocked user attempted access:', user.email);
        throw new ForbiddenException('Your account has been blocked. Please contact support.');
      }

      this.logger.log('User found and validated:', {
        id: user.id,
        email: user.email,
        role: user.role,
        isBlocked: user.isBlocked
      });

      return user;
    } catch (error) {
      // If it's a ForbiddenException (blocked user), rethrow it
      if (error instanceof ForbiddenException) {
        throw error;
      }
      
      this.logger.error('Error validating user:', error);
      throw new UnauthorizedException('Token validation failed');
    }
  }
}