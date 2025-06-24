// src/loyalty/dto/award-bonus-points.dto.ts
import { IsString, IsNumber, Min, IsUUID } from 'class-validator';

export class AwardBonusPointsDto {
  @IsString()
  @IsUUID()
  userId: string;

  @IsNumber()
  @Min(1)
  points: number;

  @IsString()
  description: string;
}