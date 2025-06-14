import { Injectable, UnauthorizedException, Logger } from '@nestjs/common';
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
    this.logger.log('JWT Strategy - validate called with payload:', payload);

    try {
      const user = await this.prisma.user.findUnique({
        where: { id: payload.sub },
        select: {
          id: true,
          email: true,
          name: true,
          role: true,
        },
      });

      if (!user) {
        this.logger.error('User not found for ID:', payload.sub);
        throw new UnauthorizedException('User not found');
      }

      this.logger.log('User found and validated:', user);
      return user;
    } catch (error) {
      this.logger.error('Error validating user:', error);
      throw new UnauthorizedException('Token validation failed');
    }
  }
}