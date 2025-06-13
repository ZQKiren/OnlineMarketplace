// src/orders/orders.controller.ts
import { 
  Controller, 
  Get, 
  Post, 
  Body, 
  Patch, 
  Param, 
  UseGuards,
  Query,
  ParseEnumPipe,
} from '@nestjs/common';
import { OrdersService } from './orders.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Roles } from '../auth/decorators/roles.decorator';
import { Role, OrderStatus } from '@prisma/client';

@Controller('orders')
@UseGuards(JwtAuthGuard)
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  @Post()
  create(
    @CurrentUser() user: any,
    @Body() createOrderDto: CreateOrderDto,
  ) {
    return this.ordersService.create(user.id, createOrderDto);
  }

  @Get()
  findAll(@CurrentUser() user: any) {
    return this.ordersService.findAll(user.id, user.role === Role.ADMIN);
  }

  @Get('my-orders')
  getUserOrders(@CurrentUser() user: any) {
    return this.ordersService.getUserOrderHistory(user.id);
  }

  @Get(':id')
  findOne(
    @Param('id') id: string,
    @CurrentUser() user: any,
  ) {
    return this.ordersService.findOne(id, user.id, user.role === Role.ADMIN);
  }

  @Patch(':id/status')
  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN)
  updateStatus(
    @Param('id') id: string,
    @Body('status', new ParseEnumPipe(OrderStatus)) status: OrderStatus,
    @CurrentUser() user: any,
  ) {
    return this.ordersService.updateStatus(id, status, user.role === Role.ADMIN);
  }

  // New endpoint to complete COD payment
  @Post(':id/complete-cod-payment')
  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN)
  completeCODPayment(
    @Param('id') id: string,
    @CurrentUser() user: any,
  ) {
    return this.ordersService.completeCODPayment(id, user.role === Role.ADMIN);
  }
}