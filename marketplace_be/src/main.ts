import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { NestExpressApplication } from '@nestjs/platform-express';
import { AppModule } from './app.module';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';
import helmet from 'helmet';
import * as compression from 'compression';
import { ProductsModule } from './products/products.module';
import * as dotenv from 'dotenv';
import { IoAdapter } from '@nestjs/platform-socket.io';

dotenv.config();

async function bootstrap() {
  // ✅ FIX: Validate JWT_SECRET before starting
  if (!process.env.JWT_SECRET || process.env.JWT_SECRET.length < 32) {
    console.error('❌ JWT_SECRET must be at least 32 characters long');
    console.error('Current JWT_SECRET length:', process.env.JWT_SECRET?.length || 0);
    process.exit(1);
  }

  const app = await NestFactory.create<NestExpressApplication>(AppModule, {
    rawBody: true,
  });

  // Security
  app.use(helmet({
    crossOriginResourcePolicy: false,
  }));
  app.use(compression());

  // Global pipes
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
    }),
  );

  app.useWebSocketAdapter(new IoAdapter(app));

  // Global filters
  app.useGlobalFilters(new HttpExceptionFilter());

  // ✅ FIX: Enhanced CORS for chat
  const allowedOrigins = [
    'http://localhost:3000',
    'http://localhost:5173', // ✅ Add this for Vite
    'http://127.0.0.1:3000',
    'http://127.0.0.1:5173',
    ...(process.env.FRONTEND_URL?.split(',') || [])
  ].filter(Boolean);

  app.enableCors({
    origin: allowedOrigins,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  });

  // API prefix
  app.setGlobalPrefix('api/v1');

  // Initialize Cloudinary configuration
  ProductsModule.configureCloudinary();

  const port = process.env.PORT || 5000;
  await app.listen(port);
  
  // ✅ FIX: Enhanced startup logs
  console.log(`✅ Application is running on: http://localhost:${port}/api/v1`);
  console.log(`💬 Socket.IO chat: ws://localhost:${port}/chat`);
  console.log(`🔑 JWT_SECRET configured: ${process.env.JWT_SECRET ? 'YES' : 'NO'}`);
  console.log(`🌐 CORS origins:`, allowedOrigins);
}

bootstrap().catch((error) => {
  console.error('❌ Failed to start application:', error);
  process.exit(1);
});