// src/loyalty/dto/redeem-points.dto.ts
import { IsString, IsNumber, Min } from 'class-validator';

export class RedeemPointsDto {
  @IsString()
  redemptionId: string;

  @IsNumber()
  @Min(0)
  orderValue: number;
}