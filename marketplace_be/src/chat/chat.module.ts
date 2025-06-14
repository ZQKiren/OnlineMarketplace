import { Module } from '@nestjs/common';
import { ChatController } from './chat.controller';
import { ChatService } from './chat.service';
import { ChatGateway } from './chat.gateway';
import { PrismaModule } from '../prisma/prisma.module';
import { AuthModule } from '../auth/auth.module';
import { JwtModule } from '@nestjs/jwt'; // ✅ Add this import
import { ConfigModule } from '@nestjs/config'; // ✅ Add this import

@Module({
  imports: [
    PrismaModule, 
    AuthModule,
    JwtModule, // ✅ Make sure JwtModule is imported
    ConfigModule, // ✅ Make sure ConfigModule is imported
  ],
  controllers: [ChatController],
  providers: [ChatService, ChatGateway],
  exports: [ChatService],
})
export class ChatModule {}

// src/auth/guards/jwt-auth.guard.ts - ENSURE IT'S WORKING
import { Injectable, ExecutionContext, UnauthorizedException, Logger } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  private readonly logger = new Logger(JwtAuthGuard.name);

  canActivate(context: ExecutionContext) {
    // Add logging to debug
    this.logger.log('JwtAuthGuard - canActivate called');
    return super.canActivate(context);
  }

  handleRequest(err: any, user: any, info: any, context: ExecutionContext) {
    this.logger.log('JwtAuthGuard - handleRequest called');
    this.logger.log('User from JWT:', user);
    this.logger.log('Error from JWT:', err);
    this.logger.log('Info from JWT:', info);

    if (err || !user) {
      this.logger.error('JWT Authentication failed:', err || 'No user found');
      throw err || new UnauthorizedException('Invalid token');
    }

    return user;
  }
}