// src/admin/admin.module.ts
import { Module } from '@nestjs/common';
import { AdminService } from './admin.service';
import { AdminController } from './admin.controller';
import { ProductsService } from 'src/products/products.service'; 
import { NotificationsModule } from '../notifications/notifications.module';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule, NotificationsModule],
  controllers: [AdminController],
  providers: [AdminService, ProductsService], 
  exports: [AdminService],
})
export class AdminModule {}