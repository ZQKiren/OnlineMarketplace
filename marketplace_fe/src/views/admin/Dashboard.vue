<template>
  <div class="container admin-dashboard">
    <div class="dashboard-header">
      <h4>Admin Dashboard</h4>
      <div class="header-actions">
        <button class="btn waves-effect waves-light blue" @click="refreshDashboard">
          <i class="material-icons left">refresh</i>
          Refresh
        </button>
      </div>
    </div>
    
    <div v-if="loading" class="loading-spinner">
      <LoadingSpinner text="Loading dashboard data..." />
    </div>
    
    <div v-else>
      <!-- Main Stats Cards -->
      <div class="stats-grid">
        <div class="stat-card blue">
          <div class="stat-icon">
            <i class="material-icons">people</i>
          </div>
          <div class="stat-content">
            <div class="stat-number">{{ stats.totalUsers }}</div>
            <div class="stat-label">Total Users</div>
            <div class="stat-trend positive">
              <i class="material-icons">trending_up</i>
              +12%
            </div>
          </div>
        </div>
        
        <div class="stat-card green">
          <div class="stat-icon">
            <i class="material-icons">inventory</i>
          </div>
          <div class="stat-content">
            <div class="stat-number">{{ stats.totalProducts }}</div>
            <div class="stat-label">Total Products</div>
            <div class="stat-trend positive">
              <i class="material-icons">trending_up</i>
              +8%
            </div>
          </div>
        </div>
        
        <div class="stat-card orange">
          <div class="stat-icon">
            <i class="material-icons">shopping_cart</i>
          </div>
          <div class="stat-content">
            <div class="stat-number">{{ stats.totalOrders }}</div>
            <div class="stat-label">Total Orders</div>
            <div class="stat-trend neutral">
              <i class="material-icons">trending_flat</i>
              0%
            </div>
          </div>
        </div>
        
        <div class="stat-card purple">
          <div class="stat-icon">
            <i class="material-icons">attach_money</i>
          </div>
          <div class="stat-content">
            <div class="stat-number">${{ stats.totalRevenue.toFixed(2) }}</div>
            <div class="stat-label">Total Revenue</div>
            <div class="stat-trend positive">
              <i class="material-icons">trending_up</i>
              +15%
            </div>
          </div>
        </div>
      </div>

      <!-- Notification Management Section -->
      <div class="section-card notification-section">
        <div class="section-header">
          <div class="section-title">
            <i class="material-icons">notifications_active</i>
            <h5>Notification Management</h5>
          </div>
          <router-link to="/admin/notifications" class="btn-flat blue-text">
            View All
          </router-link>
        </div>
        
        <!-- Notification Stats -->
        <div class="notification-stats">
          <div class="mini-stat">
            <div class="mini-stat-icon blue">
              <i class="material-icons">notifications</i>
            </div>
            <div class="mini-stat-content">
              <div class="mini-stat-number">{{ notificationStats.total }}</div>
              <div class="mini-stat-label">Total</div>
            </div>
          </div>
          
          <div class="mini-stat">
            <div class="mini-stat-icon green">
              <i class="material-icons">check_circle</i>
            </div>
            <div class="mini-stat-content">
              <div class="mini-stat-number">{{ notificationStats.delivered }}</div>
              <div class="mini-stat-label">Delivered</div>
            </div>
          </div>
          
          <div class="mini-stat">
            <div class="mini-stat-icon orange">
              <i class="material-icons">schedule</i>
            </div>
            <div class="mini-stat-content">
              <div class="mini-stat-number">{{ notificationStats.pending }}</div>
              <div class="mini-stat-label">Pending</div>
            </div>
          </div>
          
          <div class="mini-stat">
            <div class="mini-stat-icon purple">
              <i class="material-icons">public</i>
            </div>
            <div class="mini-stat-content">
              <div class="mini-stat-number">{{ notificationStats.global }}</div>
              <div class="mini-stat-label">Global</div>
            </div>
          </div>
        </div>
        
        <!-- Quick Actions -->
        <div class="quick-actions">
          <button 
            @click="sendTestNotification"
            class="action-btn primary"
          >
            <i class="material-icons">send</i>
            Send Test
          </button>
          
          <router-link 
            to="/admin/notifications/create" 
            class="action-btn success"
          >
            <i class="material-icons">add_alert</i>
            Create New
          </router-link>
          
          <router-link 
            to="/admin/notifications" 
            class="action-btn info"
          >
            <i class="material-icons">settings</i>
            Manage All
          </router-link>
          
          <button 
            @click="viewNotificationAnalytics"
            class="action-btn warning"
          >
            <i class="material-icons">poll</i>
            Analytics
          </button>
        </div>
      </div>

      <!-- Content Grid -->
      <div class="content-grid">
        <!-- Recent Notifications -->
        <div class="section-card">
          <div class="section-header">
            <div class="section-title">
              <i class="material-icons">history</i>
              <h6>Recent Notifications</h6>
            </div>
            <router-link to="/admin/notifications" class="btn-flat blue-text">
              View All
            </router-link>
          </div>
          
          <div class="notifications-list">
            <div v-if="recentNotifications.length === 0" class="empty-state">
              <i class="material-icons">notifications_none</i>
              <p>No recent notifications</p>
            </div>
            
            <div
              v-for="notification in recentNotifications"
              :key="notification.id"
              class="notification-item"
            >
              <div 
                class="notification-icon"
                :class="getNotificationIconClass(notification.type)"
              >
                <i class="material-icons">{{ getNotificationIcon(notification.type) }}</i>
              </div>
              
              <div class="notification-content">
                <div class="notification-title">{{ notification.title }}</div>
                <div class="notification-message">{{ notification.message }}</div>
                <div class="notification-meta">
                  <span class="time">{{ formatTime(notification.createdAt) }}</span>
                  <span class="type">{{ getTypeLabel(notification.type) }}</span>
                  <span class="recipients">
                    {{ notification.isGlobal ? 'All users' : `${notification.targetUsers?.length || 0} users` }}
                  </span>
                </div>
              </div>
              
              <div class="notification-status">
                <div 
                  class="status-dot"
                  :class="notification.isActive ? 'active' : 'inactive'"
                ></div>
              </div>
            </div>
          </div>
        </div>
        
        <!-- Revenue Chart -->
        <div class="section-card">
          <div class="section-header">
            <div class="section-title">
              <i class="material-icons">trending_up</i>
              <h6>Revenue Trend</h6>
            </div>
            <div class="chart-period">
              <span class="period-label">Last 6 months</span>
            </div>
          </div>
          
          <div class="chart-container">
            <canvas ref="revenueChart"></canvas>
          </div>
        </div>
      </div>

      <!-- Recent Orders -->
      <div class="section-card">
        <div class="section-header">
          <div class="section-title">
            <i class="material-icons">receipt_long</i>
            <h5>Recent Orders</h5>
          </div>
          <router-link to="/admin/orders" class="btn-flat blue-text">
            View All
          </router-link>
        </div>
        
        <div class="table-container">
          <table class="orders-table">
            <thead>
              <tr>
                <th>Order ID</th>
                <th>Customer</th>
                <th>Date</th>
                <th>Status</th>
                <th>Total</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="order in stats.recentOrders" :key="order.id">
                <td>
                  <span class="order-id">#{{ order.id.slice(-8) }}</span>
                </td>
                <td>
                  <div class="customer-info">
                    <div class="customer-name">{{ order.user.name }}</div>
                    <div class="customer-email">{{ order.user.email }}</div>
                  </div>
                </td>
                <td>
                  <span class="order-date">{{ formatDate(order.createdAt) }}</span>
                </td>
                <td>
                  <span class="status-badge" :class="order.status.toLowerCase()">
                    {{ formatStatus(order.status) }}
                  </span>
                </td>
                <td>
                  <span class="order-total">${{ order.totalAmount.toFixed(2) }}</span>
                </td>
                <td>
                  <div class="order-actions">
                    <router-link 
                      :to="`/orders/${order.id}`"
                      class="btn-small blue waves-effect"
                    >
                      View
                    </router-link>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- Bottom Grid -->
      <div class="bottom-grid">
        <!-- Top Products -->
        <div class="section-card">
          <div class="section-header">
            <div class="section-title">
              <i class="material-icons">star</i>
              <h6>Top Products</h6>
            </div>
          </div>
          
          <div class="products-list">
            <div 
              v-for="product in stats.topProducts" 
              :key="product.id"
              class="product-item"
            >
              <div class="product-image">
                <img 
                  :src="product.images[0] || '/placeholder.jpg'" 
                  :alt="product.name"
                >
              </div>
              <div class="product-info">
                <div class="product-name">{{ product.name }}</div>
                <div class="product-sales">{{ product.totalSold }} sold</div>
              </div>
              <div class="product-revenue">
                ${{ (product.price * product.totalSold).toFixed(2) }}
              </div>
            </div>
          </div>
        </div>
        
        <!-- Quick Management -->
        <div class="section-card">
          <div class="section-header">
            <div class="section-title">
              <i class="material-icons">dashboard</i>
              <h6>Quick Management</h6>
            </div>
          </div>
          
          <div class="management-grid">
            <router-link 
              to="/admin/products" 
              class="management-item"
            >
              <i class="material-icons">inventory_2</i>
              <span>Products</span>
            </router-link>
            
            <router-link 
              to="/admin/orders" 
              class="management-item"
            >
              <i class="material-icons">receipt</i>
              <span>Orders</span>
            </router-link>
            
            <router-link 
              to="/admin/users" 
              class="management-item"
            >
              <i class="material-icons">people</i>
              <span>Users</span>
            </router-link>
            
            <router-link 
              to="/admin/categories" 
              class="management-item"
            >
              <i class="material-icons">category</i>
              <span>Categories</span>
            </router-link>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, nextTick } from 'vue'
import { Chart } from 'chart.js/auto'
import { useToast } from 'vue-toastification'
import adminService from '@/services/admin.service'
import { notificationService } from '@/services/notification.service'
import LoadingSpinner from '@/components/common/LoadingSpinner.vue'
import { formatDate, formatStatus } from '@/utils/formatters'
import dayjs from 'dayjs'
import relativeTime from 'dayjs/plugin/relativeTime'
import 'dayjs/locale/vi'

dayjs.extend(relativeTime)
dayjs.locale('vi')

const toast = useToast()

const loading = ref(false)
const stats = ref({
  totalUsers: 0,
  totalProducts: 0,
  totalOrders: 0,
  totalRevenue: 0,
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

const fetchDashboardData = async () => {
  loading.value = true
  
  try {
    const response = await adminService.getDashboardStats()
    stats.value = response.data
    
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
    const notificationsResponse = await notificationService.getAllNotifications({
      limit: 5,
      page: 1
    })
    recentNotifications.value = notificationsResponse.data
    
    notificationStats.value = {
      total: notificationsResponse.meta.total,
      delivered: Math.floor(notificationsResponse.meta.total * 0.7),
      pending: Math.floor(notificationsResponse.meta.total * 0.2),
      global: recentNotifications.value.filter(n => n.isGlobal).length
    }
  } catch (error) {
    console.error('Error fetching notification data:', error)
    notificationStats.value = {
      total: 0,
      delivered: 0,
      pending: 0,
      global: 0
    }
  }
}

const refreshDashboard = async () => {
  await Promise.all([
    fetchDashboardData(),
    fetchNotificationData()
  ])
  toast.success('Dashboard refreshed!')
}

const getNotificationIcon = (type) => {
  const icons = {
    NEW_PRODUCT: 'new_releases',
    PRICE_DROP: 'trending_down',
    ORDER_UPDATE: 'shopping_bag',
    SYSTEM_UPDATE: 'system_update',
    PROMOTION: 'local_offer',
    REVIEW_REMINDER: 'rate_review',
    STOCK_ALERT: 'warning',
  }
  return icons[type] || 'notifications'
}

const getNotificationIconClass = (type) => {
  const classes = {
    NEW_PRODUCT: 'success',
    PRICE_DROP: 'warning',
    ORDER_UPDATE: 'info',
    SYSTEM_UPDATE: 'secondary',
    PROMOTION: 'danger',
    REVIEW_REMINDER: 'info',
    STOCK_ALERT: 'warning',
  }
  return classes[type] || 'info'
}

const getTypeLabel = (type) => {
  const labels = {
    NEW_PRODUCT: 'Product',
    PRICE_DROP: 'Pricing',
    ORDER_UPDATE: 'Order',
    SYSTEM_UPDATE: 'System',
    PROMOTION: 'Promo',
    REVIEW_REMINDER: 'Review',
    STOCK_ALERT: 'Stock',
  }
  return labels[type] || type
}

const formatTime = (timestamp) => {
  return dayjs(timestamp).fromNow()
}

const sendTestNotification = async () => {
  try {
    await notificationService.createNotification({
      title: 'Test Notification',
      message: 'This is a test notification sent from admin dashboard',
      type: 'SYSTEM_UPDATE',
      priority: 'MEDIUM',
      isGlobal: true
    })
    
    toast.success('Test notification sent!')
    fetchNotificationData()
  } catch (error) {
    console.error('Error sending test notification:', error)
    toast.error('Failed to send test notification')
  }
}

const viewNotificationAnalytics = () => {
  toast.info('Analytics feature coming soon!')
}

const createRevenueChart = () => {
  if (!revenueChart.value) return
  
  if (chartInstance) {
    chartInstance.destroy()
  }
  
  const ctx = revenueChart.value.getContext('2d')
  const data = stats.value.revenueByMonth.slice(-6)
  
  chartInstance = new Chart(ctx, {
    type: 'line',
    data: {
      labels: data.map(d => d.month || 'Month'),
      datasets: [{
        label: 'Revenue',
        data: data.map(d => d.revenue || 0),
        borderColor: '#1976d2',
        backgroundColor: 'rgba(25, 118, 210, 0.1)',
        tension: 0.4,
        fill: true,
        pointRadius: 4,
        pointHoverRadius: 6
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          display: false
        }
      },
      scales: {
        y: {
          beginAtZero: true,
          ticks: {
            callback: (value) => `$${value}`
          },
          grid: {
            color: 'rgba(0,0,0,0.1)'
          }
        },
        x: {
          grid: {
            display: false
          }
        }
      }
    }
  })
}

onMounted(async () => {
  await fetchDashboardData()
  await fetchNotificationData()
})
</script>

<style scoped lang="scss">
.admin-dashboard {
  padding: 20px 0;
  background: #f8f9fa;
  min-height: 100vh;
}

.dashboard-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 30px;
  
  h4 {
    margin: 0;
    color: #2c3e50;
    font-weight: 600;
  }
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 20px;
  margin-bottom: 30px;
}

.stat-card {
  background: white;
  border-radius: 12px;
  padding: 24px;
  box-shadow: 0 2px 12px rgba(0,0,0,0.08);
  display: flex;
  align-items: center;
  gap: 20px;
  position: relative;
  overflow: hidden;
  transition: transform 0.2s ease, box-shadow 0.2s ease;
  
  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 20px rgba(0,0,0,0.12);
  }
  
  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    width: 4px;
    height: 100%;
  }
  
  &.blue {
    color: #1976d2;
    
    &::before {
      background: #1976d2;
    }
  }
  
  &.green {
    color: #388e3c;
    
    &::before {
      background: #388e3c;
    }
  }
  
  &.orange {
    color: #f57c00;
    
    &::before {
      background: #f57c00;
    }
  }
  
  &.purple {
    color: #7b1fa2;
    
    &::before {
      background: #7b1fa2;
    }
  }
}

.stat-icon {
  width: 60px;
  height: 60px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  
  i {
    font-size: 28px;
  }
  
  .stat-card.blue & {
    background: rgba(25, 118, 210, 0.1);
    
    i {
      color: #1976d2;
    }
  }
  
  .stat-card.green & {
    background: rgba(56, 142, 60, 0.1);
    
    i {
      color: #388e3c;
    }
  }
  
  .stat-card.orange & {
    background: rgba(245, 124, 0, 0.1);
    
    i {
      color: #f57c00;
    }
  }
  
  .stat-card.purple & {
    background: rgba(123, 31, 162, 0.1);
    
    i {
      color: #7b1fa2;
    }
  }
}

.stat-content {
  flex: 1;
}

.stat-number {
  font-size: 2rem;
  font-weight: 700;
  color: #2c3e50;
  line-height: 1;
  margin-bottom: 4px;
}

.stat-label {
  font-size: 0.9rem;
  color: #6c757d;
  margin-bottom: 8px;
}

.stat-trend {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 0.8rem;
  font-weight: 600;
  
  &.positive {
    color: #28a745;
  }
  
  &.neutral {
    color: #6c757d;
  }
  
  i {
    font-size: 16px;
  }
}

.section-card {
  background: white;
  border-radius: 12px;
  padding: 24px;
  box-shadow: 0 2px 12px rgba(0,0,0,0.08);
  margin-bottom: 24px;
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  padding-bottom: 16px;
  border-bottom: 1px solid #e9ecef;
}

.section-title {
  display: flex;
  align-items: center;
  gap: 12px;
  
  i {
    color: #1976d2;
    font-size: 24px;
  }
  
  h5, h6 {
    margin: 0;
    color: #2c3e50;
    font-weight: 600;
  }
}

.notification-section {
  .notification-stats {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
    gap: 16px;
    margin-bottom: 24px;
  }
  
  .mini-stat {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 16px;
    background: #f8f9fa;
    border-radius: 8px;
  }
  
  .mini-stat-icon {
    width: 40px;
    height: 40px;
    border-radius: 8px;
    display: flex;
    align-items: center;
    justify-content: center;
    
    &.blue {
      background: rgba(25, 118, 210, 0.1);
      color: #1976d2;
    }
    
    &.green {
      background: rgba(56, 142, 60, 0.1);
      color: #388e3c;
    }
    
    &.orange {
      background: rgba(245, 124, 0, 0.1);
      color: #f57c00;
    }
    
    &.purple {
      background: rgba(123, 31, 162, 0.1);
      color: #7b1fa2;
    }
    
    i {
      font-size: 20px;
    }
  }
  
  .mini-stat-number {
    font-size: 1.5rem;
    font-weight: 700;
    color: #2c3e50;
    line-height: 1;
  }
  
  .mini-stat-label {
    font-size: 0.8rem;
    color: #6c757d;
  }
}

.quick-actions {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
  gap: 12px;
}

.action-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 12px 16px;
  border: none;
  border-radius: 8px;
  font-size: 0.9rem;
  font-weight: 500;
  text-decoration: none;
  transition: all 0.2s ease;
  cursor: pointer;
  
  &.primary {
    background: #1976d2;
    color: white;
    
    &:hover {
      background: #1565c0;
    }
  }
  
  &.success {
    background: #28a745;
    color: white;
    
    &:hover {
      background: #218838;
    }
  }
  
  &.info {
    background: #17a2b8;
    color: white;
    
    &:hover {
      background: #138496;
    }
  }
  
  &.warning {
    background: #ffc107;
    color: #212529;
    
    &:hover {
      background: #e0a800;
    }
  }
  
  i {
    font-size: 18px;
  }
}

.content-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 24px;
  margin-bottom: 24px;
}

.notifications-list {
  max-height: 400px;
  overflow-y: auto;
}

.notification-item {
  display: flex;
  align-items: flex-start;
  gap: 16px;
  padding: 16px 0;
  border-bottom: 1px solid #f0f0f0;
  
  &:last-child {
    border-bottom: none;
  }
}

.notification-icon {
  width: 40px;
  height: 40px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  
  &.success {
    background: rgba(40, 167, 69, 0.1);
    color: #28a745;
  }
  
  &.warning {
    background: rgba(255, 193, 7, 0.1);
    color: #ffc107;
  }
  
  &.info {
    background: rgba(23, 162, 184, 0.1);
    color: #17a2b8;
  }
  
  &.secondary {
    background: rgba(108, 117, 125, 0.1);
    color: #6c757d;
  }
  
  &.danger {
    background: rgba(220, 53, 69, 0.1);
    color: #dc3545;
  }
  
  i {
    font-size: 20px;
  }
}

.notification-content {
  flex: 1;
}

.notification-title {
  font-weight: 600;
  color: #2c3e50;
  margin-bottom: 4px;
  line-height: 1.3;
}

.notification-message {
  color: #6c757d;
  font-size: 0.9rem;
  line-height: 1.4;
  margin-bottom: 8px;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.notification-meta {
  display: flex;
  gap: 12px;
  font-size: 0.8rem;
  color: #6c757d;
  
  .time {
    color: #1976d2;
    font-weight: 500;
  }
  
  .type {
    background: #e9ecef;
    padding: 2px 8px;
    border-radius: 12px;
  }
  
  .recipients {
    font-style: italic;
  }
}

.notification-status {
  flex-shrink: 0;
}

.status-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  
  &.active {
    background: #28a745;
  }
  
  &.inactive {
    background: #dc3545;
  }
}

.chart-container {
  position: relative;
  height: 300px;
  margin-top: 16px;
}

.chart-period {
  font-size: 0.8rem;
  color: #6c757d;
}

.table-container {
  overflow-x: auto;
}

.orders-table {
  width: 100%;
  border-collapse: collapse;
  
  th {
    text-align: left;
    padding: 12px 16px;
    background: #f8f9fa;
    color: #2c3e50;
    font-weight: 600;
    border-bottom: 2px solid #e9ecef;
  }
  
  td {
    padding: 16px;
    border-bottom: 1px solid #f0f0f0;
    vertical-align: middle;
  }
  
  tr:hover {
    background: #f8f9fa;
  }
}

.order-id {
  font-family: monospace;
  font-weight: 600;
  color: #1976d2;
}

.customer-info {
  .customer-name {
    font-weight: 500;
    color: #2c3e50;
    margin-bottom: 2px;
  }
  
  .customer-email {
    font-size: 0.8rem;
    color: #6c757d;
  }
}

.order-date {
  color: #6c757d;
  font-size: 0.9rem;
}

.status-badge {
  display: inline-block;
  padding: 4px 12px;
  border-radius: 20px;
  font-size: 0.8rem;
  font-weight: 500;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  
  &.pending {
    background: rgba(255, 193, 7, 0.2);
    color: #856404;
  }
  
  &.processing {
    background: rgba(23, 162, 184, 0.2);
    color: #0c5460;
  }
  
  &.shipped {
    background: rgba(40, 167, 69, 0.2);
    color: #155724;
  }
  
  &.delivered {
    background: rgba(40, 167, 69, 0.3);
    color: #155724;
  }
  
  &.cancelled {
    background: rgba(220, 53, 69, 0.2);
    color: #721c24;
  }
}

.order-total {
  font-weight: 600;
  color: #28a745;
  font-size: 1.1rem;
}

.bottom-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 24px;
}

.products-list {
  max-height: 400px;
  overflow-y: auto;
}

.product-item {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 16px 0;
  border-bottom: 1px solid #f0f0f0;
  
  &:last-child {
    border-bottom: none;
  }
}

.product-image {
  width: 50px;
  height: 50px;
  border-radius: 8px;
  overflow: hidden;
  flex-shrink: 0;
  
  img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }
}

.product-info {
  flex: 1;
  
  .product-name {
    font-weight: 500;
    color: #2c3e50;
    margin-bottom: 4px;
    line-height: 1.3;
  }
  
  .product-sales {
    font-size: 0.8rem;
    color: #6c757d;
  }
}

.product-revenue {
  font-weight: 600;
  color: #28a745;
  font-size: 1.1rem;
}

.management-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 16px;
}

.management-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
  padding: 24px 16px;
  background: #f8f9fa;
  border-radius: 12px;
  text-decoration: none;
  color: #2c3e50;
  transition: all 0.2s ease;
  
  &:hover {
    background: #e9ecef;
    transform: translateY(-2px);
    color: #1976d2;
  }
  
  i {
    font-size: 32px;
    color: #1976d2;
  }
  
  span {
    font-weight: 500;
    font-size: 0.9rem;
  }
}

.empty-state {
  text-align: center;
  padding: 40px 20px;
  color: #6c757d;
  
  i {
    font-size: 48px;
    margin-bottom: 12px;
    display: block;
    opacity: 0.5;
  }
  
  p {
    margin: 0;
    font-size: 0.9rem;
  }
}

.loading-spinner {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 400px;
}

// Responsive Design
@media (max-width: 1200px) {
  .content-grid,
  .bottom-grid {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 768px) {
  .admin-dashboard {
    padding: 16px 0;
  }
  
  .dashboard-header {
    flex-direction: column;
    gap: 16px;
    align-items: flex-start;
  }
  
  .stats-grid {
    grid-template-columns: 1fr;
    gap: 16px;
  }
  
  .stat-card {
    padding: 20px;
  }
  
  .stat-number {
    font-size: 1.8rem;
  }
  
  .section-card {
    padding: 20px;
    margin-bottom: 20px;
  }
  
  .section-header {
    flex-direction: column;
    gap: 12px;
    align-items: flex-start;
  }
  
  .notification-stats {
    grid-template-columns: repeat(2, 1fr);
  }
  
  .quick-actions {
    grid-template-columns: repeat(2, 1fr);
  }
  
  .management-grid {
    grid-template-columns: 1fr;
  }
  
  .orders-table {
    font-size: 0.9rem;
    
    th,
    td {
      padding: 12px;
    }
  }
  
  .customer-info {
    .customer-email {
      display: none;
    }
  }
}

@media (max-width: 480px) {
  .notification-stats,
  .quick-actions {
    grid-template-columns: 1fr;
  }
  
  .stat-card {
    flex-direction: column;
    text-align: center;
    gap: 16px;
  }
  
  .notification-item {
    flex-direction: column;
    align-items: flex-start;
    gap: 12px;
  }
  
  .notification-meta {
    flex-direction: column;
    gap: 4px;
  }
}

// Dark mode support (optional)
@media (prefers-color-scheme: dark) {
  .admin-dashboard {
    background: #1a1a1a;
  }
  
  .section-card,
  .stat-card {
    background: #2d2d2d;
    color: #e0e0e0;
  }
  
  .stat-number,
  .section-title h5,
  .section-title h6 {
    color: #ffffff;
  }
  
  .notification-title,
  .customer-name,
  .product-name {
    color: #ffffff;
  }
  
  .orders-table {
    th {
      background: #3a3a3a;
      color: #ffffff;
    }
    
    tr:hover {
      background: #3a3a3a;
    }
  }
}

// Animation for smooth loading
.stat-card,
.section-card {
  animation: fadeInUp 0.6s ease-out;
}

@keyframes fadeInUp {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

// Scrollbar styling
.notifications-list::-webkit-scrollbar,
.products-list::-webkit-scrollbar {
  width: 6px;
}

.notifications-list::-webkit-scrollbar-track,
.products-list::-webkit-scrollbar-track {
  background: #f1f1f1;
  border-radius: 3px;
}

.notifications-list::-webkit-scrollbar-thumb,
.products-list::-webkit-scrollbar-thumb {
  background: #c1c1c1;
  border-radius: 3px;
}

.notifications-list::-webkit-scrollbar-thumb:hover,
.products-list::-webkit-scrollbar-thumb:hover {
  background: #a8a8a8;
}
</style>