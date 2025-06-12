<!-- src/views/admin/Dashboard.vue -->
<template>
  <div class="container admin-dashboard">
    <h4>Admin Dashboard</h4>
    
    <div v-if="loading" class="loading-spinner">
      <LoadingSpinner text="Loading dashboard data..." />
    </div>
    
    <div v-else>
      <!-- Stats Cards -->
      <div class="row">
        <div class="col s12 m6 l3">
          <div class="stat-card custom-card blue white-text">
            <div class="stat-icon">
              <i class="material-icons">people</i>
            </div>
            <div class="stat-content">
              <h5>{{ stats.totalUsers }}</h5>
              <p>Total Users</p>
            </div>
          </div>
        </div>
        
        <div class="col s12 m6 l3">
          <div class="stat-card custom-card green white-text">
            <div class="stat-icon">
              <i class="material-icons">move_to_inbox</i>
            </div>
            <div class="stat-content">
              <h5>{{ stats.totalProducts }}</h5>
              <p>Total Products</p>
            </div>
          </div>
        </div>
        
        <div class="col s12 m6 l3">
          <div class="stat-card custom-card orange white-text">
            <div class="stat-icon">
              <i class="material-icons">shopping_cart</i>
            </div>
            <div class="stat-content">
              <h5>{{ stats.totalOrders }}</h5>
              <p>Total Orders</p>
            </div>
          </div>
        </div>
        
        <div class="col s12 m6 l3">
          <div class="stat-card custom-card purple white-text">
            <div class="stat-icon">
              <i class="material-icons">attach_money</i>
            </div>
            <div class="stat-content">
              <h5>${{ stats.totalRevenue.toFixed(2) }}</h5>
              <p>Total Revenue</p>
            </div>
          </div>
        </div>
      </div>
      
      <!-- Recent Orders -->
      <div class="row">
        <div class="col s12">
          <div class="custom-card">
            <div class="card-header">
              <h5>Recent Orders</h5>
              <router-link to="/admin/orders" class="btn-flat waves-effect">
                View All
              </router-link>
            </div>
            
            <table class="striped responsive-table">
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
                  <td>#{{ order.id.slice(-8) }}</td>
                  <td>{{ order.user.name }}</td>
                  <td>{{ formatDate(order.createdAt) }}</td>
                  <td>
                    <span class="status-badge" :class="order.status.toLowerCase()">
                      {{ formatStatus(order.status) }}
                    </span>
                  </td>
                  <td>${{ order.totalAmount.toFixed(2) }}</td>
                  <td>
                    <router-link 
                      :to="`/orders/${order.id}`"
                      class="btn-flat btn-small waves-effect"
                    >
                      View
                    </router-link>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
      
      <!-- Charts Row -->
      <div class="row">
        <div class="col s12 m6">
          <div class="custom-card">
            <h5>Revenue by Month</h5>
            <canvas ref="revenueChart"></canvas>
          </div>
        </div>
        
        <div class="col s12 m6">
          <div class="custom-card">
            <h5>Top Products</h5>
            <div class="top-products">
              <div 
                v-for="product in stats.topProducts" 
                :key="product.id"
                class="product-item"
              >
                <img 
                  :src="product.images[0] || '/placeholder.jpg'" 
                  :alt="product.name"
                >
                <div class="product-info">
                  <h6>{{ product.name }}</h6>
                  <p>{{ product.totalSold }} sold</p>
                </div>
                <div class="product-revenue">
                  ${{ (product.price * product.totalSold).toFixed(2) }}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <!-- Quick Actions -->
      <!-- Quick Actions -->
<div class="row">
  <div class="col s12">
    <div class="custom-card">
      <h5>Quick Actions</h5>
      <div class="quick-actions">
        <router-link 
          to="/admin/products" 
          class="btn action-btn waves-effect waves-light"
        >
          <i class="material-icons left">inventory_2</i>
          Manage Products
        </router-link>
        
        <router-link 
          to="/admin/orders" 
          class="btn action-btn waves-effect waves-light"
        >
          <i class="material-icons left">receipt</i>
          Manage Orders
        </router-link>
        
        <router-link 
          to="/admin/users" 
          class="btn action-btn waves-effect waves-light"
        >
          <i class="material-icons left">people</i>
          Manage Users
        </router-link>
        
        <router-link 
          to="/admin/categories" 
          class="btn action-btn waves-effect waves-light"
        >
          <i class="material-icons left">category</i>
          Manage Categories
        </router-link>
      </div>
    </div>
  </div>
</div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, nextTick } from 'vue'
import { Chart } from 'chart.js/auto'
import adminService from '@/services/admin.service'
import LoadingSpinner from '@/components/common/LoadingSpinner.vue'
import { formatDate, formatStatus } from '@/utils/formatters'

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
  } finally {
    loading.value = false
  }
}

const createRevenueChart = () => {
  if (!revenueChart.value) return
  
  if (chartInstance) {
    chartInstance.destroy()
  }
  
  const ctx = revenueChart.value.getContext('2d')
  const data = stats.value.revenueByMonth.slice(-6) // Last 6 months
  
  chartInstance = new Chart(ctx, {
    type: 'line',
    data: {
      labels: data.map(d => d.month),
      datasets: [{
        label: 'Revenue',
        data: data.map(d => d.revenue),
        borderColor: '#1976d2',
        backgroundColor: 'rgba(25, 118, 210, 0.1)',
        tension: 0.4,
        fill: true
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
            callback: (value) => `${value}`
          }
        }
      }
    }
  })
}

onMounted(() => {
  fetchDashboardData()
})
</script>

<style scoped lang="scss">
.admin-dashboard {
  .stat-card {
    display: flex;
    align-items: center;
    padding: 20px;
    
    .stat-icon {
      margin-right: 20px;
      
      i {
        font-size: 48px;
        opacity: 0.8;
      }
    }
    
    .stat-content {
      h5 {
        margin: 0;
        font-size: 2rem;
        font-weight: 600;
      }
      
      p {
        margin: 5px 0 0 0;
        opacity: 0.9;
      }
    }
  }
  
  .card-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 20px;
    
    h5 {
      margin: 0;
    }
  }
  
  .status-badge {
    display: inline-block;
    padding: 4px 12px;
    border-radius: 12px;
    font-size: 0.875rem;
    font-weight: 500;
    
    &.pending {
      background-color: #fff3cd;
      color: #856404;
    }
    
    &.processing {
      background-color: #cce5ff;
      color: #004085;
    }
    
    &.shipped {
      background-color: #d4edda;
      color: #155724;
    }
    
    &.delivered {
      background-color: #d1ecf1;
      color: #0c5460;
    }
  }
  
  canvas {
    max-height: 300px;
  }
  
  .top-products {
    .product-item {
      display: flex;
      align-items: center;
      padding: 15px 0;
      border-bottom: 1px solid #e0e0e0;
      
      &:last-child {
        border-bottom: none;
      }
      
      img {
        width: 60px;
        height: 60px;
        object-fit: cover;
        border-radius: 4px;
        margin-right: 15px;
      }
      
      .product-info {
        flex: 1;
        
        h6 {
          margin: 0 0 5px 0;
          font-weight: 500;
        }
        
        p {
          margin: 0;
          color: #666;
          font-size: 0.9rem;
        }
      }
      
      .product-revenue {
        font-weight: 600;
        color: #1976d2;
      }
    }
  }
  
  .quick-actions {
    display: flex;
    flex-wrap: wrap;
    gap: 15px; /* Khoảng cách giữa các nút */
    padding: 10px 0;

    .action-btn {
      display: flex;
      align-items: center;
      justify-content: center;
      min-width: 180px; /* Độ rộng tối thiểu cho nút */
      padding: 10px 15px;
      font-size: 1rem;
      border-radius: 8px; /* Viền bo tròn */
      background-color: #1976d2; /* Màu nền chính (hài hòa với giao diện) */
      color: white;
      text-transform: none; /* Giữ nguyên chữ thường */
      transition: background-color 0.3s ease; /* Hiệu ứng hover mượt mà */

      &:hover {
        background-color: #1565c0; /* Màu nền khi hover */
      }

      i.material-icons {
        margin-right: 8px; /* Khoảng cách giữa icon và text */
        font-size: 24px; /* Kích thước icon vừa phải */
      }

      @media (max-width: 768px) {
        min-width: 100%; /* Trên mobile, nút chiếm toàn bộ chiều rộng */
        margin-bottom: 10px;

        &:last-child {
          margin-bottom: 0; /* Loại bỏ margin cuối cùng */
        }
      }
    }
  }

  /* Đảm bảo card chứa Quick Actions không bị tràn */
  .custom-card {
    padding: 20px;
  }

}

.loading-spinner {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 400px;
}

.material-icons {
  width: 48px;
}
</style>