// src/products/dto/create-product.dto.ts
import { IsString, IsNumber, IsArray, IsUUID, Min, IsOptional } from 'class-validator';
import { Transform } from 'class-transformer';

export class CreateProductDto {
  @IsString()
  name: string;

  @IsString()
  description: string;

  @Transform(({ value }) => parseFloat(value))
  @IsNumber()
  @Min(0)
  price: number;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  images?: string[];

  @Transform(({ value }) => parseInt(value))
  @IsNumber()
  @Min(0)
  stock: number;

  @IsUUID()
  categoryId: string;
}