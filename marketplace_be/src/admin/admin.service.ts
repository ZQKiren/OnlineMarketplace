// src/admin/admin.service.ts - COMPLETE VERSION WITH ALL ENHANCEMENTS
import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AdminStatsDto } from './dto/admin-stats.dto';
import { BlockUserDto, UnblockUserDto } from './dto/block-user.dto';
import { NotificationsService } from '../notifications/notifications.service';

@Injectable()
export class AdminService {
  constructor(
    private prisma: PrismaService,
    private notificationsService: NotificationsService
  ) { }

  async getDashboardStats(): Promise<AdminStatsDto> {
    const [
      totalUsers,
      totalProducts,
      totalOrders,
      revenueData,
      recentOrders,
      topProducts,
    ] = await Promise.all([
      this.prisma.user.count(),
      this.prisma.product.count(),
      this.prisma.order.count(),
      this.prisma.order.aggregate({
        where: {
          payment: {
            status: 'COMPLETED',
          },
        },
        _sum: {
          totalAmount: true,
        },
      }),
      this.prisma.order.findMany({
        take: 10,
        orderBy: { createdAt: 'desc' },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
          _count: {
            select: { items: true },
          },
        },
      }),
      this.prisma.orderItem.groupBy({
        by: ['productId'],
        _sum: {
          quantity: true,
        },
        _count: {
          productId: true,
        },
        orderBy: {
          _sum: {
            quantity: 'desc',
          },
        },
        take: 5,
      }),
    ]);

    // Get product details for top products
    const topProductIds = topProducts.map(p => p.productId);
    const productDetails = await this.prisma.product.findMany({
      where: {
        id: { in: topProductIds },
      },
      select: {
        id: true,
        name: true,
        price: true,
        images: true,
      },
    });

    const topProductsWithDetails = topProducts.map(p => {
      const product = productDetails.find(pd => pd.id === p.productId);
      return {
        ...product,
        totalSold: p._sum.quantity,
        orderCount: p._count.productId,
      };
    });

    return {
      totalUsers,
      totalProducts,
      totalOrders,
      totalRevenue: revenueData._sum.totalAmount || 0,
      recentOrders,
      topProducts: topProductsWithDetails,
      userGrowth: [], 
      revenueByMonth: [],
    };
  }

  async blockUser(userId: string, blockUserDto?: BlockUserDto) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        isBlocked: true,
        createdAt: true,
        _count: {
          select: {
            orders: true,
            products: true,
            reviews: true,
          },
        },
      },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    if (user.role === 'ADMIN') {
      throw new BadRequestException('Cannot block admin users');
    }

    if (user.isBlocked) {
      throw new BadRequestException('User is already blocked');
    }

    const result = await this.prisma.$transaction(async (tx) => {
      // Block the user
      const updatedUser = await tx.user.update({
        where: { id: userId },
        data: { isBlocked: true },
        select: {
          id: true,
          email: true,
          name: true,
          role: true,
          isBlocked: true,
          createdAt: true,
          _count: {
            select: {
              orders: true,
              products: true,
              reviews: true,
            },
          },
        },
      });

      return updatedUser;
    });

    console.log('🚫 User blocked successfully:', {
      userId: result.id,
      email: result.email,
      reason: blockUserDto?.reason || 'No reason provided'
    });

    return {
      message: 'User blocked successfully',
      user: result,
      reason: blockUserDto?.reason
    };
  }

  async unblockUser(userId: string, unblockUserDto?: UnblockUserDto) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        isBlocked: true,
      },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    if (!user.isBlocked) {
      throw new BadRequestException('User is not currently blocked');
    }

    const result = await this.prisma.$transaction(async (tx) => {
      // Unblock the user
      const updatedUser = await tx.user.update({
        where: { id: userId },
        data: { isBlocked: false },
        select: {
          id: true,
          email: true,
          name: true,
          role: true,
          isBlocked: true,
          createdAt: true,
          _count: {
            select: {
              orders: true,
              products: true,
              reviews: true,
            },
          },
        },
      });

      return updatedUser;
    });

    console.log('✅ User unblocked successfully:', {
      userId: result.id,
      email: result.email,
      note: unblockUserDto?.note || 'No note provided'
    });

    return {
      message: 'User unblocked successfully',
      user: result,
      note: unblockUserDto?.note
    };
  }

  async deleteUser(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        _count: {
          select: {
            orders: true,
            products: true,
            reviews: true,
            cart: true,
            loyaltyTransactions: true,
          },
        },
      },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    if (user.role === 'ADMIN') {
      throw new BadRequestException('Cannot delete admin users');
    }

    const hasRelatedData = user._count.orders > 0 ||
      user._count.products > 0 ||
      user._count.reviews > 0;

    if (hasRelatedData) {
      const blockResult = await this.blockUser(userId, {
        reason: 'User marked for deletion but has related data'
      });

      return {
        message: 'User has related data and has been blocked instead of deleted',
        user: blockResult.user,
        action: 'BLOCKED_INSTEAD_OF_DELETED'
      };
    }

    try {
      await this.prisma.$transaction(async (tx) => {
        await tx.cartItem.deleteMany({
          where: { userId },
        });

        await tx.loyaltyTransaction.deleteMany({
          where: { userId },
        });

        await tx.userLoyaltyRedemption.deleteMany({
          where: { userId },
        });

        await tx.notificationRead.deleteMany({
          where: { userId },
        });

        await tx.userPreference.deleteMany({
          where: { userId },
        });

        await tx.productView.deleteMany({
          where: { userId },
        });

        await tx.message.deleteMany({
          where: { senderId: userId },
        });

        await tx.chat.deleteMany({
          where: {
            OR: [
              { buyerId: userId },
              { sellerId: userId },
            ],
          },
        });

        await tx.user.delete({
          where: { id: userId },
        });
      });

      console.log('🗑️ User deleted successfully:', {
        userId: user.id,
        email: user.email
      });

      return {
        message: 'User deleted successfully',
        deletedUserId: userId,
        action: 'DELETED'
      };
    } catch (error) {
      console.error('Error deleting user:', error);
      throw new BadRequestException(
        'Cannot delete user due to existing relationships. Consider blocking the user instead.'
      );
    }
  }

  async getUsers(filters: {
    page?: number;
    limit?: number;
    search?: string;
    role?: string;
    status?: string;
    sortBy?: string;
  } = {}) {
    const {
      page = 1,
      limit = 20,
      search,
      role,
      status,
      sortBy
    } = filters;

    const skip = (page - 1) * limit;

    // Build WHERE clause based on filters
    const where: any = {};

    // Search filter - search by name or email
    if (search && search.trim()) {
      where.OR = [
        { name: { contains: search.trim(), mode: 'insensitive' } },
        { email: { contains: search.trim(), mode: 'insensitive' } },
      ];
    }

    // Role filter
    if (role && role !== '') {
      where.role = role;
    }

    // Status filter (blocked/active)
    if (status && status !== '') {
      if (status === 'blocked') {
        where.isBlocked = true;
      } else if (status === 'active') {
        where.isBlocked = false;
      }
    }

    // Build ORDER BY clause based on sortBy
    let orderBy: any = { createdAt: 'desc' };

    if (sortBy && sortBy !== '') {
      switch (sortBy) {
        case 'newest':
          orderBy = { createdAt: 'desc' };
          break;
        case 'oldest':
          orderBy = { createdAt: 'asc' };
          break;
        case 'name':
          orderBy = { name: 'asc' };
          break;
        case 'orders':
          orderBy = { createdAt: 'desc' };
          break;
        default:
          orderBy = { createdAt: 'desc' };
      }
    }

    console.log('🔍 Admin Service - getUsers filters:', {
      where,
      orderBy,
      page,
      limit,
      search,
      role,
      status,
      sortBy
    });

    try {
      const [users, total] = await Promise.all([
        this.prisma.user.findMany({
          where,
          skip,
          take: limit,
          select: {
            id: true,
            email: true,
            name: true,
            phone: true,
            avatar: true,
            role: true,
            isBlocked: true,
            createdAt: true,
            updatedAt: true,
            _count: {
              select: {
                orders: true,
                products: true,
                reviews: true,
              },
            },
          },
          orderBy,
        }),
        this.prisma.user.count({ where }),
      ]);

      // ✅ Handle special sorting for 'orders' after data fetch
      let sortedUsers = users;
      if (sortBy === 'orders') {
        sortedUsers = users.sort((a, b) => (b._count?.orders || 0) - (a._count?.orders || 0));
      }

      console.log('✅ Admin Service - getUsers result:', {
        totalUsers: total,
        returnedUsers: sortedUsers.length,
        firstUser: sortedUsers[0]?.name
      });

      return {
        data: sortedUsers,
        meta: {
          total,
          page,
          limit,
          totalPages: Math.ceil(total / limit),
        },
      };
    } catch (error) {
      console.error('❌ Admin Service - getUsers error:', error);
      throw error;
    }
  }

  async getOrders(filters: {
    page?: number;
    limit?: number;
    status?: string;
    startDate?: string;
    endDate?: string;
  }) {
    const { page = 1, limit = 20, status, startDate, endDate } = filters;
    const skip = (page - 1) * limit;

    const where: any = {};

    // Status filter
    if (status) {
      where.status = status;
    }

    // Date range filter
    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) where.createdAt.gte = new Date(startDate);
      if (endDate) where.createdAt.lte = new Date(endDate);
    }

    const [orders, total] = await Promise.all([
      this.prisma.order.findMany({
        where,
        skip,
        take: limit,
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
                },
              },
            },
          },
          payment: true,
          _count: {
            select: { items: true },
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
      }),
      this.prisma.order.count({ where }),
    ]);

    return {
      data: orders,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async updateOrderStatus(orderId: string, status: string) {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
    });

    if (!order) {
      throw new NotFoundException('Order not found');
    }

    return this.prisma.order.update({
      where: { id: orderId },
      data: { status: status as any },
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
            product: true,
          },
        },
        payment: true,
      },
    });
  }

  async getAllProducts(filters: {
    page?: number;
    limit?: number;
    search?: string;
    categoryId?: string;
    sellerId?: string;
  }) {
    const { page = 1, limit = 20, search, categoryId, sellerId } = filters;
    const skip = (page - 1) * limit;

    const where: any = {};

    // Search filter
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
      ];
    }

    // Category filter
    if (categoryId) {
      where.categoryId = categoryId;
    }

    // Seller filter
    if (sellerId) {
      where.sellerId = sellerId;
    }

    const [products, total] = await Promise.all([
      this.prisma.product.findMany({
        where,
        skip,
        take: limit,
        include: {
          category: {
            select: {
              id: true,
              name: true,
            },
          },
          seller: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
          _count: {
            select: {
              reviews: true,
              orderItems: true,
            },
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
      }),
      this.prisma.product.count({ where }),
    ]);

    return {
      data: products,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async bulkDeleteProducts(productIds: string[]) {
    const result = await this.prisma.product.deleteMany({
      where: {
        id: { in: productIds },
      },
    });

    return {
      message: `Deleted ${result.count} products successfully`,
      deletedCount: result.count,
    };
  }
}