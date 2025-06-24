// src/loyalty/dto/create-redemption.dto.ts - IMPROVED VERSION
import { 
  IsString, 
  IsNumber, 
  IsOptional, 
  IsBoolean, 
  IsDateString, 
  Min, 
  Max, 
  IsIn,
  Matches
} from 'class-validator';
import { Transform } from 'class-transformer';

export class CreateRedemptionDto {
  @IsString()
  title: string;

  @IsString()
  description: string;

  @IsNumber()
  @Min(1)
  pointsCost: number;

  @IsString()
  @IsIn(['PERCENTAGE', 'FIXED_AMOUNT', 'FREE_SHIPPING'])
  discountType: 'PERCENTAGE' | 'FIXED_AMOUNT' | 'FREE_SHIPPING';

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  discountValue?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  minOrderValue?: number;

  @IsOptional()
  @IsNumber()
  @Min(1)
  maxUses?: number;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @IsOptional()
  @IsString()
  // ✅ FIX: Accept both date (YYYY-MM-DD) and datetime (ISO string) formats
  @Matches(/^\d{4}-\d{2}-\d{2}(T\d{2}:\d{2}:\d{2}(\.\d{3})?Z?)?$/, {
    message: 'validFrom must be in YYYY-MM-DD or ISO datetime format'
  })
  validFrom?: string;

  @IsOptional()
  @IsString()
  // ✅ FIX: Accept both date (YYYY-MM-DD) and datetime (ISO string) formats
  @Matches(/^\d{4}-\d{2}-\d{2}(T\d{2}:\d{2}:\d{2}(\.\d{3})?Z?)?$/, {
    message: 'validUntil must be in YYYY-MM-DD or ISO datetime format'
  })
  validUntil?: string;
}