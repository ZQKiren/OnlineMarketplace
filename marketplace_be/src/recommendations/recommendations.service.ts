// src/recommendations/recommendations.service.ts
import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class RecommendationsService {
  constructor(private prisma: PrismaService) {}

  // ✅ Track product view
  async trackProductView(userId: string | null, productId: string, sessionId?: string) {
    try {
      // Record product view
      await this.prisma.productView.create({
        data: {
          userId,
          productId,
          sessionId,
        },
      });

      // Update user preferences if user is logged in
      if (userId) {
        await this.updateUserPreferences(userId, productId);
      }

      console.log('✅ Product view tracked');
    } catch (error) {
      console.error('❌ Error tracking product view:', error);
      throw error;
    }
  }

  // ✅ Update user preferences based on viewed product
  private async updateUserPreferences(userId: string, productId: string) {
    try {
      // Get product category
      const product = await this.prisma.product.findUnique({
        where: { id: productId },
        include: { category: true },
      });

      if (!product) return;

      // Update or create user preference for this category
      await this.prisma.userPreference.upsert({
        where: {
          userId_categoryId: {
            userId,
            categoryId: product.categoryId,
          },
        },
        update: {
          score: { increment: 0.1 }, // Increase preference score
        },
        create: {
          userId,
          categoryId: product.categoryId,
          score: 1.0,
        },
      });

      console.log('✅ User preferences updated');
    } catch (error) {
      console.error('❌ Error updating preferences:', error);
    }
  }

  // ✅ Get personalized recommendations
  async getPersonalizedRecommendations(userId: string, limit = 10) {
    try {
      if (!userId) {
        return await this.getPopularProducts(limit);
      }

      // Get user's preferences
      const preferences = await this.prisma.userPreference.findMany({
        where: { userId },
        orderBy: { score: 'desc' },
        take: 5,
        include: { category: true },
      });

      if (preferences.length === 0) {
        return await this.getPopularProducts(limit);
      }

      // Get user's order history for exclusion
      const userOrders = await this.prisma.orderItem.findMany({
        where: {
          order: { userId },
        },
        select: { productId: true },
      });

      const purchasedProductIds = userOrders.map((item) => item.productId);

      // Get recommended products based on preferences
      const categoryIds = preferences.map((p) => p.categoryId);

      const recommendations = await this.prisma.product.findMany({
        where: {
          categoryId: { in: categoryIds },
          id: { notIn: purchasedProductIds }, // Exclude already purchased
          stock: { gt: 0 }, // Only products in stock
        },
        include: {
          category: {
            select: { id: true, name: true },
          },
          seller: {
            select: { id: true, name: true, avatar: true },
          },
          reviews: {
            select: { rating: true },
          },
          _count: {
            select: {
              reviews: true,
              views: true,
            },
          },
        },
        take: limit,
        orderBy: [
          { views: { _count: 'desc' } }, // Popular products first
          { reviews: { _count: 'desc' } },
          { createdAt: 'desc' },
        ],
      });

      // Calculate average rating for each product
      const recommendationsWithRating = recommendations.map((product) => ({
        ...product,
        avgRating:
          product.reviews.length > 0
            ? product.reviews.reduce((sum, review) => sum + review.rating, 0) /
              product.reviews.length
            : 0,
        reviewCount: product._count.reviews,
        viewCount: product._count.views,
      }));

      console.log('✅ Personalized recommendations generated');
      return recommendationsWithRating;
    } catch (error) {
      console.error('❌ Error getting personalized recommendations:', error);
      return await this.getPopularProducts(limit);
    }
  }

  // ✅ Get similar products (same category)
  async getSimilarProducts(productId: string, limit = 6) {
    try {
      const product = await this.prisma.product.findUnique({
        where: { id: productId },
        include: { category: true },
      });

      if (!product) return [];

      // Find products in same category
      const similarProducts = await this.prisma.product.findMany({
        where: {
          categoryId: product.categoryId,
          id: { not: productId },
          stock: { gt: 0 },
        },
        include: {
          category: {
            select: { id: true, name: true },
          },
          seller: {
            select: { id: true, name: true, avatar: true },
          },
          reviews: {
            select: { rating: true },
          },
          _count: {
            select: { reviews: true, views: true },
          },
        },
        take: limit,
        orderBy: [
          { reviews: { _count: 'desc' } },
          { views: { _count: 'desc' } },
          { createdAt: 'desc' },
        ],
      });

      // Calculate average rating
      const productsWithRating = similarProducts.map((product) => ({
        ...product,
        avgRating:
          product.reviews.length > 0
            ? product.reviews.reduce((sum, review) => sum + review.rating, 0) /
              product.reviews.length
            : 0,
        reviewCount: product._count.reviews,
        viewCount: product._count.views,
      }));

      console.log('✅ Similar products found');
      return productsWithRating;
    } catch (error) {
      console.error('❌ Error getting similar products:', error);
      return [];
    }
  }

  // ✅ Get popular products (fallback)
  async getPopularProducts(limit = 10) {
    try {
      const popularProducts = await this.prisma.product.findMany({
        where: { stock: { gt: 0 } },
        include: {
          category: {
            select: { id: true, name: true },
          },
          seller: {
            select: { id: true, name: true, avatar: true },
          },
          reviews: {
            select: { rating: true },
          },
          _count: {
            select: { reviews: true, views: true },
          },
        },
        take: limit,
        orderBy: [
          { views: { _count: 'desc' } },
          { reviews: { _count: 'desc' } },
          { createdAt: 'desc' },
        ],
      });

      const productsWithRating = popularProducts.map((product) => ({
        ...product,
        avgRating:
          product.reviews.length > 0
            ? product.reviews.reduce((sum, review) => sum + review.rating, 0) /
              product.reviews.length
            : 0,
        reviewCount: product._count.reviews,
        viewCount: product._count.views,
      }));

      return productsWithRating;
    } catch (error) {
      console.error('❌ Error getting popular products:', error);
      return [];
    }
  }

  // ✅ Get trending products (based on recent views)
  async getTrendingProducts(limit = 8) {
    try {
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

      const trendingProducts = await this.prisma.product.findMany({
        where: {
          stock: { gt: 0 },
          views: {
            some: {
              viewedAt: { gte: sevenDaysAgo },
            },
          },
        },
        include: {
          category: {
            select: { id: true, name: true },
          },
          seller: {
            select: { id: true, name: true, avatar: true },
          },
          reviews: {
            select: { rating: true },
          },
          _count: {
            select: {
              reviews: true,
              views: {
                where: {
                  viewedAt: { gte: sevenDaysAgo },
                },
              },
            },
          },
        },
        take: limit,
        orderBy: {
          views: { _count: 'desc' },
        },
      });

      const productsWithRating = trendingProducts.map((product) => ({
        ...product,
        avgRating:
          product.reviews.length > 0
            ? product.reviews.reduce((sum, review) => sum + review.rating, 0) /
              product.reviews.length
            : 0,
        reviewCount: product._count.reviews,
        recentViews: product._count.views,
      }));

      return productsWithRating;
    } catch (error) {
      console.error('❌ Error getting trending products:', error);
      return [];
    }
  }

  // ✅ Get user preferences
  async getUserPreferences(userId: string) {
    try {
      return await this.prisma.userPreference.findMany({
        where: { userId },
        include: {
          category: {
            select: { id: true, name: true },
          },
        },
        orderBy: { score: 'desc' },
      });
    } catch (error) {
      console.error('❌ Error getting user preferences:', error);
      return [];
    }
  }

  // ✅ Update user preference manually
  async updateUserPreference(userId: string, categoryId: string, score: number) {
    try {
      if (score < 0 || score > 5) {
        throw new Error('Score must be between 0 and 5');
      }

      const preference = await this.prisma.userPreference.upsert({
        where: {
          userId_categoryId: {
            userId,
            categoryId,
          },
        },
        update: { score },
        create: {
          userId,
          categoryId,
          score,
        },
        include: {
          category: {
            select: { id: true, name: true },
          },
        },
      });

      return preference;
    } catch (error) {
      console.error('❌ Error updating user preference:', error);
      throw error;
    }
  }
}