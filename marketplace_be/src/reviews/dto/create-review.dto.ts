// src/reviews/dto/create-review.dto.ts
import { IsString, IsNumber, IsOptional, IsUUID, Min, Max } from 'class-validator';

export class CreateReviewDto {
  @IsUUID()
  productId: string;

  @IsNumber()
  @Min(1)
  @Max(5)
  rating: number;

  @IsOptional()
  @IsString()
  comment?: string;
}