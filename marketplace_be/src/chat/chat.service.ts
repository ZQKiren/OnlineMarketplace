// src/chat/chat.service.ts
import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateChatDto } from './dto/create-chat.dto';
import { SendMessageDto } from './dto/send-message.dto';
import { ChatStatus, MessageType } from '@prisma/client';

@Injectable()
export class ChatService {
  constructor(private prisma: PrismaService) {}

  async createChat(buyerId: string, createChatDto: CreateChatDto) {
    const { productId, sellerId } = createChatDto;

    // Check if product exists and seller is correct
    const product = await this.prisma.product.findFirst({
      where: {
        id: productId,
        sellerId: sellerId,
      },
    });

    if (!product) {
      throw new NotFoundException('Product not found or seller mismatch');
    }

    // Prevent seller from chatting with themselves
    if (buyerId === sellerId) {
      throw new ForbiddenException('Cannot create chat with yourself');
    }

    // Check if chat already exists
    const existingChat = await this.prisma.chat.findUnique({
      where: {
        productId_buyerId: {
          productId,
          buyerId,
        },
      },
      include: {
        product: { select: { id: true, name: true, images: true, price: true } },
        buyer: { select: { id: true, name: true, avatar: true } },
        seller: { select: { id: true, name: true, avatar: true } },
        _count: { select: { messages: true } },
      },
    });

    if (existingChat) {
      return existingChat;
    }

    // Create new chat
    const chat = await this.prisma.chat.create({
      data: {
        productId,
        buyerId,
        sellerId,
      },
      include: {
        product: { select: { id: true, name: true, images: true, price: true } },
        buyer: { select: { id: true, name: true, avatar: true } },
        seller: { select: { id: true, name: true, avatar: true } },
        _count: { select: { messages: true } },
      },
    });

    // Create welcome message
    await this.prisma.message.create({
      data: {
        chatId: chat.id,
        senderId: buyerId,
        content: `Hi! I'm interested in your product "${product.name}".`,
        type: MessageType.SYSTEM,
      },
    });

    return chat;
  }

  async getUserChats(userId: string, page = 1, limit = 20) {
    const skip = (page - 1) * limit;

    const chats = await this.prisma.chat.findMany({
      where: {
        OR: [
          { buyerId: userId },
          { sellerId: userId },
        ],
        status: ChatStatus.ACTIVE,
      },
      include: {
        product: { select: { id: true, name: true, images: true, price: true } },
        buyer: { select: { id: true, name: true, avatar: true, isOnline: true, lastSeen: true } },
        seller: { select: { id: true, name: true, avatar: true, isOnline: true, lastSeen: true } },
        messages: {
          orderBy: { createdAt: 'desc' },
          take: 1,
          select: {
            id: true,
            content: true,
            type: true,
            createdAt: true,
            senderId: true,
            isRead: true,
          },
        },
        _count: {
          select: {
            messages: {
              where: {
                isRead: false,
                senderId: { not: userId },
              },
            },
          },
        },
      },
      orderBy: {
        lastMessageAt: 'desc',
      },
      skip,
      take: limit,
    });

    const total = await this.prisma.chat.count({
      where: {
        OR: [
          { buyerId: userId },
          { sellerId: userId },
        ],
        status: ChatStatus.ACTIVE,
      },
    });

    return {
      chats: chats.map(chat => ({
        ...chat,
        lastMessage: chat.messages[0] || null,
        unreadCount: chat._count.messages,
        otherUser: chat.buyerId === userId ? chat.seller : chat.buyer,
      })),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async getChatById(chatId: string, userId: string) {
    const chat = await this.prisma.chat.findFirst({
      where: {
        id: chatId,
        OR: [
          { buyerId: userId },
          { sellerId: userId },
        ],
      },
      include: {
        product: { select: { id: true, name: true, images: true, price: true, sellerId: true } },
        buyer: { select: { id: true, name: true, avatar: true, isOnline: true, lastSeen: true } },
        seller: { select: { id: true, name: true, avatar: true, isOnline: true, lastSeen: true } },
      },
    });

    if (!chat) {
      throw new NotFoundException('Chat not found');
    }

    return {
      ...chat,
      otherUser: chat.buyerId === userId ? chat.seller : chat.buyer,
      isOwner: chat.product.sellerId === userId,
    };
  }

  async getChatMessages(chatId: string, userId: string, page = 1, limit = 50) {
    // Verify user access to chat
    const chat = await this.getChatById(chatId, userId);

    const skip = (page - 1) * limit;

    const messages = await this.prisma.message.findMany({
      where: { chatId },
      include: {
        sender: { select: { id: true, name: true, avatar: true } },
      },
      orderBy: { createdAt: 'desc' },
      skip,
      take: limit,
    });

    const total = await this.prisma.message.count({
      where: { chatId },
    });

    return {
      messages: messages.reverse(), // Reverse to get chronological order
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async sendMessage(userId: string, sendMessageDto: SendMessageDto) {
    const { chatId, content, type } = sendMessageDto;

    // Verify user access to chat
    const chat = await this.getChatById(chatId, userId);

    // Create message
    const message = await this.prisma.message.create({
      data: {
        chatId,
        senderId: userId,
        content: content.trim(),
        type: type || MessageType.TEXT,
      },
      include: {
        sender: { select: { id: true, name: true, avatar: true } },
        chat: {
          select: {
            buyerId: true,
            sellerId: true,
            product: { select: { name: true } },
          },
        },
      },
    });

    // Update chat's lastMessageAt
    await this.prisma.chat.update({
      where: { id: chatId },
      data: { lastMessageAt: new Date() },
    });

    return message;
  }

  async markMessagesAsRead(chatId: string, userId: string) {
    // Verify user access to chat
    await this.getChatById(chatId, userId);

    // Mark all unread messages from other users as read
    const result = await this.prisma.message.updateMany({
      where: {
        chatId,
        senderId: { not: userId },
        isRead: false,
      },
      data: { isRead: true },
    });

    return { markedCount: result.count };
  }

  async updateUserOnlineStatus(userId: string, isOnline: boolean) {
    return this.prisma.user.update({
      where: { id: userId },
      data: {
        isOnline,
        lastSeen: isOnline ? null : new Date(),
      },
    });
  }

  async archiveChat(chatId: string, userId: string) {
    // Verify user access to chat
    await this.getChatById(chatId, userId);

    return this.prisma.chat.update({
      where: { id: chatId },
      data: { status: ChatStatus.ARCHIVED },
    });
  }
}