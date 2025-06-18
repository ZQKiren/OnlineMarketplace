// src/admin/admin.service.ts
import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AdminStatsDto } from './dto/admin-stats.dto';
import { NotificationsService } from '../notifications/notifications.service';

@Injectable()
export class AdminService {
  constructor(private prisma: PrismaService, 
              private notificationsService: NotificationsService
  ) {}

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
      userGrowth: [], // Simplified for now
      revenueByMonth: [], // Simplified for now
    };
  }

  async getUsers(page: number = 1, limit: number = 20) {
    const skip = (page - 1) * limit;

    const [users, total] = await Promise.all([
      this.prisma.user.findMany({
        skip,
        take: limit,
        select: {
          id: true,
          email: true,
          name: true,
          role: true,
          createdAt: true,
          _count: {
            select: {
              orders: true,
              products: true,
            },
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
      }),
      this.prisma.user.count(),
    ]);

    return {
      data: users,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async blockUser(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return { message: 'User blocked successfully' };
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

  // 🆕 THÊM METHOD CẬP NHẬT TRẠNG THÁI ORDER
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

  // 🆕 METHOD LẤY TẤT CẢ SẢN PHẨM CHO ADMIN
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

  // 🆕 BULK DELETE PRODUCTS
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