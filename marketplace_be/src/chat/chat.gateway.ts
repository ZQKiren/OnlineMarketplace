// src/chat/chat.gateway.ts
import {
  WebSocketGateway,
  SubscribeMessage,
  MessageBody,
  ConnectedSocket,
  OnGatewayConnection,
  OnGatewayDisconnect,
  WebSocketServer,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Injectable, UseGuards } from '@nestjs/common';
import { ChatService } from './chat.service';
import { SendMessageDto } from './dto/send-message.dto';
import { WsJwtGuard } from './guards/ws-jwt.guard';

interface AuthenticatedSocket extends Socket {
  user?: {
    id: string;
    email: string;
    name: string;
    role: string;
  };
}

@WebSocketGateway({
  cors: {
    origin: [
      'http://localhost:3000',
      'http://localhost:5173',
      process.env.FRONTEND_URL,
    ],
    credentials: true,
  },
  namespace: '/chat',
})
@Injectable()
export class ChatGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private connectedUsers = new Map<string, string>(); // userId -> socketId

  constructor(private chatService: ChatService) {}

  async handleConnection(client: AuthenticatedSocket) {
    try {
      // Authentication will be handled by WsJwtGuard in message handlers
      console.log(`Client connected: ${client.id}`);
    } catch (error) {
      console.error('Connection error:', error);
      client.disconnect();
    }
  }

  async handleDisconnect(client: AuthenticatedSocket) {
    console.log(`Client disconnected: ${client.id}`);
    
    if (client.user) {
      this.connectedUsers.delete(client.user.id);
      await this.chatService.updateUserOnlineStatus(client.user.id, false);
      
      // Notify other users about offline status
      this.server.emit('user-offline', { userId: client.user.id });
    }
  }

  @UseGuards(WsJwtGuard)
  @SubscribeMessage('join-user')
  async handleJoinUser(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() data: { userId: string },
  ) {
    if (!client.user) {
      client.emit('error', { message: 'User not authenticated' });
      return;
    }
    const userId = client.user.id;
    
    // Store connection
    this.connectedUsers.set(userId, client.id);
    
    // Update online status
    await this.chatService.updateUserOnlineStatus(userId, true);
    
    // Join user to their personal room
    client.join(`user:${userId}`);
    
    // Notify other users about online status
    this.server.emit('user-online', { userId });
    
    client.emit('joined', { userId });
  }

  @UseGuards(WsJwtGuard)
  @SubscribeMessage('join-chat')
  async handleJoinChat(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() data: { chatId: string },
  ) {
    try {
      // Verify user access to chat
      if (!client.user) {
        client.emit('error', { message: 'User not authenticated' });
        return;
      }
      await this.chatService.getChatById(data.chatId, client.user.id);
      
      // Join chat room
      client.join(`chat:${data.chatId}`);
      client.emit('joined-chat', { chatId: data.chatId });
      
      if (client.user) {
        console.log(`User ${client.user.id} joined chat ${data.chatId}`);
      } else {
        console.log(`Unknown user joined chat ${data.chatId}`);
      }
    } catch (error) {
      client.emit('error', { message: 'Cannot join chat' });
    }
  }

  @UseGuards(WsJwtGuard)
  @SubscribeMessage('leave-chat')
  handleLeaveChat(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() data: { chatId: string },
  ) {
    client.leave(`chat:${data.chatId}`);
    client.emit('left-chat', { chatId: data.chatId });
  }

  @UseGuards(WsJwtGuard)
  @SubscribeMessage('send-message')
  async handleSendMessage(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() data: SendMessageDto,
  ) {
    try {
      if (!client.user) {
        client.emit('error', { message: 'User not authenticated' });
        return;
      }
      const message = await this.chatService.sendMessage(client.user.id, data);
      
      // Emit to chat room
      this.server.to(`chat:${data.chatId}`).emit('new-message', message);
      
      // Emit to other user's personal room for notifications
      const otherUserId = message.chat.buyerId === client.user.id 
        ? message.chat.sellerId 
        : message.chat.buyerId;
        
      this.server.to(`user:${otherUserId}`).emit('new-chat-notification', {
        chatId: data.chatId,
        message,
        productName: message.chat.product.name,
      });
      
    } catch (error) {
      client.emit('error', { message: error.message });
    }
  }

  @UseGuards(WsJwtGuard)
  @SubscribeMessage('mark-read')
  async handleMarkRead(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() data: { chatId: string },
  ) {
    try {
      if (!client.user) {
        client.emit('error', { message: 'User not authenticated' });
        return;
      }
      const result = await this.chatService.markMessagesAsRead(data.chatId, client.user.id);
      
      // Notify chat room about read status
      this.server.to(`chat:${data.chatId}`).emit('messages-read', {
        chatId: data.chatId,
        userId: client.user.id,
        markedCount: result.markedCount,
      });
      
    } catch (error) {
      client.emit('error', { message: error.message });
    }
  }

  @UseGuards(WsJwtGuard)
  @SubscribeMessage('typing')
  handleTyping(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() data: { chatId: string; isTyping: boolean },
  ) {
    // Broadcast typing status to other users in chat
    if (client.user) {
      client.to(`chat:${data.chatId}`).emit('user-typing', {
        userId: client.user.id,
        userName: client.user.name,
        isTyping: data.isTyping,
      });
    } else {
      client.emit('error', { message: 'User not authenticated' });
    }
  }
}