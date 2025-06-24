import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
  ConnectedSocket,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { JwtService } from '@nestjs/jwt';

// notifications.gateway.ts
@WebSocketGateway({
  cors: {
    origin: '*',
    methods: ['GET', 'POST'],
    credentials: true,
  },
  
})
export class NotificationGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private connectedUsers: Map<string, Set<string>> = new Map(); // userId -> Set of socketIds

  constructor(private jwtService: JwtService) {}

  async handleConnection(client: Socket) {
    try {
      console.log(`🔌 New socket connection: ${client.id}`);
      
      const token = client.handshake.auth?.token || 
                   client.handshake.headers?.authorization?.replace('Bearer ', '') ||
                   client.request?.headers?.authorization?.replace('Bearer ', '');
      
      console.log('🔍 Token received:', token ? `${token.substring(0, 20)}...` : 'NO TOKEN');
      
      if (!token) {
        console.log('❌ No token provided, disconnecting client');
        client.emit('error', { message: 'Authentication token required' });
        client.disconnect();
        return;
      }

      // Verify JWT token
      const payload = this.jwtService.verify(token);
      const userId = payload.sub || payload.userId || payload.id;
      
      console.log('✅ Token verified for user:', userId);

      // Store user connection
      if (!this.connectedUsers.has(userId)) {
        this.connectedUsers.set(userId, new Set());
      }
      this.connectedUsers.get(userId)!.add(client.id);

      // Join user to their personal room
      await client.join(`user_${userId}`);
      
      console.log(`✅ User ${userId} connected via socket ${client.id}`);
      console.log(`👥 Total connected users: ${this.connectedUsers.size}`);
      
      // Store userId in socket for later use
      client.data.userId = userId;

      // ✅ Send connection confirmation
      client.emit('connected', { 
        message: 'Connected to notification system',
        userId: userId 
      });

    } catch (error) {
      console.error('❌ WebSocket authentication failed:', error.message);
      client.emit('error', { message: 'Authentication failed' });
      client.disconnect();
    }
  }

  handleDisconnect(client: Socket) {
    const userId = client.data.userId;
    if (userId && this.connectedUsers.has(userId)) {
      this.connectedUsers.get(userId)!.delete(client.id);
      
      // Remove user if no more connections
      if (this.connectedUsers.get(userId)!.size === 0) {
        this.connectedUsers.delete(userId);
      }
    }
    
    console.log(`🔌 Socket ${client.id} disconnected (User: ${userId})`);
    console.log(`👥 Remaining connected users: ${this.connectedUsers.size}`);
  }

  @SubscribeMessage('join-notifications')
  handleJoinNotifications(@ConnectedSocket() client: Socket) {
    const userId = client.data.userId;
    if (userId) {
      client.join(`notifications_${userId}`);
      console.log(`📬 User ${userId} joined notifications room`);
      client.emit('joined-notifications', { success: true });
    } else {
      client.emit('error', { message: 'Not authenticated' });
    }
  }

  @SubscribeMessage('ping')
  handlePing(@ConnectedSocket() client: Socket) {
    console.log(`🏓 Ping from ${client.id}`);
    client.emit('pong', { timestamp: Date.now() });
  }

  @SubscribeMessage('join-room')
  handleJoinRoom(@ConnectedSocket() client: Socket, room: string) {
    client.join(room);
    console.log(`👥 Socket ${client.id} joined room: ${room}`);
  }

  // ✅ FIX: Send notification to specific users
  sendToUsers(userIds: string[], notification: any): number {
    console.log(`📨 Sending notification to users:`, { userIds, title: notification.title });
    
    let sentCount = 0;
    userIds.forEach(userId => {
      const userSockets = this.connectedUsers.get(userId);
      if (userSockets && userSockets.size > 0) {
        // Send to user's personal room
        this.server.to(`user_${userId}`).emit('new-notification', notification);
        sentCount++;
        console.log(`✅ Sent to user ${userId} (${userSockets.size} connections)`);
      } else {
        console.log(`⚠️ User ${userId} not connected`);
      }
    });
    
    console.log(`📊 Notification sent to ${sentCount}/${userIds.length} connected users`);
    return sentCount;
  }

  // ✅ FIX: Send global notification
  sendGlobalNotification(notification: any): number {
    console.log(`📢 Sending global notification:`, notification.title);
    console.log(`👥 Broadcasting to ${this.connectedUsers.size} connected users`);
    
    this.server.emit('new-notification', notification);
    
    console.log(`✅ Global notification broadcasted`);
    return this.connectedUsers.size;
  }

  // ✅ FIX: Send notification count update
  sendUnreadCountUpdate(userId: string, unreadCount: number) {
    console.log(`📊 Updating unread count for user ${userId}: ${unreadCount}`);
    this.server.to(`user_${userId}`).emit('unread-count-update', { 
      unreadCount,
      timestamp: Date.now() 
    });
  }

  // ✅ FIX: ADD MISSING METHOD - Send notification read confirmation
  sendNotificationRead(userId: string, notificationId: string) {
    console.log(`✅ Notification read by user ${userId}: ${notificationId}`);
    this.server.to(`user_${userId}`).emit('notification-read', { 
      notificationId,
      timestamp: Date.now() 
    });
  }

  // ✅ Get connected users count
  getConnectedUsersCount(): number {
    return this.connectedUsers.size;
  }

  // ✅ Check if user is online
  isUserOnline(userId: string): boolean {
    return this.connectedUsers.has(userId);
  }

  // ✅ Get all connected user IDs
  getConnectedUserIds(): string[] {
    return Array.from(this.connectedUsers.keys());
  }

  // ✅ Debug method to get connection status
  getConnectionStatus() {
    const status = {
      totalConnectedUsers: this.connectedUsers.size,
      totalSockets: Array.from(this.connectedUsers.values())
        .reduce((total, sockets) => total + sockets.size, 0),
      users: Object.fromEntries(
        Array.from(this.connectedUsers.entries()).map(([userId, sockets]) => [
          userId, 
          { socketCount: sockets.size, socketIds: Array.from(sockets) }
        ])
      )
    };
    
    console.log('📊 Connection Status:', status);
    return status;
  }

  // ✅ FIX: Add method to send typing indicators (for future use)
  sendTypingIndicator(userId: string, isTyping: boolean) {
    this.server.to(`user_${userId}`).emit('typing-indicator', { 
      isTyping,
      timestamp: Date.now() 
    });
  }

  // ✅ FIX: Add method to send system announcements
  sendSystemAnnouncement(announcement: any) {
    console.log(`📢 Sending system announcement:`, announcement.title);
    this.server.emit('system-announcement', announcement);
    return this.connectedUsers.size;
  }

  // ✅ FIX: Add method to force disconnect user (admin feature)
  forceDisconnectUser(userId: string, reason?: string) {
    const userSockets = this.connectedUsers.get(userId);
    if (userSockets) {
      userSockets.forEach(socketId => {
        const socket = this.server.sockets.sockets.get(socketId);
        if (socket) {
          socket.emit('force-disconnect', { reason: reason || 'Disconnected by admin' });
          socket.disconnect();
        }
      });
      this.connectedUsers.delete(userId);
      console.log(`🔨 Force disconnected user ${userId}:`, reason);
    }
  }

  // ✅ FIX: Add heartbeat/health check
  @SubscribeMessage('heartbeat')
  handleHeartbeat(@ConnectedSocket() client: Socket) {
    client.emit('heartbeat-response', { 
      timestamp: Date.now(),
      userId: client.data.userId,
      connected: true
    });
  }
}