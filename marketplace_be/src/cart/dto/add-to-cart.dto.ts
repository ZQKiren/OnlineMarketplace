// src/cart/dto/add-to-cart.dto.ts
import { IsUUID, IsNumber, Min } from 'class-validator';

export class AddToCartDto {
  @IsUUID()
  productId: string;

  @IsNumber()
  @Min(1)
  quantity: number;
}

