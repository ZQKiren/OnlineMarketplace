// src/chat/dto/send-message.dto.ts
import { IsString, IsEnum, IsOptional, IsUUID } from 'class-validator';
import { MessageType } from '@prisma/client';

export class SendMessageDto {
  @IsString()
  @IsUUID()
  chatId: string;

  @IsString()
  content: string;

  @IsEnum(MessageType)
  @IsOptional()
  type?: MessageType = MessageType.TEXT;
}