// src/payments/dto/create-payment.dto.ts
import { IsString, IsUUID } from 'class-validator';

export class CreatePaymentDto {
  @IsUUID()
  orderId: string;

  @IsString()
  paymentMethodId: string;
}

export class ConfirmPaymentDto {
  @IsString()
  paymentIntentId: string;
}