// src/orders/orders.service.ts
import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { OrderStatus, PaymentMethod, PaymentStatus, Prisma } from '@prisma/client'; // ✅ THÊM Prisma import

@Injectable()
export class OrdersService {
  constructor(private prisma: PrismaService) {}

  async create(userId: string, createOrderDto: CreateOrderDto) {
    const { items, paymentMethod = 'card', shippingAddress } = createOrderDto;

    // Validate products and calculate total
    let totalAmount = 0;
    const orderItems: { productId: string; quantity: number; price: number }[] = [];

    for (const item of items) {
      const product = await this.prisma.product.findUnique({
        where: { id: item.productId },
      });

      if (!product) {
        throw new NotFoundException(`Product ${item.productId} not found`);
      }

      if (product.stock < item.quantity) {
        throw new BadRequestException(`Insufficient stock for product ${product.name}`);
      }

      totalAmount += product.price * item.quantity;
      orderItems.push({
        productId: item.productId,
        quantity: item.quantity,
        price: product.price,
      });
    }

    // Create order with transaction
    const order = await this.prisma.$transaction(async (tx) => {
      // Create order
      const newOrder = await tx.order.create({
        data: {
          userId,
          totalAmount,
          paymentMethod: paymentMethod.toUpperCase() as PaymentMethod, // Convert to enum
          shippingAddress: shippingAddress ? (shippingAddress as unknown as Prisma.InputJsonValue) : Prisma.JsonNull, // ✅ FIX: Cast to Prisma.InputJsonValue
          items: {
            create: orderItems,
          },
        },
        include: {
          items: {
            include: {
              product: true,
            },
          },
        },
      });

      // Update product stock
      for (const item of orderItems) {
        await tx.product.update({
          where: { id: item.productId },
          data: {
            stock: {
              decrement: item.quantity,
            },
          },
        });
      }

      // Create payment record based on payment method
      if (paymentMethod === 'cod') {
        // For COD, create payment record with PENDING status
        await tx.payment.create({
          data: {
            orderId: newOrder.id,
            amount: totalAmount,
            method: 'COD',
            status: PaymentStatus.PENDING, // Will be updated when delivered
          },
        });
      }
      // For card payments, payment will be created by PaymentsService

      // Clear user's cart
      await tx.cartItem.deleteMany({
        where: { userId },
      });

      return newOrder;
    });

    return order;
  }

  async findAll(userId: string, isAdmin: boolean) {
    const where = isAdmin ? {} : { userId };

    const orders = await this.prisma.order.findMany({
      where,
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        items: {
          include: {
            product: {
              select: {
                id: true,
                name: true,
                price: true,
                images: true,
              },
            },
          },
        },
        payment: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return orders;
  }

  async findOne(id: string, userId: string, isAdmin: boolean) {
    const order = await this.prisma.order.findUnique({
      where: { id },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
          },
        },
        items: {
          include: {
            product: {
              include: {
                category: true,
                seller: {
                  select: {
                    id: true,
                    name: true,
                  },
                },
              },
            },
          },
        },
        payment: true,
      },
    });

    if (!order) {
      throw new NotFoundException('Order not found');
    }

    // Check permission
    if (!isAdmin && order.userId !== userId) {
      throw new NotFoundException('Order not found');
    }

    return order;
  }

  async updateStatus(id: string, status: OrderStatus, isAdmin: boolean) {
    if (!isAdmin) {
      throw new BadRequestException('Only admin can update order status');
    }

    const order = await this.prisma.order.findUnique({
      where: { id },
      include: {
        payment: true,
      },
    });

    if (!order) {
      throw new NotFoundException('Order not found');
    }

    return this.prisma.$transaction(async (tx) => {
      // Update order status
      const updatedOrder = await tx.order.update({
        where: { id },
        data: { status },
        include: {
          items: {
            include: {
              product: true,
            },
          },
          payment: true,
        },
      });

      // If COD order is marked as DELIVERED, mark payment as COMPLETED
      if (
        status === OrderStatus.DELIVERED && 
        order.paymentMethod === PaymentMethod.COD &&
        order.payment &&
        order.payment.status === PaymentStatus.PENDING
      ) {
        await tx.payment.update({
          where: { id: order.payment.id },
          data: { status: PaymentStatus.COMPLETED },
        });
      }

      return updatedOrder;
    });
  }

  async getUserOrderHistory(userId: string) {
    return this.prisma.order.findMany({
      where: { userId },
      include: {
        items: {
          include: {
            product: {
              select: {
                id: true,
                name: true,
                price: true,
                images: true,
              },
            },
          },
        },
        payment: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  // Method to mark COD payment as completed manually
  async completeCODPayment(orderId: string, isAdmin: boolean) {
    if (!isAdmin) {
      throw new BadRequestException('Only admin can complete COD payments');
    }

    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      include: { payment: true },
    });

    if (!order) {
      throw new NotFoundException('Order not found');
    }

    if (order.paymentMethod !== PaymentMethod.COD) {
      throw new BadRequestException('This is not a COD order');
    }

    if (!order.payment || order.payment.status === PaymentStatus.COMPLETED) {
      throw new BadRequestException('Payment already completed or not found');
    }

    return this.prisma.payment.update({
      where: { id: order.payment.id },
      data: { status: PaymentStatus.COMPLETED },
    });
  }
}