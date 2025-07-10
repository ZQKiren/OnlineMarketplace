<!-- src/views/orders/OrderList.vue -->
<template>
  <div class="container">
    <h4>My Orders</h4>
    
    <div v-if="loading" class="loading-spinner">
      <div class="preloader-wrapper active">
        <div class="spinner-layer spinner-blue-only">
          <div class="circle-clipper left">
            <div class="circle"></div>
          </div>
        </div>
      </div>
    </div>
    
    <div v-else-if="orders.length === 0" class="no-orders">
      <i class="material-icons large">receipt</i>
      <p>You haven't placed any orders yet</p>
      <router-link to="/products" class="btn waves-effect waves-light">
        Start Shopping
      </router-link>
    </div>
    
    <div v-else>
      <div class="row">
        <div class="col s12">
          <div class="order-filters">
            <div class="input-field">
              <select v-model="statusFilter" @change="fetchOrders">
                <option value="">All Orders</option>
                <option value="PENDING">Pending</option>
                <option value="PROCESSING">Processing</option>
                <option value="SHIPPED">Shipped</option>
                <option value="DELIVERED">Delivered</option>
                <option value="CANCELLED">Cancelled</option>
              </select>
              <label>Filter by Status</label>
            </div>
          </div>
        </div>
      </div>
      
      <div class="orders-list">
        <div 
          v-for="order in orders" 
          :key="order.id"
          class="order-card custom-card"
        >
          <div class="order-header">
            <div>
              <h6>Order #{{ order.id.slice(-8) }}</h6>
              <p class="order-date">{{ formatDate(order.createdAt) }}</p>
            </div>
            <div>
              <span class="status-badge" :class="order.status.toLowerCase()">
                {{ formatStatus(order.status) }}
              </span>
            </div>
          </div>
          
          <div class="order-items">
            <div 
              v-for="item in order.items" 
              :key="item.id"
              class="order-item"
            >
              <img 
                :src="item.product.images[0] || '/placeholder.jpg'" 
                :alt="item.product.name"
                loading="lazy"
              >
              <div class="item-details">
                <p class="item-name">{{ item.product.name }}</p>
                <p class="item-info">
                  Qty: {{ item.quantity }} × ${{ item.price.toFixed(2) }}
                </p>
              </div>
              <p class="item-total">${{ (item.quantity * item.price).toFixed(2) }}</p>
            </div>
          </div>
          
          <div class="order-footer">
            <div class="order-total">
              <span>Total:</span>
              <span class="price">${{ order.totalAmount.toFixed(2) }}</span>
            </div>
            <router-link 
              :to="`/orders/${order.id}`"
              class="btn-flat waves-effect"
            >
              View Details
            </router-link>
          </div>
        </div>
      </div>
      <div v-if="meta.totalPages > 1" class="pagination-section">
        <ul class="pagination">
          <li :class="{ disabled: page === 1 }">
            <a @click="goToPage(page - 1)">&laquo;</a>
          </li>
          <li v-for="p in meta.totalPages" :key="p" :class="{ active: p === page }">
            <a @click="goToPage(p)">{{ p }}</a>
          </li>
          <li :class="{ disabled: page === meta.totalPages }">
            <a @click="goToPage(page + 1)">&raquo;</a>
          </li>
        </ul>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import orderService from '@/services/order.service'
import { formatDate, formatStatus } from '@/utils/formatters'

const orders = ref([])
const loading = ref(false)
const statusFilter = ref('')
const page = ref(1)
const limit = ref(5)
const meta = ref({ total: 0, totalPages: 1 })

const fetchOrders = async () => {
  loading.value = true
  try {
    const params = {
      ...(statusFilter.value ? { status: statusFilter.value } : {}),
      page: page.value,
      limit: limit.value
    }
    const response = await orderService.getUserOrders(params)
    orders.value = response.data
    meta.value = response.meta || { total: response.data.length, totalPages: 1, page: 1, limit: limit.value }
  } catch (error) {
    // XÓA console.error không cần thiết
  } finally {
    loading.value = false
  }
}

const goToPage = (p) => {
  if (p < 1 || p > meta.value.totalPages) return
  page.value = p
  fetchOrders()
}

onMounted(() => {
  fetchOrders()
  const elems = document.querySelectorAll('select')
  M.FormSelect.init(elems)
})
</script>

<style scoped lang="scss">
.no-orders {
  text-align: center;
  padding: 60px 0;
  
  i {
    color: #ccc;
  }
  
  p {
    font-size: 1.2rem;
    color: #666;
    margin: 20px 0;
  }
}

.order-filters {
  margin-bottom: 20px;
  
  .input-field {
    max-width: 200px;
  }
}

.orders-list {
  .order-card {
    margin-bottom: 20px;
  }
  
  .order-header {
    display: flex;
    justify-content: space-between;
    align-items: start;
    margin-bottom: 20px;
    
    h6 {
      margin: 0 0 5px 0;
      font-weight: 600;
    }
    
    .order-date {
      margin: 0;
      color: #666;
      font-size: 0.9rem;
    }
  }
  
  .order-items {
    border-top: 1px solid #e0e0e0;
    border-bottom: 1px solid #e0e0e0;
    padding: 15px 0;
    
    .order-item {
      display: flex;
      align-items: center;
      margin-bottom: 15px;
      
      &:last-child {
        margin-bottom: 0;
      }
      
      img {
        width: 60px;
        height: 60px;
        object-fit: cover;
        border-radius: 4px;
        margin-right: 15px;
      }
      
      .item-details {
        flex: 1;
        
        .item-name {
          margin: 0;
          font-weight: 500;
        }
        
        .item-info {
          margin: 5px 0 0 0;
          color: #666;
          font-size: 0.9rem;
        }
      }
      
      .item-total {
        margin: 0;
        font-weight: 500;
      }
    }
  }
  
  .order-footer {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-top: 15px;
    
    .order-total {
      font-size: 1.1rem;
      font-weight: 600;
      
      .price {
        color: #1976d2;
        margin-left: 10px;
      }
    }
  }
}

.loading-spinner {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 400px;
}
</style>