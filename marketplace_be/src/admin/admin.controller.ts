// src/admin/admin.controller.ts
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
} from '@nestjs/common';
import { AdminService } from './admin.service';
import { UsersService } from '../users/users.service';
import { CreateUserDto } from '../users/dto/create-user.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { Role } from '@prisma/client';

@Controller('admin')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.ADMIN)
export class AdminController {
  constructor(
    private readonly adminService: AdminService, 
    private readonly usersService: UsersService,) {}

  @Get('dashboard')
  getDashboard() {
    return this.adminService.getDashboardStats();
  }

  @Get('users')
  getUsers(
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(20), ParseIntPipe) limit: number,
  ) {
    return this.adminService.getUsers(page, limit);
  }

  @Post('users/:id/block')
  blockUser(@Param('id') id: string) {
    return this.adminService.blockUser(id);
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

  // 🆕 THÊM METHOD CẬP NHẬT TRẠNG THÁI ORDER
  @Patch('orders/:id/status')
  updateOrderStatus(
    @Param('id') id: string,
    @Body('status') status: string,
  ) {
    return this.adminService.updateOrderStatus(id, status);
  }

  @Post('users')
  createUser(@Body() createUserDto: CreateUserDto) {
    return this.usersService.create(createUserDto);
  }

  // 🆕 THÊM ENDPOINT CHO PRODUCTS (THEO YÊU CẦU TÀI LIỆU)
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

  // 🆕 BULK DELETE (THEO YÊU CẦU: Thêm, sửa, xóa sản phẩm)
  @Post('products/bulk-delete')
  bulkDeleteProducts(@Body('productIds') productIds: string[]) {
    return this.adminService.bulkDeleteProducts(productIds);
  }
}