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
      
      const token = client.handshake.auth?.token || 
                   client.handshake.headers?.authorization?.replace('Bearer ', '') ||
                   client.request?.headers?.authorization?.replace('Bearer ', '');
      
      
      if (!token) {
        client.emit('error', { message: 'Authentication token required' });
        client.disconnect();
        return;
      }

      // Verify JWT token
      const payload = this.jwtService.verify(token);
      const userId = payload.sub || payload.userId || payload.id;
      
      

      // Store user connection
      if (!this.connectedUsers.has(userId)) {
        this.connectedUsers.set(userId, new Set());
      }
      this.connectedUsers.get(userId)!.add(client.id);

      // Join user to their personal room
      await client.join(`user_${userId}`);
      
      

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
    
  }

  @SubscribeMessage('join-notifications')
  handleJoinNotifications(@ConnectedSocket() client: Socket) {
    const userId = client.data.userId;
    if (userId) {
      client.join(`notifications_${userId}`);
      client.emit('joined-notifications', { success: true });
    } else {
      client.emit('error', { message: 'Not authenticated' });
    }
  }

  @SubscribeMessage('ping')
  handlePing(@ConnectedSocket() client: Socket) {
    client.emit('pong', { timestamp: Date.now() });
  }

  @SubscribeMessage('join-room')
  handleJoinRoom(@ConnectedSocket() client: Socket, room: string) {
    client.join(room);
  }

  // ✅ FIX: Send notification to specific users
  sendToUsers(userIds: string[], notification: any): number {
    
    let sentCount = 0;
    userIds.forEach(userId => {
      const userSockets = this.connectedUsers.get(userId);
      if (userSockets && userSockets.size > 0) {
        // Send to user's personal room
        this.server.to(`user_${userId}`).emit('new-notification', notification);
        sentCount++;
      } else {
      }
    });
    
    return sentCount;
  }

  // ✅ FIX: Send global notification
  sendGlobalNotification(notification: any): number {
    
    this.server.emit('new-notification', notification);
    
    return this.connectedUsers.size;
  }

  // ✅ FIX: Send notification count update
  sendUnreadCountUpdate(userId: string, unreadCount: number) {
    this.server.to(`user_${userId}`).emit('unread-count-update', { 
      unreadCount,
      timestamp: Date.now() 
    });
  }

  // ✅ FIX: ADD MISSING METHOD - Send notification read confirmation
  sendNotificationRead(userId: string, notificationId: string) {
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