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
    return super.canActivate(context);
  }

  handleRequest(err: any, user: any, info: any, context: ExecutionContext) {
    if (err || !user) {
      throw err || new UnauthorizedException('Invalid token');
    }

    return user;
  }
}