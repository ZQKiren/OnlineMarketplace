<!-- src/views/loyalty/LoyaltyRedeem.vue -->
<template>
  <div class="loyalty-redeem">
    <div class="container">
      <!-- Page Header -->
      <div class="page-header">
        <div class="header-content">
          <div class="header-info">
            <i class="material-icons">redeem</i>
            <div class="header-text">
              <h4>Redeem Points</h4>
              <p>Exchange your points for amazing rewards and discounts</p>
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

      <!-- Points Balance -->
      <div class="points-balance-card">
        <div class="custom-card balance-card">
          <div class="balance-content">
            <div class="balance-info">
              <div class="balance-icon">
                <i class="material-icons">account_balance_wallet</i>
              </div>
              <div class="balance-details">
                <h3>{{ currentBalance.toLocaleString() }}</h3>
                <p>Available Points</p>
              </div>
            </div>
            
            <div class="balance-actions">
              <router-link to="/loyalty/history" class="btn btn-flat waves-effect">
                <i class="material-icons left">history</i>
                View History
              </router-link>
            </div>
          </div>
        </div>
      </div>

      <!-- Redemption Calculator -->
      <div class="custom-card calculator-card">
        <div class="card-header">
          <h5>
            <i class="material-icons">calculate</i>
            Discount Calculator
          </h5>
        </div>

        <div class="calculator-content">
          <div class="row">
            <div class="col s12 m6">
              <div class="input-field">
                <i class="material-icons prefix">attach_money</i>
                <input 
                  id="order-value" 
                  type="number" 
                  v-model.number="orderValue"
                  min="0"
                  step="0.01"
                  @input="updateCalculations"
                >
                <label for="order-value">Order Value</label>
                <span class="helper-text">Enter your expected order amount</span>
              </div>
            </div>

            <div class="col s12 m6" v-if="orderValue > 0">
              <div class="calculation-results">
                <div class="result-header">
                  <h6>Available Discounts:</h6>
                </div>
                <div class="result-list">
                  <div 
                    v-for="discount in calculatedDiscounts" 
                    :key="discount.id"
                    class="discount-preview"
                  >
                    <span class="discount-type">{{ getDiscountText(discount) }}</span>
                    <span class="discount-cost">{{ discount.pointsCost }} pts</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Redemption Categories -->
      <div class="custom-card categories-card">
        <div class="card-header">
          <h5>
            <i class="material-icons">category</i>
            Redemption Categories
          </h5>
        </div>

        <div class="category-filters">
          <div class="chip-container">
            <div 
              class="chip filter-chip"
              :class="{ active: selectedCategory === 'all' }"
              @click="filterByCategory('all')"
            >
              All Rewards
            </div>
            <div 
              class="chip filter-chip"
              :class="{ active: selectedCategory === 'PERCENTAGE' }"
              @click="filterByCategory('PERCENTAGE')"
            >
              Percentage Off
            </div>
            <div 
              class="chip filter-chip"
              :class="{ active: selectedCategory === 'FIXED_AMOUNT' }"
              @click="filterByCategory('FIXED_AMOUNT')"
            >
              Fixed Amount
            </div>
            <div 
              class="chip filter-chip"
              :class="{ active: selectedCategory === 'FREE_SHIPPING' }"
              @click="filterByCategory('FREE_SHIPPING')"
            >
              Free Shipping
            </div>
          </div>
        </div>
      </div>

      <!-- Redemption Options -->
      <div class="redemptions-grid">
        <div 
          v-for="redemption in filteredRedemptions" 
          :key="redemption.id"
          class="redemption-card"
          :class="{ 
            'available': canUseRedemption(redemption), 
            'unavailable': !canUseRedemption(redemption) 
          }"
        >
          <div class="card-ribbon" v-if="redemption.discountType === 'FREE_SHIPPING'">
            <span>Popular</span>
          </div>

          <div class="redemption-header">
            <div class="redemption-icon">
              <i class="material-icons">{{ getRedemptionIcon(redemption.discountType) }}</i>
            </div>
            <div class="redemption-title">
              <h5>{{ redemption.title }}</h5>
              <div class="discount-badge">
                {{ getDiscountText(redemption) }}
              </div>
            </div>
          </div>

          <div class="redemption-body">
            <p class="redemption-description">{{ redemption.description }}</p>
            
            <div class="redemption-details">
              <div class="detail-item">
                <i class="material-icons tiny">stars</i>
                <span><strong>{{ redemption.pointsCost.toLocaleString() }}</strong> points</span>
              </div>
              
              <div class="detail-item" v-if="redemption.minOrderValue">
                <i class="material-icons tiny">shopping_cart</i>
                <span>Min. order: <strong>${{ redemption.minOrderValue }}</strong></span>
              </div>
              
              <div class="detail-item" v-if="redemption.maxUses">
                <i class="material-icons tiny">people</i>
                <span>{{ redemption.usageCount }}/{{ redemption.maxUses }} used</span>
              </div>
              
              <div class="detail-item" v-if="redemption.validUntil">
                <i class="material-icons tiny">schedule</i>
                <span>Expires: {{ formatDate(redemption.validUntil) }}</span>
              </div>
            </div>

            <div class="usage-progress" v-if="redemption.maxUses">
              <div class="progress">
                <div 
                  class="determinate" 
                  :style="{ width: (redemption.usageCount / redemption.maxUses * 100) + '%' }"
                ></div>
              </div>
              <span class="progress-text">
                {{ Math.max(0, redemption.maxUses - redemption.usageCount) }} remaining
              </span>
            </div>
          </div>

          <div class="redemption-footer">
            <button 
              @click="openRedeemModal(redemption)"
              class="btn waves-effect waves-light redeem-btn"
              :class="{ 
                'btn-primary': canUseRedemption(redemption),
                'disabled': !canUseRedemption(redemption)
              }"
              :disabled="!canUseRedemption(redemption)"
            >
              <i class="material-icons left">redeem</i>
              {{ canUseRedemption(redemption) ? 'Redeem Now' : getUnavailableReason(redemption) }}
            </button>
          </div>
        </div>
      </div>

      <!-- Empty State -->
      <div v-if="filteredRedemptions.length === 0" class="empty-state">
        <i class="material-icons">search</i>
        <h5>No redemptions found</h5>
        <p>Try adjusting your category filter or check back later for new rewards.</p>
      </div>

      <!-- Redeem Modal -->
      <div id="redeem-modal" class="modal modal-fixed-footer">
        <div class="modal-content" v-if="selectedRedemption">
          <h4>
            <i class="material-icons">redeem</i>
            Confirm Redemption
          </h4>
          
          <div class="redemption-summary">
            <div class="summary-card">
              <div class="summary-header">
                <h5>{{ selectedRedemption.title }}</h5>
                <div class="discount-badge large">
                  {{ getDiscountText(selectedRedemption) }}
                </div>
              </div>
              
              <p class="summary-description">{{ selectedRedemption.description }}</p>
              
              <div class="summary-details">
                <div class="detail-row">
                  <span class="label">Points Required:</span>
                  <span class="value">{{ selectedRedemption.pointsCost.toLocaleString() }}</span>
                </div>
                
                <div class="detail-row">
                  <span class="label">Your Balance:</span>
                  <span class="value">{{ currentBalance.toLocaleString() }}</span>
                </div>
                
                <div class="detail-row" v-if="selectedRedemption.minOrderValue">
                  <span class="label">Minimum Order:</span>
                  <span class="value">${{ selectedRedemption.minOrderValue }}</span>
                </div>
                
                <div class="detail-row balance-after">
                  <span class="label">Balance After:</span>
                  <span class="value">{{ (currentBalance - selectedRedemption.pointsCost).toLocaleString() }}</span>
                </div>
              </div>
            </div>

            <div class="order-value-input" v-if="selectedRedemption.minOrderValue">
              <div class="input-field">
                <i class="material-icons prefix">attach_money</i>
                <input 
                  id="modal-order-value" 
                  type="number" 
                  v-model.number="modalOrderValue"
                  :min="selectedRedemption.minOrderValue"
                  step="0.01"
                  @input="calculateModalDiscount"
                >
                <label for="modal-order-value" class="active">Order Value</label>
                <span class="helper-text">
                  Minimum: ${{ selectedRedemption.minOrderValue }}
                </span>
              </div>
              
              <div class="discount-preview" v-if="modalOrderValue >= (selectedRedemption.minOrderValue || 0)">
                <div class="preview-card">
                  <h6>Discount Preview</h6>
                  <div class="preview-calculation">
                    <div class="calc-row">
                      <span>Order Value:</span>
                      <span>${{ modalOrderValue.toFixed(2) }}</span>
                    </div>
                    <div class="calc-row discount">
                      <span>Discount:</span>
                      <span>-${{ calculatedDiscount.toFixed(2) }}</span>
                    </div>
                    <div class="calc-row total">
                      <span>Final Total:</span>
                      <span>${{ (modalOrderValue - calculatedDiscount).toFixed(2) }}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        <div class="modal-footer">
          <button 
            @click="closeRedeemModal" 
            class="btn-flat waves-effect modal-close"
          >
            Cancel
          </button>
          
          <button 
            @click="confirmRedemption"
            class="btn btn-primary waves-effect"
            :disabled="redeeming || !isValidRedemption"
          >
            <i class="material-icons left">{{ redeeming ? 'hourglass_empty' : 'check' }}</i>
            {{ redeeming ? 'Processing...' : 'Confirm Redemption' }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, nextTick, watch } from 'vue'
import { useLoyaltyStore } from '@/stores/loyalty'
import { useToast } from 'vue-toastification'
import { formatDate } from '@/utils/formatters'
import dayjs from 'dayjs'

const loyaltyStore = useLoyaltyStore()
const toast = useToast()

// Local state
const loading = ref(false)
const redeeming = ref(false)
const selectedCategory = ref('all')
const orderValue = ref(0)
const selectedRedemption = ref(null)
const modalOrderValue = ref(0)
const calculatedDiscount = ref(0)

// Modal instance
let modalInstance = null

// Computed properties
const currentBalance = computed(() => loyaltyStore.currentBalance)
const redemptions = computed(() => loyaltyStore.redemptions)

const filteredRedemptions = computed(() => {
  if (selectedCategory.value === 'all') {
    return redemptions.value
  }
  return redemptions.value.filter(r => r.discountType === selectedCategory.value)
})

const calculatedDiscounts = computed(() => {
  if (orderValue.value <= 0) return []
  
  return redemptions.value
    .filter(r => canUseRedemption(r, orderValue.value))
    .sort((a, b) => a.pointsCost - b.pointsCost)
    .slice(0, 3) // Show top 3 applicable discounts
})

const isValidRedemption = computed(() => {
  if (!selectedRedemption.value) return false
  
  if (selectedRedemption.value.minOrderValue) {
    return modalOrderValue.value >= selectedRedemption.value.minOrderValue
  }
  
  return true
})

// Methods
const filterByCategory = (category) => {
  selectedCategory.value = category
}

const canUseRedemption = (redemption, checkOrderValue = 0) => {
  return loyaltyStore.canUseRedemption(redemption, checkOrderValue)
}

const getUnavailableReason = (redemption) => {
  if (redemption.pointsCost > currentBalance.value) {
    return 'Insufficient Points'
  }
  
  const now = new Date()
  if (redemption.validFrom && new Date(redemption.validFrom) > now) {
    return 'Not Yet Available'
  }
  
  if (redemption.validUntil && new Date(redemption.validUntil) < now) {
    return 'Expired'
  }
  
  if (redemption.maxUses && redemption.usageCount >= redemption.maxUses) {
    return 'Limit Reached'
  }
  
  if (!redemption.isActive) {
    return 'Inactive'
  }
  
  return 'Unavailable'
}

const getDiscountText = (redemption) => {
  return loyaltyStore.getDiscountText(redemption)
}

const getRedemptionIcon = (discountType) => {
  const icons = {
    'PERCENTAGE': 'percent',
    'FIXED_AMOUNT': 'attach_money',
    'FREE_SHIPPING': 'local_shipping'
  }
  return icons[discountType] || 'redeem'
}

const updateCalculations = () => {
  // Calculations are handled by computed properties
}

const openRedeemModal = (redemption) => {
  if (!canUseRedemption(redemption)) {
    toast.warning(getUnavailableReason(redemption))
    return
  }
  
  selectedRedemption.value = redemption
  modalOrderValue.value = redemption.minOrderValue || 0
  calculateModalDiscount()
  
  nextTick(() => {
    if (modalInstance) {
      modalInstance.open()
    }
  })
}

const closeRedeemModal = () => {
  if (modalInstance) {
    modalInstance.close()
  }
  
  selectedRedemption.value = null
  modalOrderValue.value = 0
  calculatedDiscount.value = 0
}

const calculateModalDiscount = () => {
  if (!selectedRedemption.value || modalOrderValue.value <= 0) {
    calculatedDiscount.value = 0
    return
  }
  
  const redemption = selectedRedemption.value
  let discount = 0
  
  if (redemption.discountType === 'PERCENTAGE') {
    discount = (modalOrderValue.value * (redemption.discountValue || 0)) / 100
  } else if (redemption.discountType === 'FIXED_AMOUNT') {
    discount = redemption.discountValue || 0
  } else if (redemption.discountType === 'FREE_SHIPPING') {
    discount = 10 // Assume $10 shipping cost
  }
  
  // Ensure discount doesn't exceed order value
  calculatedDiscount.value = Math.min(discount, modalOrderValue.value)
}

const confirmRedemption = async () => {
  if (!selectedRedemption.value || !isValidRedemption.value) {
    toast.error('Please check all requirements')
    return
  }
  
  redeeming.value = true
  
  try {
    await loyaltyStore.redeemPoints(
      selectedRedemption.value.id, 
      modalOrderValue.value || 0
    )
    
    toast.success('Points redeemed successfully!')
    closeRedeemModal()
    
    // Refresh data
    await loyaltyStore.fetchSummary()
    await loyaltyStore.fetchRedemptions()
    
  } catch (error) {
    console.error('Error redeeming points:', error)
    toast.error('Failed to redeem points. Please try again.')
  } finally {
    redeeming.value = false
  }
}

// Lifecycle
onMounted(async () => {
  await loyaltyStore.initialize()
  
  // Initialize Materialize modal
  nextTick(() => {
    const modalEl = document.querySelector('#redeem-modal')
    if (modalEl && window.M?.Modal) {
      modalInstance = window.M.Modal.init(modalEl, {
        dismissible: true,
        onCloseEnd: () => {
          selectedRedemption.value = null
          modalOrderValue.value = 0
          calculatedDiscount.value = 0
        }
      })
    }
  })
})

// Watch for redemption selection changes
watch(selectedRedemption, (newRedemption) => {
  if (newRedemption && newRedemption.minOrderValue) {
    modalOrderValue.value = newRedemption.minOrderValue
    calculateModalDiscount()
  }
})
</script>

<style scoped lang="scss">
@import '@/assets/styles/variables';

.loyalty-redeem {
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

.points-balance-card {
  margin-bottom: $spacing-xl;
  
  .balance-card {
    background: linear-gradient(135deg, $primary-color, #1565c0);
    color: white;
    
    .balance-content {
      display: flex;
      justify-content: space-between;
      align-items: center;
      
      .balance-info {
        display: flex;
        align-items: center;
        gap: $spacing-md;
        
        .balance-icon {
          i {
            font-size: 3rem;
            opacity: 0.8;
          }
        }
        
        .balance-details {
          h3 {
            margin: 0 0 $spacing-xs;
            font-size: 2.5rem;
            font-weight: 700;
          }
          
          p {
            margin: 0;
            font-size: 1.1rem;
            opacity: 0.9;
          }
        }
      }
      
      .balance-actions {
        .btn-flat {
          color: white;
          border: 1px solid rgba(255, 255, 255, 0.3);
          
          &:hover {
            background: rgba(255, 255, 255, 0.1);
          }
        }
      }
    }
  }
}

.calculator-card {
  margin-bottom: $spacing-xl;
  
  .calculator-content {
    .input-field {
      .prefix {
        color: $primary-color;
      }
    }
    
    .calculation-results {
      .result-header {
        h6 {
          margin: 0 0 $spacing-md;
          color: #2c3e50;
          font-weight: 600;
        }
      }
      
      .result-list {
        .discount-preview {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: $spacing-sm $spacing-md;
          background: #f8f9fa;
          border-radius: $border-radius-sm;
          margin-bottom: $spacing-sm;
          
          &:last-child {
            margin-bottom: 0;
          }
          
          .discount-type {
            font-weight: 500;
            color: #2c3e50;
          }
          
          .discount-cost {
            color: $primary-color;
            font-weight: 600;
          }
        }
      }
    }
  }
}

.categories-card {
  margin-bottom: $spacing-xl;
  
  .category-filters {
    .chip-container {
      display: flex;
      flex-wrap: wrap;
      gap: $spacing-sm;
      
      .filter-chip {
        cursor: pointer;
        transition: all 0.3s ease;
        
        &:hover {
          background-color: rgba($primary-color, 0.1);
        }
        
        &.active {
          background-color: $primary-color;
          color: white;
        }
      }
    }
  }
}

.redemptions-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
  gap: $spacing-lg;
  margin-bottom: $spacing-xl;
}

.redemption-card {
  background: white;
  border-radius: $border-radius-lg;
  box-shadow: $shadow-md;
  transition: all 0.3s ease;
  position: relative;
  overflow: hidden;
  
  &.available {
    &:hover {
      transform: translateY(-4px);
      box-shadow: $shadow-lg;
    }
  }
  
  &.unavailable {
    opacity: 0.6;
    
    .redemption-header,
    .redemption-body {
      filter: grayscale(50%);
    }
  }
  
  .card-ribbon {
    position: absolute;
    top: 15px;
    right: -30px;
    background: $warning-color;
    color: white;
    padding: 4px 40px;
    font-size: 0.8rem;
    font-weight: 600;
    transform: rotate(45deg);
    z-index: 2;
    
    span {
      display: block;
    }
  }
  
  .redemption-header {
    padding: $spacing-lg;
    border-bottom: 1px solid #f0f0f0;
    
    .redemption-icon {
      width: 60px;
      height: 60px;
      border-radius: 50%;
      background: rgba($primary-color, 0.1);
      display: flex;
      align-items: center;
      justify-content: center;
      margin-bottom: $spacing-md;
      
      i {
        font-size: 2rem;
        color: $primary-color;
      }
    }
    
    .redemption-title {
      h5 {
        margin: 0 0 $spacing-sm;
        color: #2c3e50;
        font-weight: 600;
      }
      
      .discount-badge {
        background: $primary-color;
        color: white;
        padding: 4px 12px;
        border-radius: 20px;
        font-size: 0.85rem;
        font-weight: 600;
        display: inline-block;
        
        &.large {
          padding: 8px 16px;
          font-size: 1rem;
        }
      }
    }
  }
  
  .redemption-body {
    padding: $spacing-lg;
    
    .redemption-description {
      color: #6c757d;
      margin-bottom: $spacing-md;
      line-height: 1.5;
    }
    
    .redemption-details {
      margin-bottom: $spacing-md;
      
      .detail-item {
        display: flex;
        align-items: center;
        gap: $spacing-sm;
        margin-bottom: $spacing-sm;
        font-size: 0.9rem;
        color: #495057;
        
        &:last-child {
          margin-bottom: 0;
        }
        
        i {
          color: $primary-color;
        }
      }
    }
    
    .usage-progress {
      .progress {
        height: 6px;
        border-radius: 3px;
        background-color: #e0e0e0;
        margin-bottom: $spacing-xs;
        
        .determinate {
          background-color: $warning-color;
          border-radius: 3px;
        }
      }
      
      .progress-text {
        font-size: 0.8rem;
        color: #6c757d;
      }
    }
  }
  
  .redemption-footer {
    padding: $spacing-lg;
    border-top: 1px solid #f0f0f0;
    
    .redeem-btn {
      width: 100%;
      
      &.disabled {
        background-color: #e0e0e0 !important;
        color: #9e9e9e !important;
        cursor: not-allowed;
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

.modal {
  max-height: 90%;
  
  .modal-content {
    .redemption-summary {
      .summary-card {
        background: #f8f9fa;
        border-radius: $border-radius-md;
        padding: $spacing-lg;
        margin-bottom: $spacing-lg;
        
        .summary-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: $spacing-md;
          
          h5 {
            margin: 0;
            color: #2c3e50;
          }
        }
        
        .summary-description {
          color: #6c757d;
          margin-bottom: $spacing-md;
        }
        
        .summary-details {
          .detail-row {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: $spacing-sm;
            
            &:last-child {
              margin-bottom: 0;
            }
            
            &.balance-after {
              border-top: 1px solid #e9ecef;
              padding-top: $spacing-sm;
              font-weight: 600;
              
              .value {
                color: $primary-color;
              }
            }
            
            .label {
              color: #6c757d;
            }
            
            .value {
              color: #2c3e50;
              font-weight: 500;
            }
          }
        }
      }
      
      .order-value-input {
        .input-field {
          margin-bottom: $spacing-lg;
          
          .prefix {
            color: $primary-color;
          }
        }
        
        .discount-preview {
          .preview-card {
            background: #e8f5e8;
            border-radius: $border-radius-md;
            padding: $spacing-md;
            
            h6 {
              margin: 0 0 $spacing-md;
              color: #2c3e50;
              font-weight: 600;
            }
            
            .preview-calculation {
              .calc-row {
                display: flex;
                justify-content: space-between;
                align-items: center;
                margin-bottom: $spacing-xs;
                
                &:last-child {
                  margin-bottom: 0;
                }
                
                &.discount {
                  color: $success-color;
                  font-weight: 500;
                }
                
                &.total {
                  border-top: 1px solid #c3e6c3;
                  padding-top: $spacing-xs;
                  font-weight: 600;
                  font-size: 1.1rem;
                  color: #2c3e50;
                }
              }
            }
          }
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
    
    i {
      color: $primary-color;
      font-size: 1.5rem;
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
  
  .balance-content {
    flex-direction: column;
    text-align: center;
    gap: $spacing-md;
  }
  
  .redemptions-grid {
    grid-template-columns: 1fr;
  }
  
  .category-filters {
    .chip-container {
      justify-content: center;
    }
  }
}

@media (max-width: $mobile) {
  .loyalty-redeem {
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
  
  .balance-details {
    h3 {
      font-size: 2rem;
    }
  }
  
  .redemption-card {
    .redemption-header {
      padding: $spacing-md;
      
      .redemption-icon {
        width: 50px;
        height: 50px;
        
        i {
          font-size: 1.5rem;
        }
      }
    }
    
    .redemption-body,
    .redemption-footer {
      padding: $spacing-md;
    }
  }
  
  .modal {
    .modal-content {
      .summary-card {
        padding: $spacing-md;
      }
    }
  }
}</style>