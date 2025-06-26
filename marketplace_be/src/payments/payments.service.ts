// src/payments/payments.service.ts
import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';
import { CreatePaymentDto } from './dto/create-payment.dto';
import { PaymentStatus, PaymentMethod } from '@prisma/client';
import Stripe from 'stripe';

@Injectable()
export class PaymentsService {
  private stripe: Stripe;

  constructor(
    private prisma: PrismaService,
    private configService: ConfigService,
  ) {
    const stripeSecretKey = this.configService.get<string>('STRIPE_SECRET_KEY');
    if (!stripeSecretKey) {
      throw new Error('STRIPE_SECRET_KEY is not defined in environment variables');
    }
    this.stripe = new Stripe(stripeSecretKey, {
      apiVersion: '2025-05-28.basil',
    });
  }

  async createPaymentIntent(userId: string, createPaymentDto: CreatePaymentDto) {
    const { orderId, paymentMethodId } = createPaymentDto;

    // Get order
    const order = await this.prisma.order.findFirst({
      where: {
        id: orderId,
        userId,
      },
      include: {
        payment: true,
      },
    });

    if (!order) {
      throw new NotFoundException('Order not found');
    }

    // Check if this is a COD order
    if (order.paymentMethod === PaymentMethod.COD) {
      throw new BadRequestException('This is a Cash on Delivery order, no card payment required');
    }

    if (order.payment) {
      throw new BadRequestException('Payment already exists for this order');
    }

    try {
      // Create payment intent
      const paymentIntent = await this.stripe.paymentIntents.create({
        amount: Math.round(order.totalAmount * 100), // Convert to cents
        currency: 'usd',
        payment_method: paymentMethodId,
        confirm: true,
        metadata: {
          orderId: order.id,
          userId,
        },
        automatic_payment_methods: {
          enabled: true,
          allow_redirects: 'never'
        }
      });

      // Create payment record
      const payment = await this.prisma.payment.create({
        data: {
          orderId: order.id,
          amount: order.totalAmount,
          stripePaymentId: paymentIntent.id,
          status: paymentIntent.status === 'succeeded' ? PaymentStatus.COMPLETED : PaymentStatus.PENDING,
          method: paymentIntent.payment_method_types[0],
        },
      });

      // Update order status if payment succeeded
      if (payment.status === PaymentStatus.COMPLETED) {
        await this.prisma.order.update({
          where: { id: order.id },
          data: { status: 'PROCESSING' },
        });
      }

      return {
        payment,
        clientSecret: paymentIntent.client_secret,
      };
    } catch (error) {
      console.error('Stripe payment error:', error);
      throw new BadRequestException(error.message);
    }
  }

  async handleWebhook(signature: string, payload: Buffer) {
    const webhookSecret = this.configService.get('STRIPE_WEBHOOK_SECRET');
    let event: Stripe.Event;

    try {
      event = this.stripe.webhooks.constructEvent(
        payload,
        signature,
        webhookSecret,
      );
    } catch (error) {
      throw new BadRequestException('Webhook signature verification failed');
    }

    switch (event.type) {
      case 'payment_intent.succeeded':
        await this.handlePaymentSuccess(event.data.object as Stripe.PaymentIntent);
        break;
      case 'payment_intent.payment_failed':
        await this.handlePaymentFailure(event.data.object as Stripe.PaymentIntent);
        break;
    }

    return { received: true };
  }

  private async handlePaymentSuccess(paymentIntent: Stripe.PaymentIntent) {
    const payment = await this.prisma.payment.findUnique({
      where: { stripePaymentId: paymentIntent.id },
    });

    if (payment) {
      await this.prisma.$transaction([
        this.prisma.payment.update({
          where: { id: payment.id },
          data: { status: PaymentStatus.COMPLETED },
        }),
        this.prisma.order.update({
          where: { id: payment.orderId },
          data: { status: 'PROCESSING' },
        }),
      ]);
    }
  }

  private async handlePaymentFailure(paymentIntent: Stripe.PaymentIntent) {
    const payment = await this.prisma.payment.findUnique({
      where: { stripePaymentId: paymentIntent.id },
    });

    if (payment) {
      await this.prisma.payment.update({
        where: { id: payment.id },
        data: { status: PaymentStatus.FAILED },
      });
    }
  }

  // Get payment methods summary for admin
  async getPaymentMethodsStats() {
    const stats = await this.prisma.order.groupBy({
      by: ['paymentMethod'],
      _count: {
        paymentMethod: true,
      },
      _sum: {
        totalAmount: true,
      },
    });

    return stats.map(stat => ({
      method: stat.paymentMethod,
      totalOrders: stat._count.paymentMethod,
      totalRevenue: stat._sum.totalAmount || 0,
    }));
  }

  // Get COD orders that need payment completion
  async getPendingCODOrders() {
    return this.prisma.order.findMany({
      where: {
        paymentMethod: PaymentMethod.COD,
        payment: {
          status: PaymentStatus.PENDING,
        },
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
          },
        },
        payment: true,
        items: {
          include: {
            product: {
              select: {
                id: true,
                name: true,
                price: true,
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
}