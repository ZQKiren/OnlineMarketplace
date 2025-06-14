// src/chat/dto/create-chat.dto.ts
import { IsString, IsUUID } from 'class-validator';

export class CreateChatDto {
  @IsString()
  @IsUUID()
  productId: string;

  @IsString()
  @IsUUID()
  sellerId: string;
}