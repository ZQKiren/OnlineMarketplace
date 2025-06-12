// src/admin/dto/admin-stats.dto.ts
export interface AdminStatsDto {
  totalUsers: number;
  totalProducts: number;
  totalOrders: number;
  totalRevenue: number;
  recentOrders: any[];
  topProducts: any[];
  userGrowth: any[];
  revenueByMonth: any[];
}