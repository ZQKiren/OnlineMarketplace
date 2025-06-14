// src/chat/chat.controller.ts - FIXED VERSION
import {
  Controller,
  Get,
  Post,
  Put,
  Body,
  Param,
  Query,
  UseGuards,
  Request,
  ParseIntPipe,
  DefaultValuePipe,
  Logger,
  BadRequestException,
} from '@nestjs/common';
import { ChatService } from './chat.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CreateChatDto } from './dto/create-chat.dto';
import { SendMessageDto } from './dto/send-message.dto';

@Controller('chat')
@UseGuards(JwtAuthGuard) // ✅ Make sure this is applied
export class ChatController {
  private readonly logger = new Logger(ChatController.name);

  constructor(private readonly chatService: ChatService) {}

  @Post()
  async createChat(@Request() req, @Body() createChatDto: CreateChatDto) {
    // ✅ Add debugging and validation
    this.logger.log('CreateChat request received');
    this.logger.log('User from request:', req.user);
    this.logger.log('CreateChatDto:', createChatDto);

    if (!req.user || !req.user.id) {
      this.logger.error('User not found in request or user.id is undefined');
      throw new BadRequestException('User authentication failed');
    }

    try {
      return await this.chatService.createChat(req.user.id, createChatDto);
    } catch (error) {
      this.logger.error('Error in createChat:', error.message, error.stack);
      throw error;
    }
  }

  @Get()
  async getUserChats(
    @Request() req,
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(20), ParseIntPipe) limit: number,
  ) {
    if (!req.user || !req.user.id) {
      throw new BadRequestException('User authentication failed');
    }

    return this.chatService.getUserChats(req.user.id, page, limit);
  }

  @Get(':id')
  async getChatById(@Param('id') chatId: string, @Request() req) {
    if (!req.user || !req.user.id) {
      throw new BadRequestException('User authentication failed');
    }

    return this.chatService.getChatById(chatId, req.user.id);
  }

  @Get(':id/messages')
  async getChatMessages(
    @Param('id') chatId: string,
    @Request() req,
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(50), ParseIntPipe) limit: number,
  ) {
    if (!req.user || !req.user.id) {
      throw new BadRequestException('User authentication failed');
    }

    return this.chatService.getChatMessages(chatId, req.user.id, page, limit);
  }

  @Post('messages')
  async sendMessage(@Request() req, @Body() sendMessageDto: SendMessageDto) {
    if (!req.user || !req.user.id) {
      throw new BadRequestException('User authentication failed');
    }

    return this.chatService.sendMessage(req.user.id, sendMessageDto);
  }

  @Put(':id/read')
  async markMessagesAsRead(@Param('id') chatId: string, @Request() req) {
    if (!req.user || !req.user.id) {
      throw new BadRequestException('User authentication failed');
    }

    return this.chatService.markMessagesAsRead(chatId, req.user.id);
  }

  @Put(':id/archive')
  async archiveChat(@Param('id') chatId: string, @Request() req) {
    if (!req.user || !req.user.id) {
      throw new BadRequestException('User authentication failed');
    }

    return this.chatService.archiveChat(chatId, req.user.id);
  }
}
