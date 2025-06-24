<!-- src/views/loyalty/LoyaltyHistory.vue -->
<template>
  <div class="loyalty-history">
    <div class="container">
      <!-- Page Header -->
      <div class="page-header">
        <div class="header-content">
          <div class="header-info">
            <i class="material-icons">history</i>
            <div class="header-text">
              <h4>Points History</h4>
              <p>Track all your loyalty points transactions</p>
            </div>
          </div>
          <div class="header-actions">
            <router-link to="/loyalty" class="btn-flat waves-effect">
              <i class="material-icons left">arrow_back</i>
              Back to Dashboard
            </router-link>
          </div>
        </div>
      </div>

      <!-- Summary Cards -->
      <div class="row summary-cards">
        <div class="col s12 m3">
          <div class="custom-card summary-card">
            <div class="summary-content">
              <h3>{{ currentBalance.toLocaleString() }}</h3>
              <p>Current Balance</p>
              <i class="material-icons">account_balance_wallet</i>
            </div>
          </div>
        </div>

        <div class="col s12 m3">
          <div class="custom-card summary-card">
            <div class="summary-content">
              <h3>{{ totalEarned.toLocaleString() }}</h3>
              <p>Total Earned</p>
              <i class="material-icons">trending_up</i>
            </div>
          </div>
        </div>

        <div class="col s12 m3">
          <div class="custom-card summary-card">
            <div class="summary-content">
              <h3>{{ totalRedeemed.toLocaleString() }}</h3>
              <p>Total Redeemed</p>
              <i class="material-icons">redeem</i>
            </div>
          </div>
        </div>

        <div class="col s12 m3">
          <div class="custom-card summary-card">
            <div class="summary-content">
              <h3>{{ pointsExpiringSoon.toLocaleString() }}</h3>
              <p>Expiring Soon</p>
              <i class="material-icons">schedule</i>
            </div>
          </div>
        </div>
      </div>

      <!-- Filters -->
      <div class="custom-card filters-card">
        <div class="card-header">
          <h5>
            <i class="material-icons">filter_list</i>
            Filter Transactions
          </h5>
          <button 
            @click="clearFilters" 
            class="btn-flat waves-effect"
            v-if="hasActiveFilters"
          >
            Clear Filters
          </button>
        </div>

        <div class="row filters-row">
          <div class="col s12 m4">
            <div class="input-field">
              <select v-model="filters.type" @change="applyFilters">
                <option value="">All Types</option>
                <option value="EARN">Earned Points</option>
                <option value="REDEEM">Redeemed Points</option>
                <option value="BONUS">Bonus Points</option>
                <option value="PENALTY">Penalty</option>
                <option value="EXPIRED">Expired Points</option>
              </select>
              <label>Transaction Type</label>
            </div>
          </div>

          <div class="col s12 m4">
            <div class="input-field">
              <input 
                id="date-from" 
                type="date" 
                v-model="filters.dateFrom"
                @change="applyFilters"
              >
              <label for="date-from" class="active">From Date</label>
            </div>
          </div>

          <div class="col s12 m4">
            <div class="input-field">
              <input 
                id="date-to" 
                type="date" 
                v-model="filters.dateTo"
                @change="applyFilters"
              >
              <label for="date-to" class="active">To Date</label>
            </div>
          </div>
        </div>
      </div>

      <!-- Transactions List -->
      <div class="custom-card transactions-card">
        <div class="card-header">
          <h5>
            <i class="material-icons">list</i>
            Transaction History
          </h5>
          <div class="header-controls">
            <div class="input-field inline">
              <select v-model="perPage" @change="changePerPage">
                <option value="10">10 per page</option>
                <option value="20">20 per page</option>
                <option value="50">50 per page</option>
              </select>
            </div>
          </div>
        </div>

        <!-- Loading State -->
        <div v-if="loading" class="loading-container">
          <div class="loading-spinner">
            <div class="preloader-wrapper active">
              <div class="spinner-layer spinner-blue-only">
                <div class="circle-clipper left">
                  <div class="circle"></div>
                </div>
                <div class="gap-patch">
                  <div class="circle"></div>
                </div>
                <div class="circle-clipper right">
                  <div class="circle"></div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Transactions Table -->
        <div v-else-if="filteredTransactions.length > 0" class="transactions-container">
          <!-- Desktop View -->
          <table class="responsive-table highlight hide-on-med-and-down">
            <thead>
              <tr>
                <th>Type</th>
                <th>Description</th>
                <th>Points</th>
                <th>Date</th>
                <th>Status</th>
                <th>Order</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="transaction in filteredTransactions" :key="transaction.id">
                <td>
                  <div class="transaction-type">
                    <i 
                      class="material-icons" 
                      :class="getTransactionColor(transaction.type)"
                    >
                      {{ getTransactionIcon(transaction.type) }}
                    </i>
                    <span class="type-text">{{ formatType(transaction.type) }}</span>
                  </div>
                </td>
                <td>
                  <div class="description-cell">
                    {{ formatTransactionDescription(transaction) }}
                  </div>
                </td>
                <td>
                  <span 
                    class="points-value" 
                    :class="getPointsClass(transaction.points)"
                  >
                    {{ transaction.points > 0 ? '+' : '' }}{{ transaction.points.toLocaleString() }}
                  </span>
                </td>
                <td>
                  <div class="date-cell">
                    <div class="date-primary">{{ formatDate(transaction.createdAt) }}</div>
                    <div class="date-secondary">{{ formatTime(transaction.createdAt) }}</div>
                  </div>
                </td>
                <td>
                  <span 
                    class="status-badge" 
                    :class="getStatusClass(transaction.status)"
                  >
                    {{ formatStatus(transaction.status) }}
                  </span>
                </td>
                <td>
                  <router-link 
                    v-if="transaction.orderId" 
                    :to="`/orders/${transaction.orderId}`"
                    class="btn btn-small btn-flat waves-effect"
                  >
                    View Order
                  </router-link>
                  <span v-else class="no-order">-</span>
                </td>
              </tr>
            </tbody>
          </table>

          <!-- Mobile View -->
          <div class="mobile-transactions hide-on-large-only">
            <div 
              v-for="transaction in filteredTransactions" 
              :key="transaction.id"
              class="mobile-transaction-card"
            >
              <div class="mobile-transaction-header">
                <div class="transaction-type-mobile">
                  <i 
                    class="material-icons" 
                    :class="getTransactionColor(transaction.type)"
                  >
                    {{ getTransactionIcon(transaction.type) }}
                  </i>
                  <span class="type-text">{{ formatType(transaction.type) }}</span>
                </div>
                <span 
                  class="points-value-mobile" 
                  :class="getPointsClass(transaction.points)"
                >
                  {{ transaction.points > 0 ? '+' : '' }}{{ transaction.points.toLocaleString() }}
                </span>
              </div>

              <div class="mobile-transaction-body">
                <div class="description-mobile">
                  {{ formatTransactionDescription(transaction) }}
                </div>
                
                <div class="transaction-meta">
                  <div class="meta-item">
                    <i class="material-icons tiny">schedule</i>
                    <span>{{ formatDate(transaction.createdAt) }} {{ formatTime(transaction.createdAt) }}</span>
                  </div>
                  
                  <div class="meta-item">
                    <i class="material-icons tiny">info</i>
                    <span 
                      class="status-badge mobile" 
                      :class="getStatusClass(transaction.status)"
                    >
                      {{ formatStatus(transaction.status) }}
                    </span>
                  </div>

                  <div class="meta-item" v-if="transaction.orderId">
                    <i class="material-icons tiny">shopping_bag</i>
                    <router-link 
                      :to="`/orders/${transaction.orderId}`"
                      class="order-link"
                    >
                      View Order
                    </router-link>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Empty State -->
        <div v-else-if="!loading" class="empty-state">
          <i class="material-icons">history</i>
          <h5>No transactions found</h5>
          <p v-if="hasActiveFilters">Try adjusting your filters to see more results.</p>
          <p v-else>Start shopping to see your first transactions!</p>
          <router-link to="/products" class="btn btn-primary waves-effect waves-light">
            <i class="material-icons left">shopping_cart</i>
            Start Shopping
          </router-link>
        </div>

        <!-- Pagination -->
        <div v-if="pagination.totalPages > 1" class="pagination-container">
          <ul class="pagination">
            <li :class="{ disabled: pagination.page === 1 }">
              <a @click="goToPage(pagination.page - 1)" class="waves-effect">
                <i class="material-icons">chevron_left</i>
              </a>
            </li>

            <!-- Page numbers -->
            <li 
              v-for="page in visiblePages" 
              :key="page"
              :class="{ active: page === pagination.page }"
            >
              <a @click="goToPage(page)" class="waves-effect">{{ page }}</a>
            </li>

            <li :class="{ disabled: pagination.page === pagination.totalPages }">
              <a @click="goToPage(pagination.page + 1)" class="waves-effect">
                <i class="material-icons">chevron_right</i>
              </a>
            </li>
          </ul>

          <div class="pagination-info">
            Showing {{ startRecord }}-{{ endRecord }} of {{ pagination.total }} transactions
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch, nextTick } from 'vue'
import { useLoyaltyStore } from '@/stores/loyalty'
import { useToast } from 'vue-toastification'
import { formatDate } from '@/utils/formatters'
import dayjs from 'dayjs'

const loyaltyStore = useLoyaltyStore()
const toast = useToast()

// Local state
const loading = ref(false)
const perPage = ref(20)
const filters = ref({
  type: '',
  dateFrom: '',
  dateTo: ''
})

// Computed properties
const currentBalance = computed(() => loyaltyStore.currentBalance)
const totalEarned = computed(() => loyaltyStore.totalEarned)
const totalRedeemed = computed(() => loyaltyStore.totalRedeemed)
const pointsExpiringSoon = computed(() => loyaltyStore.pointsExpiringSoon)
const transactions = computed(() => loyaltyStore.transactions)
const pagination = computed(() => loyaltyStore.transactionsPagination)

const hasActiveFilters = computed(() => {
  return filters.value.type || filters.value.dateFrom || filters.value.dateTo
})

const filteredTransactions = computed(() => {
  let result = [...transactions.value]

  if (filters.value.type) {
    result = result.filter(t => t.type === filters.value.type)
  }

  if (filters.value.dateFrom) {
    const fromDate = dayjs(filters.value.dateFrom).startOf('day')
    result = result.filter(t => dayjs(t.createdAt).isAfter(fromDate) || dayjs(t.createdAt).isSame(fromDate))
  }

  if (filters.value.dateTo) {
    const toDate = dayjs(filters.value.dateTo).endOf('day')
    result = result.filter(t => dayjs(t.createdAt).isBefore(toDate) || dayjs(t.createdAt).isSame(toDate))
  }

  return result
})

const visiblePages = computed(() => {
  const current = pagination.value.page
  const total = pagination.value.totalPages
  const pages = []
  
  let start = Math.max(1, current - 2)
  let end = Math.min(total, current + 2)
  
  if (end - start < 4) {
    if (start === 1) {
      end = Math.min(total, start + 4)
    } else {
      start = Math.max(1, end - 4)
    }
  }
  
  for (let i = start; i <= end; i++) {
    pages.push(i)
  }
  
  return pages
})

const startRecord = computed(() => {
  return (pagination.value.page - 1) * pagination.value.limit + 1
})

const endRecord = computed(() => {
  return Math.min(pagination.value.page * pagination.value.limit, pagination.value.total)
})

// Methods
const fetchTransactions = async (page = 1) => {
  loading.value = true
  try {
    await loyaltyStore.fetchTransactions(page, perPage.value)
  } catch (error) {
    toast.error('Failed to load transactions')
  } finally {
    loading.value = false
  }
}

const goToPage = async (page) => {
  if (page >= 1 && page <= pagination.value.totalPages && page !== pagination.value.page) {
    await fetchTransactions(page)
  }
}

const changePerPage = async () => {
  await fetchTransactions(1)
}

const applyFilters = () => {
  // Filters are applied via computed property
  toast.info('Filters applied')
}

const clearFilters = () => {
  filters.value = {
    type: '',
    dateFrom: '',
    dateTo: ''
  }
  
  nextTick(() => {
    if (window.M?.FormSelect) {
      window.M.FormSelect.init(document.querySelectorAll('select'))
    }
  })
  
  toast.info('Filters cleared')
}

const getTransactionIcon = (type) => {
  return loyaltyStore.getTransactionIcon(type)
}

const getTransactionColor = (type) => {
  return loyaltyStore.getTransactionColor(type) + '-text'
}

const formatTransactionDescription = (transaction) => {
  return loyaltyStore.formatTransactionDescription(transaction)
}

const getPointsClass = (points) => {
  return points > 0 ? 'positive-points' : 'negative-points'
}

const formatType = (type) => {
  const types = {
    'EARN': 'Earned',
    'REDEEM': 'Redeemed',
    'BONUS': 'Bonus',
    'PENALTY': 'Penalty',
    'EXPIRED': 'Expired'
  }
  return types[type] || type
}

const formatStatus = (status) => {
  const statuses = {
    'PENDING': 'Pending',
    'COMPLETED': 'Completed',
    'CANCELLED': 'Cancelled'
  }
  return statuses[status] || status
}

const getStatusClass = (status) => {
  const classes = {
    'PENDING': 'pending',
    'COMPLETED': 'delivered',
    'CANCELLED': 'cancelled'
  }
  return classes[status] || 'pending'
}

const formatTime = (dateString) => {
  return dayjs(dateString).format('HH:mm')
}

// Lifecycle
onMounted(async () => {
  await loyaltyStore.fetchSummary()
  await fetchTransactions()
  
  // Initialize Materialize components
  nextTick(() => {
    if (window.M?.FormSelect) {
      window.M.FormSelect.init(document.querySelectorAll('select'))
    }
  })
})
</script>

<style scoped lang="scss">
@import '@/assets/styles/variables';

.loyalty-history {
  background: #f8f9fa;
  min-height: 100vh;
  padding: $spacing-lg 0;
}

.page-header {
  margin-bottom: $spacing-xl;
}

.header-content {
  background: white;
  border-radius: $border-radius-lg;
  padding: $spacing-xl;
  box-shadow: $shadow-md;
  display: flex;
  justify-content: space-between;
  align-items: center;
  
  .header-info {
    display: flex;
    align-items: center;
    gap: $spacing-md;
    
    i {
      color: $primary-color;
      font-size: 2.5rem;
    }
    
    .header-text {
      h4 {
        margin: 0 0 $spacing-xs;
        color: #2c3e50;
        font-weight: 600;
      }
      
      p {
        margin: 0;
        color: #6c757d;
        font-size: 0.95rem;
      }
    }
  }
  
  .header-actions {
    .btn-flat {
      color: $primary-color;
      
      &:hover {
        background: rgba($primary-color, 0.1);
      }
    }
  }
}

.summary-cards {
  margin-bottom: $spacing-xl;
  
  .summary-card {
    position: relative;
    overflow: hidden;
    transition: transform 0.3s ease, box-shadow 0.3s ease;
    
    &:hover {
      transform: translateY(-2px);
      box-shadow: $shadow-lg;
    }
    
    .summary-content {
      position: relative;
      z-index: 2;
      
      h3 {
        margin: 0 0 $spacing-xs;
        font-size: 2rem;
        font-weight: 700;
        color: $primary-color;
      }
      
      p {
        margin: 0;
        color: #6c757d;
        font-weight: 500;
      }
      
      i {
        position: absolute;
        top: $spacing-sm;
        right: $spacing-sm;
        font-size: 2rem;
        color: rgba($primary-color, 0.2);
      }
    }
  }
}

.filters-card {
  margin-bottom: $spacing-xl;
  
  .filters-row {
    margin-bottom: 0;
    
    .input-field {
      margin-bottom: 0;
      
      select {
        border: 1px solid #e0e0e0;
        border-radius: $border-radius-sm;
        padding: 8px 12px;
      }
      
      input[type="date"] {
        border: 1px solid #e0e0e0;
        border-radius: $border-radius-sm;
        padding: 8px 12px;
      }
    }
  }
}

.transactions-card {
  .card-header {
    .header-controls {
      display: flex;
      align-items: center;
      gap: $spacing-md;
      
      .input-field {
        margin: 0;
        
        &.inline {
          width: auto;
          min-width: 120px;
        }
      }
    }
  }
}

.loading-container {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 200px;
}

.transactions-container {
  .responsive-table {
    th {
      background: #f8f9fa;
      color: #495057;
      font-weight: 600;
      padding: $spacing-md;
      border-bottom: 2px solid #e9ecef;
    }
    
    td {
      padding: $spacing-md;
      border-bottom: 1px solid #f0f0f0;
    }
    
    .transaction-type {
      display: flex;
      align-items: center;
      gap: $spacing-sm;
      
      i {
        width: 32px;
        height: 32px;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 16px;
        
        &.green-text {
          background: rgba($success-color, 0.1);
        }
        
        &.blue-text {
          background: rgba($primary-color, 0.1);
        }
        
        &.orange-text {
          background: rgba($warning-color, 0.1);
        }
        
        &.red-text {
          background: rgba($error-color, 0.1);
        }
        
        &.grey-text {
          background: rgba(#9e9e9e, 0.1);
        }
      }
      
      .type-text {
        font-weight: 500;
      }
    }
    
    .description-cell {
      max-width: 250px;
      word-wrap: break-word;
    }
    
    .points-value {
      font-weight: 600;
      font-size: 1.1rem;
      
      &.positive-points {
        color: $success-color;
      }
      
      &.negative-points {
        color: $error-color;
      }
    }
    
    .date-cell {
      .date-primary {
        font-weight: 500;
        margin-bottom: 2px;
      }
      
      .date-secondary {
        font-size: 0.85rem;
        color: #6c757d;
      }
    }
    
    .no-order {
      color: #9e9e9e;
      font-style: italic;
    }
  }
}

.mobile-transactions {
  .mobile-transaction-card {
    background: white;
    border-radius: $border-radius-md;
    box-shadow: $shadow-sm;
    margin-bottom: $spacing-md;
    padding: $spacing-md;
    border-left: 4px solid transparent;
    
    &:hover {
      box-shadow: $shadow-md;
    }
    
    .mobile-transaction-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: $spacing-sm;
      
      .transaction-type-mobile {
        display: flex;
        align-items: center;
        gap: $spacing-sm;
        
        i {
          width: 28px;
          height: 28px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 14px;
          
          &.green-text {
            background: rgba($success-color, 0.1);
          }
          
          &.blue-text {
            background: rgba($primary-color, 0.1);
          }
          
          &.orange-text {
            background: rgba($warning-color, 0.1);
          }
          
          &.red-text {
            background: rgba($error-color, 0.1);
          }
          
          &.grey-text {
            background: rgba(#9e9e9e, 0.1);
          }
        }
        
        .type-text {
          font-weight: 500;
          font-size: 0.9rem;
        }
      }
      
      .points-value-mobile {
        font-weight: 600;
        font-size: 1.1rem;
        
        &.positive-points {
          color: $success-color;
        }
        
        &.negative-points {
          color: $error-color;
        }
      }
    }
    
    .mobile-transaction-body {
      .description-mobile {
        margin-bottom: $spacing-sm;
        font-size: 0.95rem;
        color: #2c3e50;
      }
      
      .transaction-meta {
        .meta-item {
          display: flex;
          align-items: center;
          gap: $spacing-xs;
          margin-bottom: $spacing-xs;
          font-size: 0.85rem;
          color: #6c757d;
          
          &:last-child {
            margin-bottom: 0;
          }
          
          i {
            font-size: 14px;
          }
          
          .order-link {
            color: $primary-color;
            text-decoration: none;
            
            &:hover {
              text-decoration: underline;
            }
          }
        }
      }
    }
  }
}

.empty-state {
  text-align: center;
  padding: $spacing-xl;
  color: #6c757d;
  
  i {
    font-size: 4rem;
    margin-bottom: $spacing-md;
    opacity: 0.5;
  }
  
  h5 {
    margin: $spacing-md 0;
    color: #495057;
  }
  
  p {
    margin: $spacing-sm 0;
  }
}

.pagination-container {
  margin-top: $spacing-xl;
  text-align: center;
  
  .pagination {
    display: inline-flex;
    justify-content: center;
    margin-bottom: $spacing-md;
    
    li {
      &.active a {
        background-color: $primary-color;
      }
      
      &.disabled a {
        color: #9e9e9e;
        cursor: not-allowed;
      }
      
      a {
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
        min-width: 40px;
        height: 40px;
      }
    }
  }
  
  .pagination-info {
    font-size: 0.9rem;
    color: #6c757d;
  }
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: $spacing-lg;
  padding-bottom: $spacing-md;
  border-bottom: 2px solid #f0f0f0;
  
  h5 {
    margin: 0;
    color: #2c3e50;
    font-weight: 600;
    display: flex;
    align-items: center;
    gap: $spacing-sm;
    
    i {
      color: $primary-color;
      font-size: 1.5rem;
    }
  }
  
  .btn-flat {
    color: $primary-color;
    font-weight: 500;
    
    &:hover {
      background: rgba($primary-color, 0.1);
    }
  }
}

// Responsive Design
@media (max-width: $tablet) {
  .header-content {
    flex-direction: column;
    gap: $spacing-md;
    text-align: center;
  }
  
  .summary-card {
    margin-bottom: $spacing-md;
  }
  
  .card-header {
    flex-direction: column;
    align-items: flex-start;
    gap: $spacing-sm;
    
    .header-controls {
      align-self: stretch;
      justify-content: flex-end;
    }
  }
  
  .filters-row {
    .col {
      margin-bottom: $spacing-md;
    }
  }
}

@media (max-width: $mobile) {
  .loyalty-history {
    padding: $spacing-md 0;
  }
  
  .page-header {
    margin-bottom: $spacing-lg;
  }
  
  .header-content {
    padding: $spacing-lg;
    
    .header-info {
      flex-direction: column;
      text-align: center;
      
      i {
        font-size: 2rem;
      }
    }
  }
  
  .custom-card {
    margin-bottom: $spacing-lg;
    padding: $spacing-lg;
  }
  
  .summary-cards {
    .summary-content {
      text-align: center;
      
      h3 {
        font-size: 1.5rem;
      }
      
      i {
        position: static;
        display: block;
        margin-top: $spacing-sm;
        font-size: 1.5rem;
      }
    }
  }
  
  .pagination {
    li a {
      min-width: 35px;
      height: 35px;
      font-size: 0.9rem;
    }
  }
}</style>