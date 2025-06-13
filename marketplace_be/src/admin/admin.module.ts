// src/admin/admin.module.ts
import { Module } from '@nestjs/common';
import { AdminService } from './admin.service';
import { AdminController } from './admin.controller';
import { UsersService } from 'src/users/users.service';
import { ProductsService } from 'src/products/products.service'; // 🆕 THÊM

@Module({
  controllers: [AdminController],
  providers: [AdminService, UsersService, ProductsService], // 🆕 THÊM ProductsService
  exports: [AdminService],
})
export class AdminModule {}