// src/recommendations/recommendations.controller.ts
import {
  Controller,
  Get,
  Post,
  Put,
  Body,
  Param,
  Query,
  UseGuards,
  Request,
  ParseIntPipe,
  BadRequestException,
} from '@nestjs/common';
import { RecommendationsService } from './recommendations.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { OptionalJwtAuthGuard } from '../auth/guards/optional-jwt-auth.guard';

@Controller('recommendations')
export class RecommendationsController {
  constructor(private readonly recommendationsService: RecommendationsService) {}

  // ✅ Track product view (can be called without auth for anonymous users)
  @Post('track-view')
  @UseGuards(OptionalJwtAuthGuard)
  async trackProductView(@Request() req, @Body() body: { productId: string }) {
    try {
      const { productId } = body;
      const userId = req.user?.id || null;
      const sessionId = req.headers['x-session-id'] || req.sessionID;

      if (!productId) {
        throw new BadRequestException('Product ID is required');
      }

      await this.recommendationsService.trackProductView(userId, productId, sessionId);

      return {
        success: true,
        message: 'Product view tracked successfully',
      };
    } catch (error) {
      throw error;
    }
  }

  // ✅ Get personalized recommendations
  @Get('personalized')
  @UseGuards(JwtAuthGuard)
  async getPersonalizedRecommendations(
    @Request() req,
    @Query('limit', new ParseIntPipe({ optional: true })) limit = 10,
  ) {
    try {
      const userId = req.user.id;
      const recommendations = await this.recommendationsService.getPersonalizedRecommendations(
        userId,
        limit,
      );

      return {
        success: true,
        data: recommendations,
        message: 'Personalized recommendations retrieved successfully',
      };
    } catch (error) {
      throw error;
    }
  }

  // ✅ Get similar products
  @Get('similar/:productId')
  async getSimilarProducts(
    @Param('productId') productId: string,
    @Query('limit', new ParseIntPipe({ optional: true })) limit = 6,
  ) {
    try {
      const similarProducts = await this.recommendationsService.getSimilarProducts(
        productId,
        limit,
      );

      return {
        success: true,
        data: similarProducts,
        message: 'Similar products retrieved successfully',
      };
    } catch (error) {
      throw error;
    }
  }

  // ✅ Get popular products
  @Get('popular')
  async getPopularProducts(@Query('limit', new ParseIntPipe({ optional: true })) limit = 10) {
    try {
      const popularProducts = await this.recommendationsService.getPopularProducts(limit);

      return {
        success: true,
        data: popularProducts,
        message: 'Popular products retrieved successfully',
      };
    } catch (error) {
      throw error;
    }
  }

  // ✅ Get trending products
  @Get('trending')
  async getTrendingProducts(@Query('limit', new ParseIntPipe({ optional: true })) limit = 8) {
    try {
      const trendingProducts = await this.recommendationsService.getTrendingProducts(limit);

      return {
        success: true,
        data: trendingProducts,
        message: 'Trending products retrieved successfully',
      };
    } catch (error) {
      throw error;
    }
  }

  // ✅ Get user preferences (for profile/settings)
  @Get('preferences')
  @UseGuards(JwtAuthGuard)
  async getUserPreferences(@Request() req) {
    try {
      const userId = req.user.id;
      const preferences = await this.recommendationsService.getUserPreferences(userId);

      return {
        success: true,
        data: preferences,
        message: 'User preferences retrieved successfully',
      };
    } catch (error) {
      throw error;
    }
  }

  // ✅ Update user preferences manually
  @Put('preferences')
  @UseGuards(JwtAuthGuard)
  async updateUserPreference(
    @Request() req,
    @Body() body: { categoryId: string; score: number },
  ) {
    try {
      const userId = req.user.id;
      const { categoryId, score } = body;

      if (!categoryId || score === undefined) {
        throw new BadRequestException('Category ID and score are required');
      }

      if (score < 0 || score > 5) {
        throw new BadRequestException('Score must be between 0 and 5');
      }

      const preference = await this.recommendationsService.updateUserPreference(
        userId,
        categoryId,
        score,
      );

      return {
        success: true,
        data: preference,
        message: 'User preference updated successfully',
      };
    } catch (error) {
      throw error;
    }
  }
}

