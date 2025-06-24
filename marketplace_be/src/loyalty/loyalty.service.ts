// src/loyalty/loyalty.service.ts
import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { LoyaltyTransactionType, LoyaltyTransactionStatus, Prisma } from '@prisma/client';
import { CreateRedemptionDto } from './dto/create-redemption.dto';
import { RedeemPointsDto } from './dto/redeem-points.dto';

@Injectable()
export class LoyaltyService {
  constructor(private prisma: PrismaService) {}

  private readonly POINTS_CONFIG = {
    EARN_RATE: 0.01,
    MIN_ORDER_FOR_POINTS: 10,
    POINTS_EXPIRY_MONTHS: 12,
    WELCOME_BONUS: 100,
    REVIEW_BONUS: 50,
  };

  calculatePointsFromOrder(orderAmount: number): number {
    if (orderAmount < this.POINTS_CONFIG.MIN_ORDER_FOR_POINTS) {
      return 0;
    }
    return Math.floor(orderAmount * this.POINTS_CONFIG.EARN_RATE);
  }

  async awardOrderPoints(userId: string, orderId: string, orderAmount: number) {
    const pointsToAward = this.calculatePointsFromOrder(orderAmount);
    
    if (pointsToAward <= 0) {
      return null;
    }

    const expiresAt = new Date();
    expiresAt.setMonth(expiresAt.getMonth() + this.POINTS_CONFIG.POINTS_EXPIRY_MONTHS);

    return this.prisma.$transaction(async (tx) => {
      const transaction = await tx.loyaltyTransaction.create({
        data: {
          userId,
          orderId,
          type: LoyaltyTransactionType.EARN,
          status: LoyaltyTransactionStatus.COMPLETED,
          points: pointsToAward,
          description: `Points earned from order #${orderId.slice(-8)}`,
          metadata: {
            orderAmount,
            earnRate: this.POINTS_CONFIG.EARN_RATE,
          } as Prisma.InputJsonValue,
          expiresAt,
        },
      });

      await tx.user.update({
        where: { id: userId },
        data: {
          loyaltyPoints: {
            increment: pointsToAward,
          },
        },
      });

      await tx.order.update({
        where: { id: orderId },
        data: { loyaltyPointsEarned: pointsToAward },
      });

      return transaction;
    });
  }

  async awardWelcomeBonus(userId: string) {
    const existingBonus = await this.prisma.loyaltyTransaction.findFirst({
      where: {
        userId,
        type: LoyaltyTransactionType.BONUS,
        description: { contains: 'Welcome bonus' },
      },
    });

    if (existingBonus) {
      return null;
    }

    return this.prisma.$transaction(async (tx) => {
      const transaction = await tx.loyaltyTransaction.create({
        data: {
          userId,
          type: LoyaltyTransactionType.BONUS,
          status: LoyaltyTransactionStatus.COMPLETED,
          points: this.POINTS_CONFIG.WELCOME_BONUS,
          description: 'Welcome bonus for joining our marketplace!',
          metadata: {
            bonusType: 'welcome',
          } as Prisma.InputJsonValue,
        },
      });

      await tx.user.update({
        where: { id: userId },
        data: {
          loyaltyPoints: {
            increment: this.POINTS_CONFIG.WELCOME_BONUS,
          },
        },
      });

      return transaction;
    });
  }

  async awardReviewPoints(userId: string, productId: string) {
    const existingReviewBonus = await this.prisma.loyaltyTransaction.findFirst({
      where: {
        userId,
        type: LoyaltyTransactionType.BONUS,
        description: { contains: `review for product ${productId}` },
      },
    });

    if (existingReviewBonus) {
      return null;
    }

    return this.prisma.$transaction(async (tx) => {
      const transaction = await tx.loyaltyTransaction.create({
        data: {
          userId,
          type: LoyaltyTransactionType.BONUS,
          status: LoyaltyTransactionStatus.COMPLETED,
          points: this.POINTS_CONFIG.REVIEW_BONUS,
          description: `Points for writing review for product ${productId.slice(-8)}`,
          metadata: {
            bonusType: 'review',
            productId,
          } as Prisma.InputJsonValue,
        },
      });

      await tx.user.update({
        where: { id: userId },
        data: {
          loyaltyPoints: {
            increment: this.POINTS_CONFIG.REVIEW_BONUS,
          },
        },
      });

      return transaction;
    });
  }

  async getRedemptions(isActive = true) {
    return this.prisma.loyaltyRedemption.findMany({
      where: isActive ? { isActive: true } : {},
      orderBy: { pointsCost: 'asc' },
    });
  }

  // ✅ FIXED: Handle date format properly
  async createRedemption(createRedemptionDto: CreateRedemptionDto) {
    const data: any = {
      title: createRedemptionDto.title,
      description: createRedemptionDto.description,
      pointsCost: createRedemptionDto.pointsCost,
      discountType: createRedemptionDto.discountType,
      discountValue: createRedemptionDto.discountValue || null,
      minOrderValue: createRedemptionDto.minOrderValue || null,
      maxUses: createRedemptionDto.maxUses || null,
      isActive: createRedemptionDto.isActive !== undefined ? createRedemptionDto.isActive : true,
      usageCount: 0,
    };

    // Handle validFrom date
    if (createRedemptionDto.validFrom) {
      const validFromDate = createRedemptionDto.validFrom.includes('T') 
        ? new Date(createRedemptionDto.validFrom)
        : new Date(createRedemptionDto.validFrom + 'T00:00:00.000Z');
      
      if (isNaN(validFromDate.getTime())) {
        throw new BadRequestException('Invalid validFrom date format');
      }
      data.validFrom = validFromDate;
    } else {
      data.validFrom = new Date();
    }

    // Handle validUntil date
    if (createRedemptionDto.validUntil) {
      const validUntilDate = createRedemptionDto.validUntil.includes('T')
        ? new Date(createRedemptionDto.validUntil)
        : new Date(createRedemptionDto.validUntil + 'T23:59:59.999Z');
      
      if (isNaN(validUntilDate.getTime())) {
        throw new BadRequestException('Invalid validUntil date format');
      }
      data.validUntil = validUntilDate;
    } else {
      data.validUntil = null;
    }

    // Validate dates
    if (data.validUntil && data.validFrom && data.validUntil <= data.validFrom) {
      throw new BadRequestException('Valid until date must be after valid from date');
    }

    try {
      return await this.prisma.loyaltyRedemption.create({
        data
      });
    } catch (error) {
      console.error('Error creating redemption:', error);
      throw new BadRequestException('Failed to create redemption: ' + error.message);
    }
  }

  async redeemPoints(userId: string, redeemPointsDto: RedeemPointsDto) {
    const { redemptionId, orderValue } = redeemPointsDto;

    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { loyaltyPoints: true },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    const redemption = await this.prisma.loyaltyRedemption.findUnique({
      where: { id: redemptionId },
    });

    if (!redemption || !redemption.isActive) {
      throw new NotFoundException('Redemption option not found or inactive');
    }

    if (user.loyaltyPoints < redemption.pointsCost) {
      throw new BadRequestException('Insufficient loyalty points');
    }

    if (redemption.minOrderValue && orderValue < redemption.minOrderValue) {
      throw new BadRequestException(
        `Minimum order value of $${redemption.minOrderValue} required for this redemption`
      );
    }

    if (redemption.maxUses && redemption.usageCount >= redemption.maxUses) {
      throw new BadRequestException('This redemption option has reached its usage limit');
    }

    const now = new Date();
    if (redemption.validFrom > now) {
      throw new BadRequestException('This redemption is not yet valid');
    }
    if (redemption.validUntil && redemption.validUntil < now) {
      throw new BadRequestException('This redemption has expired');
    }

    let discountAmount = 0;
    if (redemption.discountType === 'PERCENTAGE') {
      discountAmount = (orderValue * (redemption.discountValue || 0)) / 100;
    } else if (redemption.discountType === 'FIXED_AMOUNT') {
      discountAmount = redemption.discountValue || 0;
    } else if (redemption.discountType === 'FREE_SHIPPING') {
      discountAmount = 10;
    }

    discountAmount = Math.min(discountAmount, orderValue);

    return this.prisma.$transaction(async (tx) => {
      const transaction = await tx.loyaltyTransaction.create({
        data: {
          userId,
          type: LoyaltyTransactionType.REDEEM,
          status: LoyaltyTransactionStatus.COMPLETED,
          points: -redemption.pointsCost,
          description: `Redeemed: ${redemption.title}`,
          metadata: {
            redemptionId,
            discountAmount,
            orderValue,
          } as Prisma.InputJsonValue,
        },
      });

      await tx.user.update({
        where: { id: userId },
        data: {
          loyaltyPoints: {
            decrement: redemption.pointsCost,
          },
        },
      });

      await tx.loyaltyRedemption.update({
        where: { id: redemptionId },
        data: {
          usageCount: {
            increment: 1,
          },
        },
      });

      return {
        transaction,
        discountAmount,
        redemption,
      };
    });
  }

  async getUserLoyaltySummary(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { loyaltyPoints: true },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    const recentTransactions = await this.prisma.loyaltyTransaction.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: 10,
      include: {
        order: {
          select: { id: true, totalAmount: true },
        },
      },
    });

    const thirtyDaysFromNow = new Date();
    thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);

    const pointsExpiringSoon = await this.prisma.loyaltyTransaction.aggregate({
      where: {
        userId,
        type: { in: [LoyaltyTransactionType.EARN, LoyaltyTransactionType.BONUS] },
        status: LoyaltyTransactionStatus.COMPLETED,
        expiresAt: {
          lte: thirtyDaysFromNow,
          gte: new Date(),
        },
      },
      _sum: {
        points: true,
      },
    });

    const pointsStats = await this.prisma.loyaltyTransaction.groupBy({
      by: ['type'],
      where: {
        userId,
        status: LoyaltyTransactionStatus.COMPLETED,
      },
      _sum: {
        points: true,
      },
    });

    const totalEarned = pointsStats
      .filter(stat => stat.type === LoyaltyTransactionType.EARN || stat.type === LoyaltyTransactionType.BONUS)
      .reduce((sum, stat) => sum + (stat._sum.points || 0), 0);

    const totalRedeemed = Math.abs(pointsStats
      .filter(stat => stat.type === LoyaltyTransactionType.REDEEM)
      .reduce((sum, stat) => sum + (stat._sum.points || 0), 0));

    return {
      currentBalance: user.loyaltyPoints,
      totalEarned,
      totalRedeemed,
      pointsExpiringSoon: pointsExpiringSoon._sum.points || 0,
      recentTransactions,
      earnRate: this.POINTS_CONFIG.EARN_RATE,
      nextMilestone: this.getNextMilestone(user.loyaltyPoints),
    };
  }

  async getUserTransactionHistory(userId: string, page = 1, limit = 20) {
    const skip = (page - 1) * limit;

    const [transactions, total] = await Promise.all([
      this.prisma.loyaltyTransaction.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
        include: {
          order: {
            select: { id: true, totalAmount: true },
          },
        },
      }),
      this.prisma.loyaltyTransaction.count({
        where: { userId },
      }),
    ]);

    return {
      data: transactions,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async getLoyaltyAnalytics() {
    const totalUsers = await this.prisma.user.count();
    const activeUsers = await this.prisma.user.count({
      where: {
        loyaltyPoints: {
          gt: 0,
        },
      },
    });

    const totalPointsInCirculation = await this.prisma.user.aggregate({
      _sum: {
        loyaltyPoints: true,
      },
    });

    const recentActivity = await this.prisma.loyaltyTransaction.groupBy({
      by: ['type'],
      where: {
        createdAt: {
          gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
        },
      },
      _sum: {
        points: true,
      },
      _count: {
        _all: true,
      },
    });

    const topRedemptions = await this.prisma.loyaltyRedemption.findMany({
      orderBy: { usageCount: 'desc' },
      take: 5,
    });

    return {
      totalUsers,
      activeUsers,
      totalPointsInCirculation: totalPointsInCirculation._sum.loyaltyPoints || 0,
      recentActivity,
      topRedemptions,
      participationRate: totalUsers > 0 ? (activeUsers / totalUsers) * 100 : 0,
    };
  }

  async awardBonusPoints(userId: string, points: number, description: string) {
    return this.prisma.$transaction(async (tx) => {
      const transaction = await tx.loyaltyTransaction.create({
        data: {
          userId,
          type: LoyaltyTransactionType.BONUS,
          status: LoyaltyTransactionStatus.COMPLETED,
          points,
          description: `Admin bonus: ${description}`,
          metadata: {
            bonusType: 'admin',
            adminDescription: description,
          } as Prisma.InputJsonValue,
        },
      });

      await tx.user.update({
        where: { id: userId },
        data: {
          loyaltyPoints: {
            increment: points,
          },
        },
      });

      return transaction;
    });
  }

  async cleanupExpiredPoints() {
    const expiredTransactions = await this.prisma.loyaltyTransaction.findMany({
      where: {
        type: { in: [LoyaltyTransactionType.EARN, LoyaltyTransactionType.BONUS] },
        status: LoyaltyTransactionStatus.COMPLETED,
        expiresAt: {
          lte: new Date(),
        },
      },
    });

    for (const transaction of expiredTransactions) {
      await this.prisma.$transaction(async (tx) => {
        await tx.loyaltyTransaction.create({
          data: {
            userId: transaction.userId,
            type: LoyaltyTransactionType.EXPIRED,
            status: LoyaltyTransactionStatus.COMPLETED,
            points: -transaction.points,
            description: `Points expired from transaction on ${transaction.createdAt.toDateString()}`,
            metadata: {
              originalTransactionId: transaction.id,
            } as Prisma.InputJsonValue,
          },
        });

        await tx.user.update({
          where: { id: transaction.userId },
          data: {
            loyaltyPoints: {
              decrement: transaction.points,
            },
          },
        });

        await tx.loyaltyTransaction.update({
          where: { id: transaction.id },
          data: { status: LoyaltyTransactionStatus.CANCELLED },
        });
      });
    }

    return expiredTransactions.length;
  }

  private getNextMilestone(currentPoints: number) {
    const milestones = [100, 500, 1000, 2500, 5000, 10000];
    const nextMilestone = milestones.find(milestone => milestone > currentPoints);
    
    return nextMilestone ? {
      points: nextMilestone,
      progress: (currentPoints / nextMilestone) * 100,
    } : null;
  }
}