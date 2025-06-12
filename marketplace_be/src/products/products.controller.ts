import { 
  Controller, 
  Get, 
  Post, 
  Body, 
  Patch, 
  Param, 
  Delete,
  UseGuards,
  Query,
  UseInterceptors,
  UploadedFiles,
  ParseFilePipe,
  FileTypeValidator,
  MaxFileSizeValidator,
} from '@nestjs/common';
import { FilesInterceptor } from '@nestjs/platform-express';
import { ProductsService } from './products.service';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { FilterProductDto } from './dto/filter-product.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Role } from '@prisma/client';
import { v2 as cloudinary } from 'cloudinary';
import * as dotenv from 'dotenv';

dotenv.config();

@Controller('products')
export class ProductsController {
  constructor(private readonly productsService: ProductsService) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(FilesInterceptor('images', 10))
  async create(
    @CurrentUser() user: any,
    @Body() createProductDto: CreateProductDto,
    @UploadedFiles(
      new ParseFilePipe({
        validators: [
          new MaxFileSizeValidator({ maxSize: 5 * 1024 * 1024 }), // 5MB per file
          new FileTypeValidator({ fileType: /^image\/(jpeg|jpg|png|gif|webp)$/ }),
        ],
        fileIsRequired: false,
      }),
    )
    files?: Express.Multer.File[],
  ) {
    let imageUrls: string[] = [];
    
    if ((files?.length ?? 0) > 0) {
      // 🌩️ Upload to Cloudinary
      console.log('📤 Uploading to Cloudinary...');
      
      const uploadPromises = (files ?? []).map(file => {
        return new Promise<string>((resolve, reject) => {
          // Generate filename for Cloudinary: product + 8 random digits
          const random8digits = Math.floor(Math.random() * 100000000).toString().padStart(8, '0');
          const publicId = `product_${random8digits}`;
          
          cloudinary.uploader.upload_stream(
            { 
              resource_type: 'image',
              public_id: publicId,
              folder: 'marketplace'
            },
            (error, result) => {
              if (error) {
                console.error('❌ Cloudinary error:', error);
                reject(error);
              } else {
                console.log('✅ Uploaded to Cloudinary:', result!.secure_url);
                resolve(result!.secure_url);
              }
            }
          ).end(file.buffer);
        });
      });
      
      imageUrls = await Promise.all(uploadPromises);
    }

    // Remove images field from DTO conflict
    const { images, ...productData } = createProductDto;

    return this.productsService.create(
      { ...productData, images: imageUrls },
      user.id,
    );
  }

  @Get()
  findAll(@Query() filterDto: FilterProductDto) {
    return this.productsService.findAll(filterDto);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.productsService.findOne(id);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard)
  update(
    @Param('id') id: string,
    @CurrentUser() user: any,
    @Body() updateProductDto: UpdateProductDto,
  ) {
    return this.productsService.update(
      id,
      updateProductDto,
      user.id,
      user.role === Role.ADMIN,
    );
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  remove(
    @Param('id') id: string,
    @CurrentUser() user: any,
  ) {
    return this.productsService.remove(
      id,
      user.id,
      user.role === Role.ADMIN,
    );
  }
}