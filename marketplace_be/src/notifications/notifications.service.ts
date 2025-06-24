import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateNotificationDto } from './dto/create-notification.dto';
import { NotificationQueryDto } from './dto/notification-query.dto';
import { NotificationGateway } from './notifications.gateway';

@Injectable()
export class NotificationsService {
  constructor(
    private prisma: PrismaService,
    private notificationGateway: NotificationGateway,
  ) {}

  async create(createNotificationDto: CreateNotificationDto) {
    const { targetUsers, isGlobal, ...notificationData } = createNotificationDto;

    console.log('🔍 Creating notification with data:', {
      ...notificationData,
      targetUsers,
      isGlobal
    });

    // Validate logic
    if (isGlobal && targetUsers?.length) {
      throw new BadRequestException('Cannot specify targetUsers for global notifications');
    }

    if (!isGlobal && (!targetUsers || targetUsers.length === 0)) {
      throw new BadRequestException('targetUsers is required for non-global notifications');
    }

    let processedTargetUsers: string[] = [];

    if (!isGlobal && targetUsers?.length) {
      try {
        console.log('🔍 Processing target users:', targetUsers);
        
        // Check if targetUsers contains emails or user IDs
        const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        const hasEmails = targetUsers.some(item => emailPattern.test(item));
        
        if (hasEmails) {
          console.log('📧 Converting emails to user IDs...');
          
          // Convert emails to user IDs
          const users = await this.prisma.user.findMany({
            where: {
              email: {
                in: targetUsers.filter(item => emailPattern.test(item))
              }
            },
            select: {
              id: true,
              email: true,
              name: true
            }
          });
          
          console.log('👥 Found users:', users);
          
          if (users.length === 0) {
            throw new BadRequestException('No users found with the provided emails');
          }
          
          if (users.length !== targetUsers.filter(item => emailPattern.test(item)).length) {
            const foundEmails = users.map(u => u.email);
            const notFoundEmails = targetUsers.filter(email => 
              emailPattern.test(email) && !foundEmails.includes(email)
            );
            console.warn('⚠️ Some emails not found:', notFoundEmails);
          }
          
          processedTargetUsers = users.map(user => user.id);
        } else {
          console.log('🆔 Using provided user IDs...');
          
          // Validate that all provided IDs exist
          const users = await this.prisma.user.findMany({
            where: {
              id: {
                in: targetUsers
              }
            },
            select: {
              id: true,
              email: true,
              name: true
            }
          });
          
          console.log('👥 Found users by ID:', users);
          
          if (users.length === 0) {
            throw new BadRequestException('No users found with the provided IDs');
          }
          
          if (users.length !== targetUsers.length) {
            const foundIds = users.map(u => u.id);
            const notFoundIds = targetUsers.filter(id => !foundIds.includes(id));
            console.warn('⚠️ Some user IDs not found:', notFoundIds);
          }
          
          processedTargetUsers = users.map(user => user.id);
        }
        
        console.log('✅ Processed target users:', processedTargetUsers);
        
      } catch (error) {
        console.error('❌ Error processing target users:', error);
        throw new BadRequestException(`Failed to process target users: ${error.message}`);
      }
    }

    try {
      // Create notification
      const notification = await this.prisma.notification.create({
        data: {
          ...notificationData,
          isGlobal: isGlobal || false,
          targetUsers: processedTargetUsers,
        },
      });

      console.log('✅ Notification created:', notification.id);

      // Create notification reads for target users
      if (isGlobal) {
        console.log(`📢 Global notification created: ${notification.title}`);
      } else {
        // Create reads for specific users
        const reads = processedTargetUsers.map(userId => ({
          notificationId: notification.id,
          userId,
        }));

        await this.prisma.notificationRead.createMany({
          data: reads,
          skipDuplicates: true,
        });

        console.log(`📬 Notification sent to ${processedTargetUsers.length} users: ${notification.title}`);
      }

      // ✅ Send real-time notification
      try {
        await this.sendRealTimeNotification(notification, processedTargetUsers);
        console.log(`🚀 Real-time notification sent successfully`);
      } catch (error) {
        console.error(`❌ Failed to send real-time notification:`, error);
        // Don't throw here, notification was created successfully
      }

      return notification;
      
    } catch (error) {
      console.error('❌ Error creating notification:', error);
      throw new BadRequestException(`Failed to create notification: ${error.message}`);
    }
  }

  async getUserNotifications(userId: string, query: NotificationQueryDto) {
    const { page = 1, limit = 20, type, search, unreadOnly } = query;
    const skip = (page - 1) * limit;

    // Build where clause for notifications
    const notificationWhere: any = {
      isActive: true,
      OR: [
        { isGlobal: true },
        { targetUsers: { has: userId } },
      ],
    };

    if (type) {
      notificationWhere.type = type;
    }

    if (search) {
      notificationWhere.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { message: { contains: search, mode: 'insensitive' } },
      ];
    }

    // Get notifications with read status
    const notifications = await this.prisma.notification.findMany({
      where: notificationWhere,
      skip,
      take: limit,
      orderBy: { createdAt: 'desc' },
      include: {
        reads: {
          where: { userId },
          select: {
            isRead: true,
            readAt: true,
          },
        },
      },
    });

    // Format response with read status
    const formattedNotifications = notifications.map(notification => {
      const readRecord = notification.reads[0];
      return {
        ...notification,
        isRead: readRecord?.isRead || false,
        readAt: readRecord?.readAt || null,
        reads: undefined, // Remove reads array
      };
    });

    // Filter unread if requested
    const filteredNotifications = unreadOnly
      ? formattedNotifications.filter(n => !n.isRead)
      : formattedNotifications;

    // Get total count
    const total = await this.prisma.notification.count({
      where: notificationWhere,
    });

    return {
      data: filteredNotifications,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async markAsRead(userId: string, notificationId: string) {
    // Check if notification exists and user has access
    const notification = await this.prisma.notification.findFirst({
      where: {
        id: notificationId,
        isActive: true,
        OR: [
          { isGlobal: true },
          { targetUsers: { has: userId } },
        ],
      },
    });

    if (!notification) {
      throw new NotFoundException('Notification not found');
    }

    // Create or update read record
    const readRecord = await this.prisma.notificationRead.upsert({
      where: {
        notificationId_userId: {
          notificationId,
          userId,
        },
      },
      update: {
        isRead: true,
        readAt: new Date(),
      },
      create: {
        notificationId,
        userId,
        isRead: true,
        readAt: new Date(),
      },
    });

    // Send real-time update for read status
    try {
      this.notificationGateway.sendNotificationRead(userId, notificationId);
      
      // Update unread count
      const unreadCount = await this.getUnreadCount(userId);
      this.notificationGateway.sendUnreadCountUpdate(userId, unreadCount.unreadCount);
    } catch (error) {
      console.error(`❌ Failed to send read status update:`, error);
    }

    console.log(`✅ User ${userId} marked notification ${notificationId} as read`);
    return readRecord;
  }

  async markAllAsRead(userId: string) {
    // Get all accessible notifications for user
    const notifications = await this.prisma.notification.findMany({
      where: {
        isActive: true,
        OR: [
          { isGlobal: true },
          { targetUsers: { has: userId } },
        ],
      },
      select: { id: true },
    });

    const notificationIds = notifications.map(n => n.id);

    // Create read records for all notifications
    const readData = notificationIds.map(notificationId => ({
      notificationId,
      userId,
      isRead: true,
      readAt: new Date(),
    }));

    await this.prisma.notificationRead.createMany({
      data: readData,
      skipDuplicates: true,
    });

    // Update existing unread records
    await this.prisma.notificationRead.updateMany({
      where: {
        userId,
        notificationId: { in: notificationIds },
        isRead: false,
      },
      data: {
        isRead: true,
        readAt: new Date(),
      },
    });

    // Send real-time update for unread count
    try {
      this.notificationGateway.sendUnreadCountUpdate(userId, 0);
    } catch (error) {
      console.error(`❌ Failed to send unread count update:`, error);
    }

    console.log(`✅ User ${userId} marked all notifications as read`);
    return { message: 'All notifications marked as read' };
  }

  async getUnreadCount(userId: string) {
    // Count unread notifications
    const unreadCount = await this.prisma.notification.count({
      where: {
        isActive: true,
        OR: [
          { isGlobal: true },
          { targetUsers: { has: userId } },
        ],
        NOT: {
          reads: {
            some: {
              userId,
              isRead: true,
            },
          },
        },
      },
    });

    return { unreadCount };
  }

  // ✅ FIX: Enhanced get all users method for admin
  async getAllUsers(query?: string) {
    const where = query ? {
      OR: [
        { name: { contains: query, mode: 'insensitive' as const } },
        { email: { contains: query, mode: 'insensitive' as const } },
      ]
    } : {};

    const users = await this.prisma.user.findMany({
      where,
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        createdAt: true,
      },
      orderBy: { name: 'asc' },
      take: 50, // Limit for performance
    });

    return users;
  }

  // Admin methods
  async getAllNotifications(query: NotificationQueryDto) {
    const { page = 1, limit = 20, type, search } = query;
    const skip = (page - 1) * limit;

    const where: any = {};

    if (type) {
      where.type = type;
    }

    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { message: { contains: search, mode: 'insensitive' } },
      ];
    }

    const [notifications, total] = await Promise.all([
      this.prisma.notification.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          _count: {
            select: { reads: true },
          },
        },
      }),
      this.prisma.notification.count({ where }),
    ]);

    return {
      data: notifications,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async deleteNotification(id: string) {
    const notification = await this.prisma.notification.findUnique({
      where: { id },
    });

    if (!notification) {
      throw new NotFoundException('Notification not found');
    }

    await this.prisma.notification.delete({
      where: { id },
    });

    console.log(`🗑️ Notification deleted: ${notification.title}`);
    return { message: 'Notification deleted successfully' };
  }

  // ✅ Enhanced test notification method
  async createTestNotification(userId?: string) {
    const testNotification = {
      title: '🧪 Test Notification',
      message: `Test notification created at ${new Date().toLocaleString()}`,
      type: 'SYSTEM_UPDATE' as any,
      priority: 'MEDIUM' as any,
      isGlobal: !userId,
      targetUsers: userId ? [userId] : undefined,
      metadata: { 
        test: true, 
        timestamp: Date.now(),
        source: 'admin-test'
      },
    };

    console.log('🧪 Creating test notification:', testNotification);
    
    try {
      const result = await this.create(testNotification);
      console.log('✅ Test notification created successfully:', result.id);
      return result;
    } catch (error) {
      console.error('❌ Failed to create test notification:', error);
      throw error;
    }
  }

  // Helper method for real-time notifications
  private async sendRealTimeNotification(notification: any, targetUsers?: string[]) {
    console.log(`🚀 Sending real-time notification...`, {
      id: notification.id,
      title: notification.title,
      isGlobal: notification.isGlobal,
      targetUsers: targetUsers?.length || 0
    });

    try {
      if (notification.isGlobal) {
        // Send to all connected users
        const sentCount = this.notificationGateway.sendGlobalNotification(notification);
        console.log(`📢 Global notification sent to ${sentCount} users`);
      } else if (targetUsers && targetUsers.length > 0) {
        // Send to specific users
        const sentCount = this.notificationGateway.sendToUsers(targetUsers, notification);
        console.log(`📨 Notification sent to ${sentCount}/${targetUsers.length} users`);
        
        // Update unread count for each target user
        for (const userId of targetUsers) {
          try {
            const unreadCount = await this.getUnreadCount(userId);
            this.notificationGateway.sendUnreadCountUpdate(userId, unreadCount.unreadCount);
          } catch (error) {
            console.error(`❌ Failed to update unread count for user ${userId}:`, error);
          }
        }
      }
    } catch (error) {
      console.error(`❌ Error sending real-time notification:`, error);
      throw error;
    }
  }

  // Utility methods for creating specific notification types
  async createProductNotification(productId: string, type: 'NEW_PRODUCT' | 'PRICE_DROP' | 'STOCK_ALERT') {
    const product = await this.prisma.product.findUnique({
      where: { id: productId },
      include: { category: true },
    });

    if (!product) return;

    let title: string;
    let message: string;

    switch (type) {
      case 'NEW_PRODUCT':
        title = 'Sản phẩm mới!';
        message = `Sản phẩm "${product.name}" vừa được thêm vào danh mục ${product.category.name}`;
        break;
      case 'PRICE_DROP':
        title = 'Giảm giá đặc biệt!';
        message = `Sản phẩm "${product.name}" đang có giá ưu đãi`;
        break;
      case 'STOCK_ALERT':
        title = 'Sắp hết hàng!';
        message = `Sản phẩm "${product.name}" chỉ còn ${product.stock} sản phẩm`;
        break;
    }

    return this.create({
      title,
      message,
      type,
      isGlobal: true,
      metadata: { productId, categoryId: product.categoryId },
    });
  }

  async createOrderNotification(orderId: string, userId: string, status: string) {
    let title: string;
    let message: string;

    switch (status) {
      case 'PROCESSING':
        title = 'Đơn hàng đang xử lý';
        message = 'Đơn hàng của bạn đang được xử lý';
        break;
      case 'SHIPPED':
        title = 'Đơn hàng đã được giao vận';
        message = 'Đơn hàng của bạn đã được giao cho đơn vị vận chuyển';
        break;
      case 'DELIVERED':
        title = 'Đơn hàng đã được giao';
        message = 'Đơn hàng của bạn đã được giao thành công';
        break;
      case 'CANCELLED':
        title = 'Đơn hàng đã bị hủy';
        message = 'Đơn hàng của bạn đã được hủy';
        break;
      default:
        return;
    }

    return this.create({
      title,
      message,
      type: 'ORDER_UPDATE',
      targetUsers: [userId],
      metadata: { orderId },
    });
  }
}