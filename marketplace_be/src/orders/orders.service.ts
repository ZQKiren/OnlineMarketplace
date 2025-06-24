// src/orders/orders.service.ts
import { Injectable, NotFoundException, BadRequestException, Inject, forwardRef } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { LoyaltyService } from '../loyalty/loyalty.service'; 
import { CreateOrderDto } from './dto/create-order.dto';
import { OrderStatus, PaymentMethod, PaymentStatus, Prisma } from '@prisma/client';

@Injectable()
export class OrdersService {
  constructor(
    private prisma: PrismaService,
    @Inject(forwardRef(() => LoyaltyService)) 
    private loyaltyService: LoyaltyService,
  ) {}

  async create(userId: string, createOrderDto: CreateOrderDto) {
    const { items, paymentMethod = 'card', shippingAddress, redemptionId } = createOrderDto; 

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

    // ✨ NEW: Handle loyalty redemption if provided
    let discountAmount = 0;
    let redemptionData: { redemption: { pointsCost: number }, discountAmount: number } | null = null;

    if (redemptionId) {
      try {
        redemptionData = await this.loyaltyService.redeemPoints(userId, {
          redemptionId,
          orderValue: totalAmount,
        });
        discountAmount = redemptionData.discountAmount;
      } catch (error) {
        throw new BadRequestException(`Loyalty redemption failed: ${error.message}`);
      }
    }

    const finalAmount = Math.max(0, totalAmount - discountAmount); 

    // Create order with transaction
    const order = await this.prisma.$transaction(async (tx) => {
      // Create order
      const newOrder = await tx.order.create({
        data: {
          userId,
          totalAmount,
          discountAmount, 
          finalAmount, 
          paymentMethod: paymentMethod.toUpperCase() as PaymentMethod,
          shippingAddress: shippingAddress ? (shippingAddress as unknown as Prisma.InputJsonValue) : Prisma.JsonNull,
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

      // ✨ NEW: Link redemption to order if used
      if (redemptionData && redemptionId) {
        await tx.userLoyaltyRedemption.create({
          data: {
            userId,
            redemptionId: redemptionId,
            orderId: newOrder.id,
            pointsUsed: redemptionData.redemption.pointsCost,
            discountApplied: discountAmount,
          },
        });
      }

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
        await tx.payment.create({
          data: {
            orderId: newOrder.id,
            amount: finalAmount, // ✨ UPDATED: Use final amount instead of total
            method: 'COD',
            status: PaymentStatus.PENDING,
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
        userRedemptions: { // ✨ NEW: Include redemption info
          include: {
            redemption: {
              select: {
                title: true,
                discountType: true,
              },
            },
          },
        },
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
        loyaltyTransactions: true, // ✨ NEW: Include loyalty transactions
        userRedemptions: { // ✨ NEW: Include redemption data
          include: {
            redemption: true,
          },
        },
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

  // ✨ UPDATED: Update order status with loyalty points integration
  async updateStatus(id: string, status: OrderStatus, isAdmin: boolean) {
    if (!isAdmin) {
      throw new BadRequestException('Only admin can update order status');
    }

    const order = await this.prisma.order.findUnique({
      where: { id },
      include: {
        payment: true,
        user: true, // ✨ NEW: Include user for loyalty points
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

      // ✨ NEW: Award loyalty points when order is delivered
      if (status === OrderStatus.DELIVERED && order.loyaltyPointsEarned === 0) {
        try {
          await this.loyaltyService.awardOrderPoints(
            order.userId,
            order.id,
            order.finalAmount || order.totalAmount, // Use final amount (after discounts)
          );
        } catch (error) {
          console.error('Error awarding loyalty points:', error);
          // Don't fail the entire transaction if loyalty points fail
        }
      }

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
        userRedemptions: { // ✨ NEW: Include redemption data
          include: {
            redemption: {
              select: {
                title: true,
                pointsCost: true,
              },
            },
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

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