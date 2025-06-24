<!-- src/views/loyalty/LoyaltyDashboard.vue -->
<template>
  <div class="loyalty-dashboard">
    <div class="container">
      <!-- Page Header -->
      <div class="page-header">
        <div class="header-content">
          <div class="header-info">
            <Star :size="40" />
            <div class="header-text">
              <h4>Loyalty Points</h4>
              <p>Earn points, unlock rewards, and enjoy exclusive benefits</p>
            </div>
          </div>
          <div class="header-actions">
            <button 
              @click="refreshData" 
              class="btn-flat waves-effect"
              :disabled="loading"
            >
              <RotateCcw :size="20" :class="{ spinning: loading }" />
              Refresh
            </button>
          </div>
        </div>
      </div>

      <!-- Points Summary Cards -->
      <div class="row points-summary">
        <div class="col s12 m6 l3">
          <div class="custom-card stat-card blue">
            <div class="stat-content">
              <div class="stat-icon">
                <Wallet :size="48" />
              </div>
              <div class="stat-info">
                <h3>{{ currentBalance.toLocaleString() }}</h3>
                <p>Current Points</p>
              </div>
            </div>
          </div>
        </div>

        <div class="col s12 m6 l3">
          <div class="custom-card stat-card green">
            <div class="stat-content">
              <div class="stat-icon">
                <TrendingUp :size="48" />
              </div>
              <div class="stat-info">
                <h3>{{ totalEarned.toLocaleString() }}</h3>
                <p>Total Earned</p>
              </div>
            </div>
          </div>
        </div>

        <div class="col s12 m6 l3">
          <div class="custom-card stat-card orange">
            <div class="stat-content">
              <div class="stat-icon">
                <Gift :size="48" />
              </div>
              <div class="stat-info">
                <h3>{{ totalRedeemed.toLocaleString() }}</h3>
                <p>Total Redeemed</p>
              </div>
            </div>
          </div>
        </div>

        <div class="col s12 m6 l3">
          <div class="custom-card stat-card purple">
            <div class="stat-content">
              <div class="stat-icon">
                <Clock :size="48" />
              </div>
              <div class="stat-info">
                <h3>{{ pointsExpiringSoon.toLocaleString() }}</h3>
                <p>Expiring Soon</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div class="row dashboard-content">
        <!-- Left Column -->
        <div class="col s12 l8">
          <!-- Milestone Progress -->
          <div class="custom-card milestone-card" v-if="milestoneProgress">
            <div class="card-header">
              <h5>
                <Flag :size="24" />
                Next Milestone
              </h5>
            </div>
            
            <div class="milestone-content">
              <div class="milestone-info">
                <span class="current-points">{{ milestoneProgress.current.toLocaleString() }}</span>
                <span class="target-points">/ {{ milestoneProgress.target.toLocaleString() }} points</span>
              </div>
              
              <div class="progress-container">
                <div class="progress">
                  <div 
                    class="determinate" 
                    :style="{ width: milestoneProgress.progress + '%' }"
                  ></div>
                </div>
                <span class="progress-text">{{ milestoneProgress.progress.toFixed(1) }}% complete</span>
              </div>
              
              <p class="remaining-text">
                <TrendingUp :size="16" />
                {{ milestoneProgress.remaining.toLocaleString() }} points to go!
              </p>
            </div>
          </div>

          <!-- Recent Transactions -->
          <div class="custom-card transactions-card">
            <div class="card-header">
              <h5>
                <History :size="24" />
                Recent Activity
              </h5>
              <router-link to="/loyalty/history" class="btn-flat waves-effect">
                View All
                <ArrowRight :size="20" class="right-icon" />
              </router-link>
            </div>

            <div class="transactions-list" v-if="recentTransactions.length > 0">
              <div 
                v-for="transaction in recentTransactions" 
                :key="transaction.id"
                class="transaction-item"
              >
                <div class="transaction-icon">
                  <component 
                    :is="getTransactionIcon(transaction.type)"
                    :size="18"
                    :class="getTransactionColor(transaction.type)"
                  />
                </div>
                
                <div class="transaction-info">
                  <div class="transaction-description">
                    {{ formatTransactionDescription(transaction) }}
                  </div>
                  <div class="transaction-date">
                    {{ formatDate(transaction.createdAt) }}
                  </div>
                </div>
                
                <div class="transaction-points" :class="getPointsClass(transaction.points)">
                  {{ transaction.points > 0 ? '+' : '' }}{{ transaction.points.toLocaleString() }}
                </div>
              </div>
            </div>

            <div v-else class="empty-state">
              <History :size="64" />
              <p>No transactions yet</p>
              <p>Start shopping to earn your first points!</p>
            </div>
          </div>
        </div>

        <!-- Right Column -->
        <div class="col s12 l4">
          <!-- How to Earn Points -->
          <div class="custom-card earn-points-card">
            <div class="card-header">
              <h5>
                <Lightbulb :size="24" />
                How to Earn Points
              </h5>
            </div>

            <div class="earn-methods">
              <div class="earn-item">
                <div class="earn-icon">
                  <ShoppingBag :size="20" />
                </div>
                <div class="earn-info">
                  <h6>Shop & Earn</h6>
                  <p>Get {{ (earnRate * 100).toFixed(0) }} point per $1 spent</p>
                </div>
              </div>

              <div class="earn-item">
                <div class="earn-icon">
                  <MessageSquare :size="20" />
                </div>
                <div class="earn-info">
                  <h6>Write Reviews</h6>
                  <p>Earn 50 points for each review</p>
                </div>
              </div>

              <div class="earn-item">
                <div class="earn-icon">
                  <Gift :size="20" />
                </div>
                <div class="earn-info">
                  <h6>Special Bonuses</h6>
                  <p>Watch for promotional offers</p>
                </div>
              </div>
            </div>
          </div>

          <!-- Quick Actions -->
          <div class="custom-card quick-actions-card">
            <div class="card-header">
              <h5>
                <Zap :size="24" />
                Quick Actions
              </h5>
            </div>

            <div class="quick-actions">
              <router-link 
                to="/loyalty/redeem" 
                class="btn btn-primary waves-effect waves-light action-btn"
              >
                <Gift :size="20" class="left-icon" />
                Redeem Points
              </router-link>

              <router-link 
                to="/loyalty/history" 
                class="btn btn-secondary waves-effect waves-light action-btn"
              >
                <History :size="20" class="left-icon" />
                View History
              </router-link>

              <router-link 
                to="/products" 
                class="btn btn-flat waves-effect action-btn"
              >
                <ShoppingCart :size="20" class="left-icon" />
                Start Shopping
              </router-link>
            </div>
          </div>

          <!-- Points Calculator -->
          <div class="custom-card calculator-card">
            <div class="card-header">
              <h5>
                <Calculator :size="24" />
                Points Calculator
              </h5>
            </div>

            <div class="calculator-content">
              <div class="input-field">
                <DollarSign :size="20" class="prefix" />
                <input 
                  id="order-amount" 
                  type="number" 
                  v-model.number="calculatorAmount"
                  min="0"
                  step="0.01"
                  @input="calculatePoints"
                >
                <label for="order-amount">Order Amount</label>
              </div>

              <div class="calculation-result" v-if="calculatorAmount > 0">
                <div class="result-item">
                  <span class="label">You'll earn:</span>
                  <span class="value">{{ calculatedPoints }} points</span>
                </div>
                <div class="result-item" v-if="calculatorAmount < 10">
                  <small class="helper-text orange-text">
                    Minimum $10 order required to earn points
                  </small>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useLoyaltyStore } from '@/stores/loyalty'
import { useToast } from 'vue-toastification'
import { formatDate } from '@/utils/formatters'

// Lucide Vue Icons
import { 
  Star, RotateCcw, Wallet, TrendingUp, Gift, Clock, Flag, 
  History, ArrowRight, Lightbulb, ShoppingBag, MessageSquare,
  Zap, ShoppingCart, Calculator, DollarSign, Plus, Minus,
  Check, X, AlertCircle, Package
} from 'lucide-vue-next'

const loyaltyStore = useLoyaltyStore()
const toast = useToast()

// Local state
const loading = ref(false)
const calculatorAmount = ref(0)
const calculatedPoints = ref(0)

// Computed properties
const currentBalance = computed(() => loyaltyStore.currentBalance)
const totalEarned = computed(() => loyaltyStore.totalEarned)
const totalRedeemed = computed(() => loyaltyStore.totalRedeemed)
const pointsExpiringSoon = computed(() => loyaltyStore.pointsExpiringSoon)
const earnRate = computed(() => loyaltyStore.earnRate)
const recentTransactions = computed(() => loyaltyStore.summary?.recentTransactions || [])
const milestoneProgress = computed(() => loyaltyStore.getMilestoneProgress())

// Methods
const refreshData = async () => {
  loading.value = true
  try {
    await loyaltyStore.fetchSummary()
    toast.success('Data refreshed!')
  } catch (error) {
    toast.error('Failed to refresh data')
  } finally {
    loading.value = false
  }
}

const calculatePoints = async () => {
  if (calculatorAmount.value > 0) {
    try {
      const result = await loyaltyStore.calculatePoints(calculatorAmount.value)
      calculatedPoints.value = result.pointsToEarn
    } catch (error) {
      calculatedPoints.value = 0
    }
  } else {
    calculatedPoints.value = 0
  }
}

// Transaction icon mapping
const getTransactionIcon = (type) => {
  const iconMap = {
    EARN: Plus,
    REDEEM: Minus,
    PURCHASE: ShoppingCart,
    REVIEW: MessageSquare,
    BONUS: Gift,
    EXPIRY: Clock,
    REFUND: RotateCcw,
    ADJUSTMENT: AlertCircle
  }
  return iconMap[type] || Package
}

const getTransactionColor = (type) => {
  const colorMap = {
    EARN: 'green-text',
    PURCHASE: 'green-text',
    REVIEW: 'blue-text',
    BONUS: 'blue-text',
    REDEEM: 'orange-text',
    EXPIRY: 'red-text',
    REFUND: 'grey-text',
    ADJUSTMENT: 'grey-text'
  }
  return colorMap[type] || 'grey-text'
}

const formatTransactionDescription = (transaction) => {
  return loyaltyStore.formatTransactionDescription(transaction)
}

const getPointsClass = (points) => {
  return points > 0 ? 'positive-points' : 'negative-points'
}

// Lifecycle
onMounted(async () => {
  await loyaltyStore.initialize()
})
</script>

<style scoped lang="scss">
@import '@/assets/styles/variables';

// Icon positioning helper classes
.left-icon {
  margin-right: 8px;
}

.right-icon {
  margin-left: 8px;
}

.prefix {
  color: $primary-color;
  margin-right: 10px;
  margin-top: 10px;
}

.loyalty-dashboard {
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
    color: $primary-color;
    
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
      display: flex;
      align-items: center;
      gap: 8px;
      
      &:hover {
        background: rgba($primary-color, 0.1);
      }
      
      .spinning {
        animation: spin 1s linear infinite;
      }
    }
  }
}

.points-summary {
  margin-bottom: $spacing-xl;
  
  .stat-card {
    min-height: 120px;
    color: white;
    border-radius: $border-radius-lg;
    transition: transform 0.3s ease, box-shadow 0.3s ease;
    
    &:hover {
      transform: translateY(-4px);
      box-shadow: $shadow-lg;
    }
    
    &.blue {
      background: linear-gradient(135deg, #2196F3, #1976D2);
    }
    
    &.green {
      background: linear-gradient(135deg, #4CAF50, #2E7D32);
    }
    
    &.orange {
      background: linear-gradient(135deg, #FF9800, #F57C00);
    }
    
    &.purple {
      background: linear-gradient(135deg, #9C27B0, #7B1FA2);
    }
    
    .stat-content {
      display: flex;
      align-items: center;
      gap: $spacing-md;
      height: 100%;
      
      .stat-icon {
        opacity: 0.8;
      }
      
      .stat-info {
        h3 {
          margin: 0 0 $spacing-xs;
          font-size: 2rem;
          font-weight: 700;
        }
        
        p {
          margin: 0;
          font-size: 0.9rem;
          opacity: 0.9;
        }
      }
    }
  }
}

.milestone-card {
  .milestone-content {
    .milestone-info {
      display: flex;
      align-items: baseline;
      gap: $spacing-xs;
      margin-bottom: $spacing-md;
      
      .current-points {
        font-size: 1.5rem;
        font-weight: 600;
        color: $primary-color;
      }
      
      .target-points {
        color: #6c757d;
        font-size: 1rem;
      }
    }
    
    .progress-container {
      margin-bottom: $spacing-md;
      
      .progress {
        height: 8px;
        border-radius: 4px;
        background-color: #e0e0e0;
        
        .determinate {
          background-color: $primary-color;
          border-radius: 4px;
          transition: width 0.3s ease;
        }
      }
      
      .progress-text {
        display: block;
        text-align: right;
        font-size: 0.85rem;
        color: #6c757d;
        margin-top: $spacing-xs;
      }
    }
    
    .remaining-text {
      color: $primary-color;
      font-weight: 500;
      display: flex;
      align-items: center;
      gap: $spacing-xs;
      margin: 0;
    }
  }
}

.transactions-card {
  .transactions-list {
    .transaction-item {
      display: flex;
      align-items: center;
      padding: $spacing-md 0;
      border-bottom: 1px solid #f0f0f0;
      
      &:last-child {
        border-bottom: none;
      }
      
      .transaction-icon {
        margin-right: $spacing-md;
        width: 40px;
        height: 40px;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        
        &.green-text {
          background: rgba($success-color, 0.1);
          color: $success-color;
        }
        
        &.blue-text {
          background: rgba($primary-color, 0.1);
          color: $primary-color;
        }
        
        &.orange-text {
          background: rgba($warning-color, 0.1);
          color: $warning-color;
        }
        
        &.red-text {
          background: rgba($error-color, 0.1);
          color: $error-color;
        }
        
        &.grey-text {
          background: rgba(#9e9e9e, 0.1);
          color: #9e9e9e;
        }
      }
      
      .transaction-info {
        flex: 1;
        
        .transaction-description {
          font-weight: 500;
          color: #2c3e50;
          margin-bottom: 2px;
        }
        
        .transaction-date {
          font-size: 0.85rem;
          color: #6c757d;
        }
      }
      
      .transaction-points {
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
  }
  
  .empty-state {
    text-align: center;
    padding: $spacing-xl;
    color: #6c757d;
    
    > * {
      margin-bottom: $spacing-md;
      opacity: 0.5;
    }
    
    p {
      margin: $spacing-xs 0;
    }
  }
}

.earn-points-card {
  .earn-methods {
    .earn-item {
      display: flex;
      align-items: center;
      gap: $spacing-md;
      padding: $spacing-md 0;
      border-bottom: 1px solid #f0f0f0;
      
      &:last-child {
        border-bottom: none;
      }
      
      .earn-icon {
        width: 40px;
        height: 40px;
        border-radius: 50%;
        background: rgba($primary-color, 0.1);
        color: $primary-color;
        display: flex;
        align-items: center;
        justify-content: center;
      }
      
      .earn-info {
        h6 {
          margin: 0 0 $spacing-xs;
          font-weight: 600;
          color: #2c3e50;
        }
        
        p {
          margin: 0;
          font-size: 0.9rem;
          color: #6c757d;
        }
      }
    }
  }
}

.quick-actions-card {
  .quick-actions {
    display: flex;
    flex-direction: column;
    gap: $spacing-md;
    
    .action-btn {
      width: 100%;
      text-align: left;
      display: flex;
      align-items: center;
    }
  }
}

.calculator-card {
  .calculator-content {
    .input-field {
      margin-bottom: $spacing-lg;
      position: relative;
      display: flex;
      align-items: center;
      
      input {
        flex: 1;
        margin-left: 40px;
      }
      
      .prefix {
        position: absolute;
        left: 10px;
        z-index: 1;
      }
    }
    
    .calculation-result {
      background: #f8f9fa;
      border-radius: $border-radius-md;
      padding: $spacing-md;
      
      .result-item {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: $spacing-xs;
        
        &:last-child {
          margin-bottom: 0;
        }
        
        .label {
          color: #6c757d;
        }
        
        .value {
          font-weight: 600;
          color: $primary-color;
          font-size: 1.1rem;
        }
      }
    }
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
    
    > * {
      color: $primary-color;
    }
  }
  
  .btn-flat {
    color: $primary-color;
    font-weight: 500;
    display: flex;
    align-items: center;
    
    &:hover {
      background: rgba($primary-color, 0.1);
    }
  }
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

// Responsive Design
@media (max-width: $tablet) {
  .header-content {
    flex-direction: column;
    gap: $spacing-md;
    text-align: center;
  }
  
  .stat-card {
    margin-bottom: $spacing-md;
    
    .stat-content {
      .stat-info {
        h3 {
          font-size: 1.5rem;
        }
      }
    }
  }
  
  .card-header {
    flex-direction: column;
    align-items: flex-start;
    gap: $spacing-sm;
  }
}

@media (max-width: $mobile) {
  .loyalty-dashboard {
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
    }
  }
  
  .custom-card {
    margin-bottom: $spacing-lg;
    padding: $spacing-lg;
  }
  
  .stat-card {
    .stat-content {
      flex-direction: column;
      text-align: center;
      gap: $spacing-sm;
      
      .stat-info {
        h3 {
          font-size: 1.8rem;
        }
      }
    }
  }
}
</style>