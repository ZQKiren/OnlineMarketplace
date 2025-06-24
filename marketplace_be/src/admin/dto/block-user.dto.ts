// src/admin/dto/block-user.dto.ts - NEW FILE
import { IsString, IsOptional, MaxLength } from 'class-validator';

export class BlockUserDto {
  @IsOptional()
  @IsString()
  @MaxLength(500, { message: 'Reason must not exceed 500 characters' })
  reason?: string;
}

export class UnblockUserDto {
  @IsOptional()
  @IsString()
  @MaxLength(500, { message: 'Note must not exceed 500 characters' })
  note?: string;
}