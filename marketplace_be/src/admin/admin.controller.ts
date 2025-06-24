// src/admin/admin.controller.ts - COMPLETE ENHANCED VERSION
import {
  Controller,
  Get,
  Post,
  Param,
  UseGuards,
  Query,
  ParseIntPipe,
  DefaultValuePipe,
  Body,
  Patch,
  Delete,
} from '@nestjs/common';
import { AdminService } from './admin.service';
import { BlockUserDto, UnblockUserDto } from './dto/block-user.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Role } from '@prisma/client';

@Controller('admin')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.ADMIN)
export class AdminController {
  constructor(private readonly adminService: AdminService) { }

  @Get('dashboard')
  getDashboard() {
    return this.adminService.getDashboardStats();
  }

  @Get('users')
  getUsers(
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(20), ParseIntPipe) limit: number,
    @Query('search') search?: string,
    @Query('role') role?: string,
    @Query('status') status?: string,
    @Query('sortBy') sortBy?: string,
  ) {
    console.log('🔍 Admin Controller - getUsers query params:', {
      page,
      limit,
      search,
      role,
      status,
      sortBy
    });

    return this.adminService.getUsers({
      page,
      limit,
      search,
      role,
      status,
      sortBy,
    });
  }

  @Post('users/:id/block')
  blockUser(
    @Param('id') id: string,
    @Body() blockUserDto: BlockUserDto,
    @CurrentUser() currentUser: any
  ) {
    console.log('🚫 Admin blocking user:', {
      targetUserId: id,
      adminId: currentUser.id,
      adminEmail: currentUser.email,
      reason: blockUserDto.reason
    });

    return this.adminService.blockUser(id, blockUserDto);
  }

  @Post('users/:id/unblock')
  unblockUser(
    @Param('id') id: string,
    @Body() unblockUserDto: UnblockUserDto,
    @CurrentUser() currentUser: any
  ) {
    console.log('✅ Admin unblocking user:', {
      targetUserId: id,
      adminId: currentUser.id,
      adminEmail: currentUser.email,
      note: unblockUserDto.note
    });

    return this.adminService.unblockUser(id, unblockUserDto);
  }

  @Delete('users/:id')
  deleteUser(
    @Param('id') id: string,
    @CurrentUser() currentUser: any
  ) {
    console.log('🗑️ Admin deleting user:', {
      targetUserId: id,
      adminId: currentUser.id,
      adminEmail: currentUser.email
    });

    return this.adminService.deleteUser(id);
  }

  @Get('orders')
  getOrders(
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(20), ParseIntPipe) limit: number,
    @Query('status') status?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    return this.adminService.getOrders({
      page,
      limit,
      status,
      startDate,
      endDate,
    });
  }

  @Patch('orders/:id/status')
  updateOrderStatus(
    @Param('id') id: string,
    @Body('status') status: string,
  ) {
    return this.adminService.updateOrderStatus(id, status);
  }

  @Get('products')
  getAllProducts(
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(20), ParseIntPipe) limit: number,
    @Query('search') search?: string,
    @Query('categoryId') categoryId?: string,
    @Query('sellerId') sellerId?: string,
  ) {
    return this.adminService.getAllProducts({
      page,
      limit,
      search,
      categoryId,
      sellerId,
    });
  }

  @Post('products/bulk-delete')
  bulkDeleteProducts(@Body('productIds') productIds: string[]) {
    return this.adminService.bulkDeleteProducts(productIds);
  }
}