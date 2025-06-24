import { IsOptional, IsEnum, IsString, IsInt, Min } from 'class-validator';
import { Transform, Type } from 'class-transformer';
import { NotificationType } from '@prisma/client';

export class NotificationQueryDto {
  @IsOptional()
  @Type(() => Number)
  @Transform(({ value }) => {
    
    const parsed = parseInt(value);
    return isNaN(parsed) || parsed < 1 ? 1 : parsed;
  })
  @IsInt()
  @Min(1)
  page?: number = 1;

  @IsOptional()
  @Type(() => Number)
  @Transform(({ value }) => {
    
    const parsed = parseInt(value);
    return isNaN(parsed) || parsed < 1 ? 20 : Math.min(parsed, 100);
  })
  @IsInt()
  @Min(1)
  limit?: number = 20;

  @IsOptional()
  @IsEnum(NotificationType)
  @Transform(({ value }) => {
  
    if (value === '' || value === null || value === undefined) {
      return undefined;
    }
    return value;
  })
  type?: NotificationType;

  @IsOptional()
  @IsString()
  @Transform(({ value }) => {
    
    if (value === '' || value === null || value === undefined) {
      return undefined;
    }
    return typeof value === 'string' ? value.trim() : value;
  })
  search?: string;

  @IsOptional()
  @Transform(({ value }) => {
    if (value === 'true') return true;
    if (value === 'false') return false;
    return undefined;
  })
  unreadOnly?: boolean;
}