<template>
  <div class="admin-dashboard">
    <!-- Dashboard Header -->
    <div class="dashboard-header">
      <div class="header-content">
        <h2>Admin Dashboard</h2>
        <p class="header-subtitle">Tổng quan hệ thống và quản lý</p>
      </div>
      <div class="header-actions">
        <div class="date-filter">
          <select v-model="dateRange" @change="fetchDashboardData" class="date-select">
            <option value="7d">7 ngày qua</option>
            <option value="30d">30 ngày qua</option>
            <option value="90d">3 tháng qua</option>
            <option value="1y">1 năm qua</option>
          </select>
        </div>
      </div>
    </div>

    <div v-if="loading && !stats.totalUsers" class="loading-container">
      <div class="loading-spinner">
        <div class="spinner"></div>
        <p>Đang tải dữ liệu dashboard...</p>
      </div>
    </div>

    <div v-else class="dashboard-content">
      <!-- Main Stats Grid -->
      <div class="stats-section">
        <h3 class="section-title">Thống Kê Tổng Quan</h3>
        <div class="stats-grid">
          <div class="stat-card users" @click="navigateTo('/admin/users')">
            <div class="stat-header">
              <div class="stat-icon">
                <Users />
              </div>
              <div class="stat-trend" :class="getTrendClass(12)">
                <TrendingUp />
                <span>+12%</span>
              </div>
            </div>
            <div class="stat-content">
              <div class="stat-number">{{ formatNumber(stats.totalUsers) }}</div>
              <div class="stat-label">Tổng Người Dùng</div>
              <div class="stat-meta">{{ stats.newUsersThisMonth || 0 }} mới tháng này</div>
            </div>
          </div>

          <div class="stat-card products" @click="navigateTo('/admin/products')">
            <div class="stat-header">
              <div class="stat-icon">
                <Package />
              </div>
              <div class="stat-trend" :class="getTrendClass(8)">
                <TrendingUp />
                <span>+8%</span>
              </div>
            </div>
            <div class="stat-content">
              <div class="stat-number">{{ formatNumber(stats.totalProducts) }}</div>
              <div class="stat-label">Tổng Sản Phẩm</div>
              <div class="stat-meta">{{ stats.activeProducts || 0 }} đang hoạt động</div>
            </div>
          </div>

          <div class="stat-card orders" @click="navigateTo('/admin/orders')">
            <div class="stat-header">
              <div class="stat-icon">
                <ShoppingCart />
              </div>
              <div class="stat-trend" :class="getTrendClass(5)">
                <TrendingUp />
                <span>+5%</span>
              </div>
            </div>
            <div class="stat-content">
              <div class="stat-number">{{ formatNumber(stats.totalOrders) }}</div>
              <div class="stat-label">Tổng Đơn Hàng</div>
              <div class="stat-meta">{{ stats.pendingOrders || 0 }} chờ xử lý</div>
            </div>
          </div>

          <div class="stat-card revenue">
            <div class="stat-header">
              <div class="stat-icon">
                <DollarSign />
              </div>
              <div class="stat-trend" :class="getTrendClass(15)">
                <TrendingUp />
                <span>+15%</span>
              </div>
            </div>
            <div class="stat-content">
              <div class="stat-number">${{ formatNumber(stats.totalRevenue, 2) }}</div>
              <div class="stat-label">Tổng Doanh Thu</div>
              <div class="stat-meta">${{ formatNumber(stats.monthlyRevenue || 0, 2) }} tháng này</div>
            </div>
          </div>
        </div>
      </div>

      <!-- Main Content Grid -->
      <div class="main-content">
        <!-- Left Column -->
        <div class="left-column">
          <!-- Notification Management -->
          <div class="section-card notification-section">
            <div class="section-header">
              <div class="section-title">
                <Bell class="section-icon" />
                <div>
                  <h4>Quản Lý Thông Báo</h4>
                  <p>Gửi và theo dõi thông báo hệ thống</p>
                </div>
              </div>
              <router-link to="/admin/notifications" class="view-all-btn">
                Xem tất cả
                <ChevronRight />
              </router-link>
            </div>

            <!-- Notification Stats -->
            <div class="notification-stats">
              <div class="mini-stat-card">
                <div class="mini-stat-icon total">
                  <Bell />
                </div>
                <div class="mini-stat-content">
                  <div class="mini-stat-number">{{ notificationStats.total }}</div>
                  <div class="mini-stat-label">Tổng số</div>
                </div>
              </div>

              <div class="mini-stat-card">
                <div class="mini-stat-icon success">
                  <CheckCircle />
                </div>
                <div class="mini-stat-content">
                  <div class="mini-stat-number">{{ notificationStats.delivered }}</div>
                  <div class="mini-stat-label">Đã gửi</div>
                </div>
              </div>

              <div class="mini-stat-card">
                <div class="mini-stat-icon warning">
                  <Clock />
                </div>
                <div class="mini-stat-content">
                  <div class="mini-stat-number">{{ notificationStats.pending }}</div>
                  <div class="mini-stat-label">Chờ gửi</div>
                </div>
              </div>

              <div class="mini-stat-card">
                <div class="mini-stat-icon info">
                  <Globe />
                </div>
                <div class="mini-stat-content">
                  <div class="mini-stat-number">{{ notificationStats.global }}</div>
                  <div class="mini-stat-label">Toàn cục</div>
                </div>
              </div>
            </div>

            <!-- Quick Actions -->
            <div class="quick-actions">
              <button @click="sendTestNotification" class="action-btn primary">
                <Send />
                Gửi thử
              </button>
              <router-link to="/admin/notifications/create" class="action-btn success">
                <BellPlus />
                Tạo mới
              </router-link>
              <button @click="viewNotificationAnalytics" class="action-btn info">
                <BarChart3 />
                Phân tích
              </button>
            </div>
          </div>

          <!-- Recent Orders -->
          <div class="section-card">
            <div class="section-header">
              <div class="section-title">
                <Receipt class="section-icon" />
                <div>
                  <h4>Đơn Hàng Gần Đây</h4>
                  <p>Theo dõi đơn hàng mới nhất</p>
                </div>
              </div>
              <router-link to="/admin/orders" class="view-all-btn">
                Xem tất cả
                <ChevronRight />
              </router-link>
            </div>

            <div class="orders-container">
              <div v-if="!stats.recentOrders?.length" class="empty-state">
                <ShoppingCart class="empty-icon" />
                <p>Chưa có đơn hàng nào</p>
              </div>
              
              <div v-else class="orders-list">
                <div v-for="order in stats.recentOrders.slice(0, 5)" :key="order.id" class="order-item">
                  <div class="order-info">
                    <div class="order-id">#{{ order.id.slice(-8) }}</div>
                    <div class="customer-name">{{ order.user?.name || 'N/A' }}</div>
                    <div class="order-date">{{ formatTime(order.createdAt) }}</div>
                  </div>
                  <div class="order-details">
                    <div class="order-amount">${{ order.totalAmount?.toFixed(2) || '0.00' }}</div>
                    <div class="order-status" :class="order.status?.toLowerCase()">
                      {{ formatStatus(order.status) }}
                    </div>
                  </div>
                  <div class="order-actions">
                    <router-link :to="`/admin/orders/${order.id}`" class="view-btn">
                      <Eye />
                    </router-link>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Right Column -->
        <div class="right-column">
          <!-- Revenue Chart -->
          <div class="section-card chart-section">
            <div class="section-header">
              <div class="section-title">
                <TrendingUp class="section-icon" />
                <div>
                  <h4>Xu Hướng Doanh Thu</h4>
                  <p>Biểu đồ doanh thu theo thời gian</p>
                </div>
              </div>
              <div class="chart-controls">
                <select v-model="chartPeriod" @change="updateChart" class="chart-select">
                  <option value="week">7 ngày</option>
                  <option value="month">30 ngày</option>
                  <option value="quarter">3 tháng</option>
                  <option value="year">1 năm</option>
                </select>
              </div>
            </div>

            <div class="chart-container">
              <canvas ref="revenueChart"></canvas>
            </div>

            <div class="chart-summary">
              <div class="summary-item">
                <span class="summary-label">Tăng trưởng</span>
                <span class="summary-value positive">+15.3%</span>
              </div>
              <div class="summary-item">
                <span class="summary-label">Trung bình</span>
                <span class="summary-value">${{ calculateAverageRevenue() }}</span>
              </div>
              <div class="summary-item">
                <span class="summary-label">Cao nhất</span>
                <span class="summary-value">${{ getMaxRevenue() }}</span>
              </div>
            </div>
          </div>

          <!-- Recent Notifications -->
          <div class="section-card">
            <div class="section-header">
              <div class="section-title">
                <History class="section-icon" />
                <div>
                  <h4>Thông Báo Gần Đây</h4>
                  <p>Lịch sử thông báo đã gửi</p>
                </div>
              </div>
              <router-link to="/admin/notifications" class="view-all-btn">
                Xem tất cả
                <ChevronRight />
              </router-link>
            </div>

            <div class="notifications-container">
              <div v-if="!recentNotifications.length" class="empty-state">
                <BellOff class="empty-icon" />
                <p>Chưa có thông báo nào</p>
              </div>

              <div v-else class="notifications-list">
                <div v-for="notification in recentNotifications.slice(0, 4)" :key="notification.id" class="notification-item">
                  <div class="notification-icon" :class="getNotificationIconClass(notification.type)">
                    <component :is="getNotificationIcon(notification.type)" />
                  </div>
                  <div class="notification-content">
                    <div class="notification-title">{{ notification.title }}</div>
                    <div class="notification-message">{{ truncateText(notification.message, 60) }}</div>
                    <div class="notification-meta">
                      <span class="notification-time">{{ formatTime(notification.createdAt) }}</span>
                      <span class="notification-type">{{ getTypeLabel(notification.type) }}</span>
                    </div>
                  </div>
                  <div class="notification-status">
                    <div class="status-indicator" :class="notification.isActive ? 'active' : 'inactive'"></div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Bottom Section -->
      <div class="bottom-section">
        <!-- Top Products -->
        <div class="section-card">
          <div class="section-header">
            <div class="section-title">
              <Star class="section-icon" />
              <div>
                <h4>Sản Phẩm Bán Chạy</h4>
                <p>Top sản phẩm có doanh thu cao nhất</p>
              </div>
            </div>
            <router-link to="/admin/products" class="view-all-btn">
              Xem tất cả
              <ChevronRight />
            </router-link>
          </div>

          <div class="products-grid">
            <div v-if="!stats.topProducts?.length" class="empty-state">
              <Package class="empty-icon" />
              <p>Chưa có dữ liệu sản phẩm</p>
            </div>
            
            <div v-else class="products-list">
              <div v-for="(product, index) in stats.topProducts.slice(0, 5)" :key="product.id" class="product-item">
                <div class="product-rank">{{ index + 1 }}</div>
                <div class="product-image">
                  <img :src="product.images?.[0] || '/placeholder.jpg'" :alt="product.name" @error="handleImageError">
                </div>
                <div class="product-info">
                  <div class="product-name">{{ product.name }}</div>
                  <div class="product-stats">
                    <span class="product-sold">{{ product.totalSold || 0 }} đã bán</span>
                    <span class="product-rating">
                      <Star class="star-icon" />
                      {{ product.avgRating || 0 }}
                    </span>
                  </div>
                </div>
                <div class="product-revenue">
                  <div class="revenue-amount">${{ ((product.price || 0) * (product.totalSold || 0)).toFixed(2) }}</div>
                  <div class="revenue-growth">+12%</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Quick Management -->
        <div class="section-card">
          <div class="section-header">
            <div class="section-title">
              <LayoutDashboard class="section-icon" />
              <div>
                <h4>Quản Lý Nhanh</h4>
                <p>Truy cập nhanh các chức năng chính</p>
              </div>
            </div>
          </div>

          <div class="management-grid">
            <router-link to="/admin/products" class="management-card">
              <div class="management-icon products">
                <Package2 />
              </div>
              <div class="management-content">
                <div class="management-title">Sản Phẩm</div>
                <div class="management-count">{{ stats.totalProducts || 0 }}</div>
              </div>
              <ChevronRight class="management-arrow" />
            </router-link>

            <router-link to="/admin/orders" class="management-card">
              <div class="management-icon orders">
                <Receipt />
              </div>
              <div class="management-content">
                <div class="management-title">Đơn Hàng</div>
                <div class="management-count">{{ stats.totalOrders || 0 }}</div>
              </div>
              <ChevronRight class="management-arrow" />
            </router-link>

            <router-link to="/admin/users" class="management-card">
              <div class="management-icon users">
                <Users />
              </div>
              <div class="management-content">
                <div class="management-title">Người Dùng</div>
                <div class="management-count">{{ stats.totalUsers || 0 }}</div>
              </div>
              <ChevronRight class="management-arrow" />
            </router-link>

            <router-link to="/admin/categories" class="management-card">
              <div class="management-icon categories">
                <Grid3X3 />
              </div>
              <div class="management-content">
                <div class="management-title">Danh Mục</div>
                <div class="management-count">{{ stats.totalCategories || 0 }}</div>
              </div>
              <ChevronRight class="management-arrow" />
            </router-link>

            <router-link to="/admin/notifications" class="management-card">
              <div class="management-icon notifications">
                <Bell />
              </div>
              <div class="management-content">
                <div class="management-title">Thông Báo</div>
                <div class="management-count">{{ notificationStats.total || 0 }}</div>
              </div>
              <ChevronRight class="management-arrow" />
            </router-link>

            <router-link to="/admin/analytics" class="management-card">
              <div class="management-icon analytics">
                <BarChart3 />
              </div>
              <div class="management-content">
                <div class="management-title">Phân Tích</div>
                <div class="management-count">Reports</div>
              </div>
              <ChevronRight class="management-arrow" />
            </router-link>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, nextTick } from 'vue'
import { useRouter } from 'vue-router'
import { Chart } from 'chart.js/auto'
import { useToast } from 'vue-toastification'
import adminService from '@/services/admin.service'
import { notificationService } from '@/services/notification.service'
import { formatDate, formatStatus } from '@/utils/formatters'
import dayjs from 'dayjs'
import relativeTime from 'dayjs/plugin/relativeTime'
import 'dayjs/locale/vi'

// Lucide Icons
import {
  RefreshCw, Users, Package, ShoppingCart, DollarSign, TrendingUp, TrendingDown,
  Bell, BellOff, BellPlus, CheckCircle, Clock, Globe, Send, Settings, BarChart3,
  History, Receipt, Star, LayoutDashboard, Package2, Grid3X3, Eye, ChevronRight,
  Sparkles, ShoppingBag, Tag, MessageSquare, AlertTriangle
} from 'lucide-vue-next'

dayjs.extend(relativeTime)
dayjs.locale('vi')

const router = useRouter()
const toast = useToast()

const loading = ref(false)
const dateRange = ref('30d')
const chartPeriod = ref('month')

const stats = ref({
  totalUsers: 0,
  totalProducts: 0,
  totalOrders: 0,
  totalRevenue: 0,
  totalCategories: 0,
  newUsersThisMonth: 0,
  activeProducts: 0,
  pendingOrders: 0,
  monthlyRevenue: 0,
  recentOrders: [],
  topProducts: [],
  revenueByMonth: []
})

const notificationStats = ref({
  total: 0,
  delivered: 0,
  pending: 0,
  global: 0
})

const recentNotifications = ref([])
const revenueChart = ref(null)
let chartInstance = null

// Methods
const fetchDashboardData = async () => {
  loading.value = true
  try {
    const response = await adminService.getDashboardStats({
      period: dateRange.value
    })
    stats.value = { ...stats.value, ...response.data }
    
    await nextTick()
    createRevenueChart()
  } catch (error) {
    console.error('Error fetching dashboard data:', error)
    toast.error('Không thể tải dữ liệu dashboard')
  } finally {
    loading.value = false
  }
}

const fetchNotificationData = async () => {
  try {
    const response = await notificationService.getAllNotifications({
      limit: 10,
      page: 1
    })
    recentNotifications.value = response.data || []
    
    notificationStats.value = {
      total: response.meta?.total || 0,
      delivered: Math.floor((response.meta?.total || 0) * 0.7),
      pending: Math.floor((response.meta?.total || 0) * 0.2),
      global: recentNotifications.value.filter(n => n.isGlobal).length
    }
  } catch (error) {
    console.error('Error fetching notification data:', error)
    recentNotifications.value = []
    notificationStats.value = { total: 0, delivered: 0, pending: 0, global: 0 }
  }
}

const refreshDashboard = async () => {
  await Promise.all([
    fetchDashboardData(),
    fetchNotificationData()
  ])
  toast.success('Dashboard đã được làm mới!')
}

const createRevenueChart = () => {
  if (!revenueChart.value || !stats.value.revenueByMonth?.length) return

  if (chartInstance) {
    chartInstance.destroy()
  }

  const ctx = revenueChart.value.getContext('2d')
  const data = stats.value.revenueByMonth.slice(-12)

  chartInstance = new Chart(ctx, {
    type: 'line',
    data: {
      labels: data.map(d => d.month || 'Month'),
      datasets: [{
        label: 'Doanh thu',
        data: data.map(d => d.revenue || 0),
        borderColor: '#3B82F6',
        backgroundColor: 'rgba(59, 130, 246, 0.1)',
        tension: 0.4,
        fill: true,
        pointRadius: 6,
        pointHoverRadius: 8,
        pointBackgroundColor: '#3B82F6',
        pointBorderColor: '#fff',
        pointBorderWidth: 2
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false }
      },
      scales: {
        y: {
          beginAtZero: true,
          ticks: {
            callback: (value) => `$${value.toLocaleString()}`,
            color: '#6B7280'
          },
          grid: {
            color: 'rgba(0,0,0,0.05)'
          }
        },
        x: {
          ticks: { color: '#6B7280' },
          grid: { display: false }
        }
      },
      interaction: {
        intersect: false,
        mode: 'index'
      }
    }
  })
}

const updateChart = () => {
  createRevenueChart()
}

// Helper functions
const formatNumber = (num, decimals = 0) => {
  if (!num) return '0'
  return num.toLocaleString('vi-VN', { 
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals 
  })
}

const formatTime = (timestamp) => {
  return dayjs(timestamp).fromNow()
}

const getTrendClass = (value) => {
  if (value > 0) return 'positive'
  if (value < 0) return 'negative'
  return 'neutral'
}

const truncateText = (text, length) => {
  if (!text) return ''
  return text.length > length ? text.substring(0, length) + '...' : text
}

const navigateTo = (path) => {
  router.push(path)
}

const getNotificationIcon = (type) => {
  const icons = {
    NEW_PRODUCT: Sparkles,
    PRICE_DROP: TrendingDown,
    ORDER_UPDATE: ShoppingBag,
    SYSTEM_UPDATE: RefreshCw,
    PROMOTION: Tag,
    REVIEW_REMINDER: MessageSquare,
    STOCK_ALERT: AlertTriangle,
  }
  return icons[type] || Bell
}

const getNotificationIconClass = (type) => {
  const classes = {
    NEW_PRODUCT: 'success',
    PRICE_DROP: 'warning',
    ORDER_UPDATE: 'info',
    SYSTEM_UPDATE: 'secondary',
    PROMOTION: 'primary',
    REVIEW_REMINDER: 'info',
    STOCK_ALERT: 'warning',
  }
  return classes[type] || 'info'
}

const getTypeLabel = (type) => {
  const labels = {
    NEW_PRODUCT: 'Sản phẩm',
    PRICE_DROP: 'Giá cả',
    ORDER_UPDATE: 'Đơn hàng',
    SYSTEM_UPDATE: 'Hệ thống',
    PROMOTION: 'Khuyến mãi',
    REVIEW_REMINDER: 'Đánh giá',
    STOCK_ALERT: 'Kho hàng',
  }
  return labels[type] || type
}

const sendTestNotification = async () => {
  try {
    await notificationService.createNotification({
      title: 'Thông báo thử nghiệm',
      message: 'Đây là thông báo thử nghiệm từ admin dashboard',
      type: 'SYSTEM_UPDATE',
      priority: 'MEDIUM',
      isGlobal: true
    })
    toast.success('Đã gửi thông báo thử nghiệm!')
    fetchNotificationData()
  } catch (error) {
    console.error('Error sending test notification:', error)
    toast.error('Không thể gửi thông báo thử nghiệm')
  }
}

const viewNotificationAnalytics = () => {
  toast.info('Tính năng phân tích đang được phát triển!')
}

const calculateAverageRevenue = () => {
  if (!stats.value.revenueByMonth?.length) return '0'
  const total = stats.value.revenueByMonth.reduce((sum, item) => sum + (item.revenue || 0), 0)
  return formatNumber(total / stats.value.revenueByMonth.length, 2)
}

const getMaxRevenue = () => {
  if (!stats.value.revenueByMonth?.length) return '0'
  const max = Math.max(...stats.value.revenueByMonth.map(item => item.revenue || 0))
  return formatNumber(max, 2)
}

const handleImageError = (event) => {
  event.target.src = '/placeholder.jpg'
}

// Lifecycle
onMounted(async () => {
  await Promise.all([
    fetchDashboardData(),
    fetchNotificationData()
  ])
})
</script>

<style scoped lang="scss">
// Variables
$primary: #3B82F6;
$success: #10B981;
$warning: #F59E0B;
$error: #EF4444;
$info: #06B6D4;
$secondary: #6B7280;

$gradient-blue: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
$gradient-green: linear-gradient(135deg, #11998e 0%, #38ef7d 100%);
$gradient-orange: linear-gradient(135deg, #FC466B 0%, #3FDCF7 100%);
$gradient-purple: linear-gradient(135deg, #FDBB2D 0%, #22C1C3 100%);

.admin-dashboard {
  min-height: 100vh;
  background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
  padding: 2rem;
  max-width: 1400px;
  margin: 0 auto;
  width: 95%;
}

.dashboard-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 2rem;
  
  .header-content {
    h2 {
      margin: 0 0 0.5rem 0;
      color: #1F2937;
      font-weight: 700;
      font-size: 2.5rem;
    }
    
    .header-subtitle {
      color: #6B7280;
      margin: 0;
      font-size: 1.1rem;
    }
  }
  
  .header-actions {
    display: flex;
    gap: 1rem;
    align-items: center;
    
    .date-filter {
      .date-select {
        padding: 0.75rem 1rem;
        border: 1px solid #E5E7EB;
        border-radius: 12px;
        background: white;
        color: #374151;
        font-weight: 500;
        cursor: pointer;
        
        &:focus {
          outline: none;
          border-color: $primary;
          box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
        }
      }
    }
  }
}

.loading-container {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 400px;
  
  .loading-spinner {
    text-align: center;
    
    .spinner {
      width: 50px;
      height: 50px;
      border: 4px solid #E5E7EB;
      border-top: 4px solid $primary;
      border-radius: 50%;
      animation: spin 1s linear infinite;
      margin: 0 auto 1rem;
    }
    
    p {
      color: #6B7280;
      font-size: 1.1rem;
    }
  }
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.dashboard-content {
  .section-title {
    font-size: 1.5rem;
    font-weight: 600;
    color: #1F2937;
    margin-bottom: 1.5rem;
  }
}

.stats-section {
  margin-bottom: 3rem;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 1.5rem;
}

.stat-card {
  background: white;
  border-radius: 20px;
  padding: 2rem;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
  transition: all 0.3s ease;
  cursor: pointer;
  position: relative;
  overflow: hidden;
  
  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 4px;
  }
  
  &:hover {
    transform: translateY(-8px);
    box-shadow: 0 20px 40px rgba(0, 0, 0, 0.15);
  }
  
  &.users::before { background: $gradient-blue; }
  &.products::before { background: $gradient-green; }
  &.orders::before { background: $gradient-orange; }
  &.revenue::before { background: $gradient-purple; }
  
  .stat-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 1rem;
    
    .stat-icon {
      width: 60px;
      height: 60px;
      border-radius: 16px;
      display: flex;
      align-items: center;
      justify-content: center;
      
      svg {
        width: 28px;
        height: 28px;
        color: white;
      }
    }
    
    .stat-trend {
      display: flex;
      align-items: center;
      gap: 0.25rem;
      padding: 0.5rem 0.75rem;
      border-radius: 20px;
      font-size: 0.85rem;
      font-weight: 600;
      
      &.positive {
        background: rgba(16, 185, 129, 0.1);
        color: $success;
      }
      
      &.negative {
        background: rgba(239, 68, 68, 0.1);
        color: $error;
      }
      
      svg {
        width: 14px;
        height: 14px;
      }
    }
  }
  
  &.users .stat-icon { background: $gradient-blue; }
  &.products .stat-icon { background: $gradient-green; }
  &.orders .stat-icon { background: $gradient-orange; }
  &.revenue .stat-icon { background: $gradient-purple; }
  
  .stat-content {
    .stat-number {
      font-size: 2.5rem;
      font-weight: 800;
      color: #1F2937;
      line-height: 1;
      margin-bottom: 0.5rem;
    }
    
    .stat-label {
      font-size: 1rem;
      color: #6B7280;
      font-weight: 500;
      margin-bottom: 0.5rem;
    }
    
    .stat-meta {
      font-size: 0.85rem;
      color: #9CA3AF;
    }
  }
}

.main-content {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 2rem;
  margin-bottom: 3rem;
}

.section-card {
  background: white;
  border-radius: 20px;
  padding: 2rem;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
  margin-bottom: 2rem;
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 2rem;
  
  .section-title {
    display: flex;
    align-items: center;
    gap: 1rem;
    
    .section-icon {
      width: 24px;
      height: 24px;
      color: $primary;
    }
    
    h4 {
      margin: 0 0 0.25rem 0;
      color: #1F2937;
      font-weight: 600;
      font-size: 1.25rem;
    }
    
    p {
      margin: 0;
      color: #6B7280;
      font-size: 0.9rem;
    }
  }
  
  .view-all-btn {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    color: $primary;
    text-decoration: none;
    font-weight: 500;
    padding: 0.5rem 1rem;
    border-radius: 10px;
    transition: all 0.2s ease;
    
    &:hover {
      background: rgba(59, 130, 246, 0.1);
    }
    
    svg {
      width: 16px;
      height: 16px;
    }
  }
}

.notification-section {
  .notification-stats {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 1rem;
    margin-bottom: 2rem;
  }
  
  .mini-stat-card {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    padding: 1rem;
    background: #F9FAFB;
    border-radius: 12px;
    
    .mini-stat-icon {
      width: 40px;
      height: 40px;
      border-radius: 10px;
      display: flex;
      align-items: center;
      justify-content: center;
      
      svg {
        width: 20px;
        height: 20px;
        color: white;
      }
      
      &.total { background: $gradient-blue; }
      &.success { background: $gradient-green; }
      &.warning { background: $gradient-orange; }
      &.info { background: $gradient-purple; }
    }
    
    .mini-stat-content {
      .mini-stat-number {
        font-size: 1.5rem;
        font-weight: 700;
        color: #1F2937;
        line-height: 1;
      }
      
      .mini-stat-label {
        font-size: 0.8rem;
        color: #6B7280;
      }
    }
  }
  
  .quick-actions {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 1rem;
  }
  
  .action-btn {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 0.5rem;
    padding: 0.75rem 1rem;
    border: none;
    border-radius: 12px;
    font-weight: 500;
    text-decoration: none;
    transition: all 0.2s ease;
    cursor: pointer;
    
    &.primary {
      background: $primary;
      color: white;
      &:hover { background: #2563EB; }
    }
    
    &.success {
      background: $success;
      color: white;
      &:hover { background: #059669; }
    }
    
    &.info {
      background: $info;
      color: white;
      &:hover { background: #0891B2; }
    }
    
    svg {
      width: 16px;
      height: 16px;
    }
  }
}

.orders-container, .notifications-container {
  max-height: 400px;
  overflow-y: auto;
}

.orders-list, .notifications-list {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.order-item {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 1rem;
  background: #F9FAFB;
  border-radius: 12px;
  transition: all 0.2s ease;
  
  &:hover {
    background: #F3F4F6;
  }
  
  .order-info {
    flex: 1;
    
    .order-id {
      font-family: 'Monaco', monospace;
      font-weight: 600;
      color: $primary;
      margin-bottom: 0.25rem;
    }
    
    .customer-name {
      font-weight: 500;
      color: #1F2937;
      margin-bottom: 0.25rem;
    }
    
    .order-date {
      font-size: 0.85rem;
      color: #6B7280;
    }
  }
  
  .order-details {
    text-align: right;
    
    .order-amount {
      font-weight: 700;
      color: $success;
      font-size: 1.1rem;
      margin-bottom: 0.25rem;
    }
    
    .order-status {
      padding: 0.25rem 0.75rem;
      border-radius: 20px;
      font-size: 0.75rem;
      font-weight: 600;
      text-transform: uppercase;
      
      &.pending { background: rgba(245, 158, 11, 0.2); color: #D97706; }
      &.processing { background: rgba(6, 182, 212, 0.2); color: #0891B2; }
      &.shipped { background: rgba(16, 185, 129, 0.2); color: #059669; }
      &.delivered { background: rgba(16, 185, 129, 0.3); color: #047857; }
      &.cancelled { background: rgba(239, 68, 68, 0.2); color: #DC2626; }
    }
  }
  
  .order-actions {
    .view-btn {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 36px;
      height: 36px;
      background: $primary;
      color: white;
      border-radius: 10px;
      text-decoration: none;
      transition: all 0.2s ease;
      
      &:hover {
        background: #2563EB;
        transform: scale(1.05);
      }
      
      svg {
        width: 16px;
        height: 16px;
      }
    }
  }
}

.chart-section {
  .chart-controls {
    .chart-select {
      padding: 0.5rem 1rem;
      border: 1px solid #E5E7EB;
      border-radius: 8px;
      background: white;
      color: #374151;
      font-size: 0.9rem;
      
      &:focus {
        outline: none;
        border-color: $primary;
      }
    }
  }
  
  .chart-container {
    position: relative;
    height: 300px;
    margin: 1rem 0;
  }
  
  .chart-summary {
    display: flex;
    justify-content: space-around;
    padding: 1rem 0;
    border-top: 1px solid #E5E7EB;
    
    .summary-item {
      text-align: center;
      
      .summary-label {
        display: block;
        font-size: 0.8rem;
        color: #6B7280;
        margin-bottom: 0.25rem;
      }
      
      .summary-value {
        font-weight: 600;
        color: #1F2937;
        
        &.positive {
          color: $success;
        }
      }
    }
  }
}

.notification-item {
  display: flex;
  align-items: flex-start;
  gap: 1rem;
  padding: 1rem;
  background: #F9FAFB;
  border-radius: 12px;
  
  .notification-icon {
    width: 40px;
    height: 40px;
    border-radius: 10px;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
    
    svg {
      width: 20px;
      height: 20px;
      color: white;
    }
    
    &.primary { background: $primary; }
    &.success { background: $success; }
    &.warning { background: $warning; }
    &.info { background: $info; }
    &.secondary { background: $secondary; }
  }
  
  .notification-content {
    flex: 1;
    
    .notification-title {
      font-weight: 600;
      color: #1F2937;
      margin-bottom: 0.25rem;
    }
    
    .notification-message {
      color: #6B7280;
      font-size: 0.9rem;
      line-height: 1.4;
      margin-bottom: 0.5rem;
    }
    
    .notification-meta {
      display: flex;
      gap: 1rem;
      font-size: 0.8rem;
      
      .notification-time {
        color: $primary;
        font-weight: 500;
      }
      
      .notification-type {
        color: #6B7280;
        background: #E5E7EB;
        padding: 0.125rem 0.5rem;
        border-radius: 10px;
      }
    }
  }
  
  .notification-status {
    .status-indicator {
      width: 8px;
      height: 8px;
      border-radius: 50%;
      
      &.active { background: $success; }
      &.inactive { background: $error; }
    }
  }
}

.bottom-section {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 2rem;
}

.products-list {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.product-item {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 1rem;
  background: #F9FAFB;
  border-radius: 12px;
  
  .product-rank {
    width: 32px;
    height: 32px;
    background: $primary;
    color: white;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    font-weight: 700;
    font-size: 0.9rem;
  }
  
  .product-image {
    width: 50px;
    height: 50px;
    border-radius: 10px;
    overflow: hidden;
    
    img {
      width: 100%;
      height: 100%;
      object-fit: cover;
    }
  }
  
  .product-info {
    flex: 1;
    
    .product-name {
      font-weight: 600;
      color: #1F2937;
      margin-bottom: 0.25rem;
    }
    
    .product-stats {
      display: flex;
      gap: 1rem;
      font-size: 0.85rem;
      color: #6B7280;
      
      .product-rating {
        display: flex;
        align-items: center;
        gap: 0.25rem;
        
        .star-icon {
          width: 14px;
          height: 14px;
          color: #F59E0B;
        }
      }
    }
  }
  
  .product-revenue {
    text-align: right;
    
    .revenue-amount {
      font-weight: 700;
      color: $success;
      font-size: 1.1rem;
    }
    
    .revenue-growth {
      font-size: 0.8rem;
      color: $success;
      font-weight: 500;
    }
  }
}

.management-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 1rem;
}

.management-card {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 1.5rem;
  background: #F9FAFB;
  border-radius: 16px;
  text-decoration: none;
  color: #1F2937;
  transition: all 0.2s ease;
  
  &:hover {
    background: #F3F4F6;
    transform: translateY(-2px);
    box-shadow: 0 8px 25px rgba(0, 0, 0, 0.1);
  }
  
  .management-icon {
    width: 48px;
    height: 48px;
    border-radius: 12px;
    display: flex;
    align-items: center;
    justify-content: center;
    
    svg {
      width: 24px;
      height: 24px;
      color: white;
    }
    
    &.products { background: $gradient-green; }
    &.orders { background: $gradient-orange; }
    &.users { background: $gradient-blue; }
    &.categories { background: $gradient-purple; }
    &.notifications { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); }
    &.analytics { background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%); }
  }
  
  .management-content {
    flex: 1;
    
    .management-title {
      font-weight: 600;
      color: #1F2937;
      margin-bottom: 0.25rem;
    }
    
    .management-count {
      font-size: 0.9rem;
      color: #6B7280;
    }
  }
  
  .management-arrow {
    width: 20px;
    height: 20px;
    color: #9CA3AF;
  }
}

.empty-state {
  text-align: center;
  padding: 3rem 2rem;
  color: #6B7280;
  
  .empty-icon {
    width: 64px;
    height: 64px;
    margin: 0 auto 1rem;
    opacity: 0.4;
  }
  
  p {
    font-size: 1.1rem;
    margin: 0;
  }
}

// Responsive Design
@media (max-width: 1200px) {
  .main-content,
  .bottom-section {
    grid-template-columns: 1fr;
  }
  
  .management-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (max-width: 768px) {
  .admin-dashboard {
    padding: 1rem;
  }
  
  .dashboard-header {
    flex-direction: column;
    align-items: stretch;
    gap: 1rem;
    
    .header-content h2 {
      font-size: 2rem;
    }
    
    .header-actions {
      justify-content: space-between;
    }
  }
  
  .stats-grid {
    grid-template-columns: 1fr;
  }
  
  .notification-stats {
    grid-template-columns: repeat(2, 1fr);
  }
  
  .quick-actions {
    grid-template-columns: 1fr;
  }
  
  .management-grid {
    grid-template-columns: 1fr;
  }
  
  .section-card {
    padding: 1.5rem;
  }
  
  .chart-container {
    height: 250px;
  }
}

@media (max-width: 480px) {
  .stat-card {
    padding: 1.5rem;
    
    .stat-header {
      flex-direction: column;
      gap: 1rem;
      text-align: center;
    }
    
    .stat-content .stat-number {
      font-size: 2rem;
    }
  }
  
  .notification-stats {
    grid-template-columns: 1fr;
  }
  
  .order-item,
  .notification-item {
    flex-direction: column;
    align-items: flex-start;
    gap: 1rem;
  }
}

// Smooth animations
.stat-card,
.section-card {
  animation: fadeInUp 0.6s ease-out;
}

@keyframes fadeInUp {
  from {
    opacity: 0;
    transform: translateY(30px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

// Custom scrollbar
.orders-container::-webkit-scrollbar,
.notifications-container::-webkit-scrollbar,
.products-list::-webkit-scrollbar {
  width: 6px;
}

.orders-container::-webkit-scrollbar-track,
.notifications-container::-webkit-scrollbar-track,
.products-list::-webkit-scrollbar-track {
  background: #F3F4F6;
  border-radius: 3px;
}

.orders-container::-webkit-scrollbar-thumb,
.notifications-container::-webkit-scrollbar-thumb,
.products-list::-webkit-scrollbar-thumb {
  background: #D1D5DB;
  border-radius: 3px;
}

.orders-container::-webkit-scrollbar-thumb:hover,
.notifications-container::-webkit-scrollbar-thumb:hover,
.products-list::-webkit-scrollbar-thumb:hover {
  background: #9CA3AF;
}
</style>