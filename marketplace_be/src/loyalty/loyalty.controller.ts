// src/loyalty/loyalty.controller.ts - FIX DUPLICATE PREFIX
import {
  Controller,
  Get,
  Post,
  Body,
  Query,
  UseGuards,
  Param,
  BadRequestException,
} from '@nestjs/common';
import { LoyaltyService } from './loyalty.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { CreateRedemptionDto } from './dto/create-redemption.dto';
import { RedeemPointsDto } from './dto/redeem-points.dto';
import { AwardBonusPointsDto } from './dto/award-bonus-points.dto';
import { Role } from '@prisma/client';

// ✅ FIX: Remove ALL prefixes since main.ts already sets globalPrefix to 'api/v1'
@Controller('loyalty') // Changed from any path with api/v1
@UseGuards(JwtAuthGuard)
export class LoyaltyController {
  constructor(private readonly loyaltyService: LoyaltyService) {}

  // ============= USER ENDPOINTS =============

  @Get('summary')
  async getUserLoyaltySummary(@CurrentUser() user: any) {
    return this.loyaltyService.getUserLoyaltySummary(user.id);
  }

  @Get('transactions')
  async getUserTransactionHistory(
    @CurrentUser() user: any,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    const pageNum = page ? parseInt(page, 10) : 1;
    const limitNum = limit ? parseInt(limit, 10) : 20;

    if (pageNum < 1 || limitNum < 1 || limitNum > 100) {
      throw new BadRequestException('Invalid pagination parameters');
    }

    return this.loyaltyService.getUserTransactionHistory(user.id, pageNum, limitNum);
  }

  @Get('redemptions')
  async getRedemptions() {
    return this.loyaltyService.getRedemptions(true);
  }

  @Post('redeem')
  async redeemPoints(
    @CurrentUser() user: any,
    @Body() redeemPointsDto: RedeemPointsDto,
  ) {
    return this.loyaltyService.redeemPoints(user.id, redeemPointsDto);
  }

  @Get('calculate-points')
  async calculatePoints(@Query('amount') amount: string) {
    const orderAmount = parseFloat(amount);
    
    if (isNaN(orderAmount) || orderAmount < 0) {
      throw new BadRequestException('Invalid order amount');
    }

    const points = this.loyaltyService.calculatePointsFromOrder(orderAmount);
    return { orderAmount, pointsToEarn: points };
  }

  // ============= ADMIN ENDPOINTS =============

  @Get('analytics')
  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN)
  async getLoyaltyAnalytics() {
    return this.loyaltyService.getLoyaltyAnalytics();
  }

  @Get('admin/redemptions')
  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN)
  async getAllRedemptions() {
    return this.loyaltyService.getRedemptions(false);
  }

  @Post('admin/redemptions')
  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN)
  async createRedemption(@Body() createRedemptionDto: CreateRedemptionDto) {
    return this.loyaltyService.createRedemption(createRedemptionDto);
  }

  @Post('admin/award-bonus')
  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN)
  async awardBonusPoints(@Body() awardBonusPointsDto: AwardBonusPointsDto) {
    const { userId, points, description } = awardBonusPointsDto;
    return this.loyaltyService.awardBonusPoints(userId, points, description);
  }

  @Post('admin/cleanup-expired')
  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN)
  async cleanupExpiredPoints() {
    const expiredCount = await this.loyaltyService.cleanupExpiredPoints();
    return { message: `Cleaned up ${expiredCount} expired point transactions` };
  }

  @Post('admin/welcome-bonus/:userId')
  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN)
  async awardWelcomeBonus(@Param('userId') userId: string) {
    const transaction = await this.loyaltyService.awardWelcomeBonus(userId);
    return transaction || { message: 'Welcome bonus already awarded to this user' };
  }

  @Post('admin/review-bonus')
  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN)
  async awardReviewBonus(
    @Body() body: { userId: string; productId: string }
  ) {
    const { userId, productId } = body;
    const transaction = await this.loyaltyService.awardReviewPoints(userId, productId);
    return transaction || { message: 'Review bonus already awarded for this product' };
  }
}
