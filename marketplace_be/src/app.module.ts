// src/app.module.ts - UPDATED VERSION WITH BLOCKED USER MIDDLEWARE
import { Module, MiddlewareConsumer, RequestMethod } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { ProductsModule } from './products/products.module';
import { CategoriesModule } from './categories/categories.module';
import { CartModule } from './cart/cart.module';
import { OrdersModule } from './orders/orders.module';
import { PaymentsModule } from './payments/payments.module';
import { ReviewsModule } from './reviews/reviews.module';
import { AdminModule } from './admin/admin.module';
import { ChatModule } from './chat/chat.module';
import { RecommendationsModule } from './recommendations/recommendations.module';
import { NotificationsModule } from './notifications/notifications.module';
import { LoyaltyModule } from './loyalty/loyalty.module';
import { BlockedUserMiddleware } from './common/middleware/blocked-user.middleware';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    PrismaModule,
    AuthModule,
    UsersModule,
    ProductsModule,
    CategoriesModule,
    CartModule,
    OrdersModule,
    PaymentsModule,
    ReviewsModule,
    AdminModule,
    ChatModule,
    RecommendationsModule,
    NotificationsModule,
    LoyaltyModule,
  ],
})
export class AppModule {
  // ✅ Configure middleware to run on protected routes and block users
  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(BlockedUserMiddleware)
      .exclude(
        // Exclude public auth endpoints
        { path: 'auth/login', method: RequestMethod.POST },
        { path: 'auth/register', method: RequestMethod.POST },
        { path: 'auth/refresh', method: RequestMethod.POST },
        
        // Exclude public product/category endpoints
        { path: 'products', method: RequestMethod.GET },
        { path: 'products/(.*)', method: RequestMethod.GET },
        { path: 'categories', method: RequestMethod.GET },
        { path: 'categories/(.*)', method: RequestMethod.GET },
        
        // Exclude public recommendations (if any)
        { path: 'recommendations/public', method: RequestMethod.GET },
        { path: 'recommendations/trending', method: RequestMethod.GET },
        
        // Exclude health check or other public endpoints
        { path: 'health', method: RequestMethod.GET },
        { path: '', method: RequestMethod.GET }, // Root path
      )
      .forRoutes('*'); // Apply to all other routes
  }
}