// src/orders/dto/create-order.dto.ts
import { 
  IsArray, 
  ValidateNested, 
  IsOptional, 
  IsString, 
  IsNumber, 
  IsEnum,
  IsObject,
  Min 
} from 'class-validator';
import { Type } from 'class-transformer';

class OrderItemDto {
  @IsString()
  productId: string;

  @IsNumber()
  @Min(1)
  quantity: number;
}

class ShippingAddressDto {
  @IsString()
  fullName: string;

  @IsString()
  address: string;

  @IsString()
  city: string;

  @IsString()
  zipCode: string;

  @IsString()
  phone: string;
}

export class CreateOrderDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => OrderItemDto)
  items: OrderItemDto[];

  @IsOptional()
  @IsString()
  paymentMethodId?: string;

  @IsOptional()
  @IsEnum(['card', 'cod'])
  paymentMethod?: 'card' | 'cod';

  @IsOptional()
  @ValidateNested()
  @Type(() => ShippingAddressDto)
  shippingAddress?: ShippingAddressDto;
}