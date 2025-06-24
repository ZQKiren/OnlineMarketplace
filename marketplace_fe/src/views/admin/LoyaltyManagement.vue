<!-- src/views/admin/LoyaltyManagement.vue -->
<template>
  <div class="admin-loyalty-management">
    <div class="container">
      <!-- Page Header -->
      <div class="page-header">
        <div class="header-content">
          <div class="header-info">
            <i class="material-icons">stars</i>
            <div class="header-text">
              <h4>Loyalty Management</h4>
              <p>Manage loyalty points system, redemptions, and analytics</p>
            </div>
          </div>
          <div class="header-actions">
            <button 
              @click="refreshAllData" 
              class="btn-flat waves-effect"
              :disabled="loading"
            >
              <i class="material-icons" :class="{ spinning: loading }">refresh</i>
              Refresh
            </button>
          </div>
        </div>
      </div>

      <!-- Analytics Overview -->
      <div class="row analytics-section">
        <div class="col s12 m6 l3">
          <div class="custom-card stat-card blue">
            <div class="stat-content">
              <div class="stat-icon">
                <i class="material-icons">people</i>
              </div>
              <div class="stat-info">
                <h3>{{ analytics?.totalUsers?.toLocaleString() || '0' }}</h3>
                <p>Total Users</p>
              </div>
            </div>
          </div>
        </div>

        <div class="col s12 m6 l3">
          <div class="custom-card stat-card green">
            <div class="stat-content">
              <div class="stat-icon">
                <i class="material-icons">trending_up</i>
              </div>
              <div class="stat-info">
                <h3>{{ analytics?.activeUsers?.toLocaleString() || '0' }}</h3>
                <p>Active Users</p>
              </div>
            </div>
          </div>
        </div>

        <div class="col s12 m6 l3">
          <div class="custom-card stat-card orange">
            <div class="stat-content">
              <div class="stat-icon">
                <i class="material-icons">stars</i>
              </div>
              <div class="stat-info">
                <h3>{{ analytics?.totalPointsInCirculation?.toLocaleString() || '0' }}</h3>
                <p>Points in Circulation</p>
              </div>
            </div>
          </div>
        </div>

        <div class="col s12 m6 l3">
          <div class="custom-card stat-card purple">
            <div class="stat-content">
              <div class="stat-icon">
                <i class="material-icons">assessment</i>
              </div>
              <div class="stat-info">
                <h3>{{ (analytics?.participationRate || 0).toFixed(1) }}%</h3>
                <p>Participation Rate</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div class="row main-content">
        <!-- Left Column - Management Actions -->
        <div class="col s12 l8">
          <!-- Quick Actions -->
          <div class="custom-card quick-actions-card">
            <div class="card-header">
              <h5>
                <i class="material-icons">flash_on</i>
                Quick Actions
              </h5>
            </div>

            <div class="quick-actions-grid">
              <button 
                @click="openBonusModal" 
                class="btn btn-primary waves-effect action-btn"
              >
                <i class="material-icons">card_giftcard</i>
                <span>Award Bonus</span>
              </button>

              <button 
                @click="openRedemptionModal" 
                class="btn btn-secondary waves-effect action-btn"
              >
                <i class="material-icons">add</i>
                <span>Create Redemption</span>
              </button>

              <button 
                @click="cleanupExpiredPoints" 
                class="btn btn-warning waves-effect action-btn"
                :disabled="cleaningUp"
              >
                <i class="material-icons">cleaning_services</i>
                <span>{{ cleaningUp ? 'Cleaning...' : 'Cleanup Expired' }}</span>
              </button>

              <button 
                @click="exportData" 
                class="btn btn-flat waves-effect action-btn"
              >
                <i class="material-icons">download</i>
                <span>Export Data</span>
              </button>
            </div>
          </div>

          <!-- Recent Activity -->
          <div class="custom-card activity-card">
            <div class="card-header">
              <h5>
                <i class="material-icons">timeline</i>
                Recent Activity (Last 30 Days)
              </h5>
            </div>

            <div class="activity-summary" v-if="analytics?.recentActivity">
              <div 
                v-for="activity in analytics.recentActivity" 
                :key="activity.type"
                class="activity-item"
              >
                <div class="activity-icon">
                  <i 
                    class="material-icons" 
                    :class="getActivityColor(activity.type)"
                  >
                    {{ getActivityIcon(activity.type) }}
                  </i>
                </div>
                
                <div class="activity-info">
                  <div class="activity-title">
                    {{ formatActivityType(activity.type) }}
                  </div>
                  <div class="activity-stats">
                    <span class="transactions">{{ activity._count._all }} transactions</span>
                    <span class="points">{{ (activity._sum.points || 0).toLocaleString() }} points</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- Redemptions Management -->
          <div class="custom-card redemptions-management-card">
            <div class="card-header">
              <h5>
                <i class="material-icons">redeem</i>
                Manage Redemptions
              </h5>
              <button 
                @click="openRedemptionModal" 
                class="btn btn-primary waves-effect"
              >
                <i class="material-icons left">add</i>
                New Redemption
              </button>
            </div>

            <div class="redemptions-table" v-if="redemptions.length > 0">
              <!-- Desktop Table -->
              <table class="responsive-table highlight hide-on-med-and-down">
                <thead>
                  <tr>
                    <th>Title</th>
                    <th>Type</th>
                    <th>Points Cost</th>
                    <th>Usage</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="redemption in redemptions" :key="redemption.id">
                    <td>
                      <div class="redemption-title">
                        <strong>{{ redemption.title }}</strong>
                        <small>{{ redemption.description.substring(0, 50) }}...</small>
                      </div>
                    </td>
                    <td>
                      <span class="type-badge" :class="getTypeClass(redemption.discountType)">
                        {{ formatDiscountType(redemption.discountType) }}
                      </span>
                    </td>
                    <td>
                      <strong>{{ redemption.pointsCost.toLocaleString() }}</strong>
                    </td>
                    <td>
                      <div class="usage-info">
                        <span>{{ redemption.usageCount }}</span>
                        <span v-if="redemption.maxUses">/ {{ redemption.maxUses }}</span>
                        <span v-else>/ ∞</span>
                      </div>
                    </td>
                    <td>
                      <span 
                        class="status-badge" 
                        :class="redemption.isActive ? 'delivered' : 'cancelled'"
                      >
                        {{ redemption.isActive ? 'Active' : 'Inactive' }}
                      </span>
                    </td>
                    <td>
                      <div class="action-buttons">
                        <button 
                          @click="editRedemption(redemption)" 
                          class="btn-small btn-flat waves-effect"
                          title="Edit"
                        >
                          <i class="material-icons">edit</i>
                        </button>
                        <button 
                          @click="toggleRedemptionStatus(redemption)" 
                          class="btn-small btn-flat waves-effect"
                          :title="redemption.isActive ? 'Deactivate' : 'Activate'"
                        >
                          <i class="material-icons">
                            {{ redemption.isActive ? 'visibility_off' : 'visibility' }}
                          </i>
                        </button>
                      </div>
                    </td>
                  </tr>
                </tbody>
              </table>

              <!-- Mobile Cards -->
              <div class="mobile-redemptions hide-on-large-only">
                <div 
                  v-for="redemption in redemptions" 
                  :key="redemption.id"
                  class="mobile-redemption-card"
                >
                  <div class="mobile-redemption-header">
                    <h6>{{ redemption.title }}</h6>
                    <span 
                      class="status-badge mobile" 
                      :class="redemption.isActive ? 'delivered' : 'cancelled'"
                    >
                      {{ redemption.isActive ? 'Active' : 'Inactive' }}
                    </span>
                  </div>
                  
                  <div class="mobile-redemption-body">
                    <p>{{ redemption.description }}</p>
                    
                    <div class="mobile-redemption-meta">
                      <div class="meta-row">
                        <span class="label">Type:</span>
                        <span class="type-badge" :class="getTypeClass(redemption.discountType)">
                          {{ formatDiscountType(redemption.discountType) }}
                        </span>
                      </div>
                      
                      <div class="meta-row">
                        <span class="label">Cost:</span>
                        <span>{{ redemption.pointsCost.toLocaleString() }} points</span>
                      </div>
                      
                      <div class="meta-row">
                        <span class="label">Usage:</span>
                        <span>
                          {{ redemption.usageCount }}
                          <span v-if="redemption.maxUses">/ {{ redemption.maxUses }}</span>
                          <span v-else>/ ∞</span>
                        </span>
                      </div>
                    </div>
                    
                    <div class="mobile-actions">
                      <button 
                        @click="editRedemption(redemption)" 
                        class="btn-small btn-flat waves-effect"
                      >
                        <i class="material-icons left">edit</i>
                        Edit
                      </button>
                      <button 
                        @click="toggleRedemptionStatus(redemption)" 
                        class="btn-small btn-flat waves-effect"
                      >
                        <i class="material-icons left">
                          {{ redemption.isActive ? 'visibility_off' : 'visibility' }}
                        </i>
                        {{ redemption.isActive ? 'Deactivate' : 'Activate' }}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div v-else class="empty-redemptions">
              <i class="material-icons">redeem</i>
              <p>No redemptions created yet</p>
              <button 
                @click="openRedemptionModal" 
                class="btn btn-primary waves-effect"
              >
                Create First Redemption
              </button>
            </div>
          </div>
        </div>

        <!-- Right Column - Top Redemptions & Tools -->
        <div class="col s12 l4">
          <!-- Top Redemptions -->
          <div class="custom-card top-redemptions-card">
            <div class="card-header">
              <h5>
                <i class="material-icons">trending_up</i>
                Top Redemptions
              </h5>
            </div>

            <div class="top-redemptions-list" v-if="analytics?.topRedemptions?.length > 0">
              <div 
                v-for="(redemption, index) in analytics.topRedemptions" 
                :key="redemption.id"
                class="top-redemption-item"
              >
                <div class="rank">{{ index + 1 }}</div>
                <div class="redemption-info">
                  <div class="redemption-name">{{ redemption.title }}</div>
                  <div class="redemption-usage">{{ redemption.usageCount }} uses</div>
                </div>
                <div class="redemption-chart">
                  <div 
                    class="usage-bar" 
                    :style="{ 
                      width: (redemption.usageCount / Math.max(...analytics.topRedemptions.map(r => r.usageCount)) * 100) + '%' 
                    }"
                  ></div>
                </div>
              </div>
            </div>

            <div v-else class="empty-top-redemptions">
              <p>No redemption data available</p>
            </div>
          </div>

          <!-- System Settings -->
          <div class="custom-card settings-card">
            <div class="card-header">
              <h5>
                <i class="material-icons">settings</i>
                System Settings
              </h5>
            </div>

            <div class="settings-list">
              <div class="setting-item">
                <div class="setting-info">
                  <h6>Earn Rate</h6>
                  <p>Points per $1 spent</p>
                </div>
                <div class="setting-value">1%</div>
              </div>

              <div class="setting-item">
                <div class="setting-info">
                  <h6>Welcome Bonus</h6>
                  <p>New user bonus</p>
                </div>
                <div class="setting-value">100 pts</div>
              </div>

              <div class="setting-item">
                <div class="setting-info">
                  <h6>Review Bonus</h6>
                  <p>Per product review</p>
                </div>
                <div class="setting-value">50 pts</div>
              </div>

              <div class="setting-item">
                <div class="setting-info">
                  <h6>Points Expiry</h6>
                  <p>Months until expiration</p>
                </div>
                <div class="setting-value">12 mo</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Award Bonus Modal -->
      <div id="bonus-modal" class="modal">
        <div class="modal-content">
          <h4>
            <i class="material-icons">card_giftcard</i>
            Award Bonus Points
          </h4>
          
          <form @submit.prevent="awardBonus">
            <div class="row">
              <div class="input-field col s12">
                <i class="material-icons prefix">person</i>
                <input 
                  id="user-id" 
                  type="text" 
                  v-model="bonusForm.userId"
                  required
                >
                <label for="user-id">User ID</label>
                <span class="helper-text">Enter the user's ID to award points</span>
              </div>
              
              <div class="input-field col s12">
                <i class="material-icons prefix">stars</i>
                <input 
                  id="bonus-points" 
                  type="number" 
                  v-model.number="bonusForm.points"
                  min="1"
                  required
                >
                <label for="bonus-points">Points to Award</label>
              </div>
              
              <div class="input-field col s12">
                <i class="material-icons prefix">description</i>
                <textarea 
                  id="bonus-description" 
                  class="materialize-textarea"
                  v-model="bonusForm.description"
                  required
                ></textarea>
                <label for="bonus-description">Description</label>
              </div>
            </div>
          </form>
        </div>
        
        <div class="modal-footer">
          <button 
            class="btn-flat waves-effect modal-close"
            type="button"
          >
            Cancel
          </button>
          
          <button 
            @click="awardBonus"
            class="btn btn-primary waves-effect"
            :disabled="awardingBonus"
          >
            <i class="material-icons left">{{ awardingBonus ? 'hourglass_empty' : 'card_giftcard' }}</i>
            {{ awardingBonus ? 'Awarding...' : 'Award Points' }}
          </button>
        </div>
      </div>

      <!-- Create/Edit Redemption Modal -->
      <div id="redemption-modal" class="modal modal-fixed-footer">
        <div class="modal-content">
          <h4>
            <i class="material-icons">{{ editingRedemption ? 'edit' : 'add' }}</i>
            {{ editingRedemption ? 'Edit' : 'Create' }} Redemption
          </h4>
          
          <form @submit.prevent="saveRedemption">
            <div class="row">
              <div class="input-field col s12">
                <input 
                  id="redemption-title" 
                  type="text" 
                  v-model="redemptionForm.title"
                  required
                >
                <label for="redemption-title" :class="{ active: redemptionForm.title }">Title</label>
              </div>
              
              <div class="input-field col s12">
                <textarea 
                  id="redemption-description" 
                  class="materialize-textarea"
                  v-model="redemptionForm.description"
                  required
                ></textarea>
                <label for="redemption-description" :class="{ active: redemptionForm.description }">Description</label>
              </div>
              
              <div class="input-field col s12 m6">
                <input 
                  id="redemption-points" 
                  type="number" 
                  v-model.number="redemptionForm.pointsCost"
                  min="1"
                  required
                >
                <label for="redemption-points" :class="{ active: redemptionForm.pointsCost }">Points Cost</label>
              </div>
              
              <div class="input-field col s12 m6">
                <select v-model="redemptionForm.discountType" required>
                  <option value="" disabled>Choose discount type</option>
                  <option value="PERCENTAGE">Percentage Off</option>
                  <option value="FIXED_AMOUNT">Fixed Amount</option>
                  <option value="FREE_SHIPPING">Free Shipping</option>
                </select>
                <label>Discount Type</label>
              </div>
              
              <div class="input-field col s12 m6" v-if="redemptionForm.discountType !== 'FREE_SHIPPING'">
                <input 
                  id="discount-value" 
                  type="number" 
                  v-model.number="redemptionForm.discountValue"
                  :min="redemptionForm.discountType === 'PERCENTAGE' ? 1 : 0.01"
                  :max="redemptionForm.discountType === 'PERCENTAGE' ? 100 : undefined"
                  step="0.01"
                >
                <label for="discount-value" :class="{ active: redemptionForm.discountValue }">
                  {{ redemptionForm.discountType === 'PERCENTAGE' ? 'Percentage (%)' : 'Amount ($)' }}
                </label>
              </div>
              
              <div class="input-field col s12 m6">
                <input 
                  id="min-order" 
                  type="number" 
                  v-model.number="redemptionForm.minOrderValue"
                  min="0"
                  step="0.01"
                >
                <label for="min-order" :class="{ active: redemptionForm.minOrderValue }">Minimum Order Value ($)</label>
              </div>
              
              <div class="input-field col s12 m6">
                <input 
                  id="max-uses" 
                  type="number" 
                  v-model.number="redemptionForm.maxUses"
                  min="1"
                >
                <label for="max-uses" :class="{ active: redemptionForm.maxUses }">Max Uses (optional)</label>
              </div>
              
              <div class="input-field col s12 m6">
                <input 
                  id="valid-until" 
                  type="date" 
                  v-model="redemptionForm.validUntil"
                >
                <label for="valid-until" class="active">Valid Until (optional)</label>
              </div>
              
              <div class="col s12">
                <p>
                  <label>
                    <input 
                      type="checkbox" 
                      v-model="redemptionForm.isActive"
                    />
                    <span>Active</span>
                  </label>
                </p>
              </div>
            </div>
          </form>
        </div>
        
        <div class="modal-footer">
          <button 
            class="btn-flat waves-effect modal-close"
            type="button"
          >
            Cancel
          </button>
          
          <button 
            @click="saveRedemption"
            class="btn btn-primary waves-effect"
            :disabled="savingRedemption"
          >
            <i class="material-icons left">{{ savingRedemption ? 'hourglass_empty' : 'save' }}</i>
            {{ savingRedemption ? 'Saving...' : 'Save Redemption' }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, nextTick } from 'vue'
import { useToast } from 'vue-toastification'
import loyaltyService from '@/services/loyalty.service'

const toast = useToast()

// Local state
const loading = ref(false)
const cleaningUp = ref(false)
const awardingBonus = ref(false)
const savingRedemption = ref(false)
const editingRedemption = ref(false)

const analytics = ref(null)
const redemptions = ref([])

// Modal instances
let bonusModal = null
let redemptionModal = null

// Forms
const bonusForm = ref({
  userId: '',
  points: null,
  description: ''
})

const redemptionForm = ref({
  title: '',
  description: '',
  pointsCost: null,
  discountType: '',
  discountValue: null,
  minOrderValue: null,
  maxUses: null,
  validUntil: '',
  isActive: true
})

// Methods
const refreshAllData = async () => {
  loading.value = true
  try {
    await Promise.all([
      fetchAnalytics(),
      fetchRedemptions()
    ])
    toast.success('Data refreshed!')
  } catch (error) {
    toast.error('Failed to refresh data')
  } finally {
    loading.value = false
  }
}

const fetchAnalytics = async () => {
  try {
    const response = await loyaltyService.getAnalytics()
    analytics.value = response.data
  } catch (error) {
    console.error('Error fetching analytics:', error)
  }
}

const fetchRedemptions = async () => {
  try {
    const response = await loyaltyService.getAllRedemptions()
    redemptions.value = response.data
  } catch (error) {
    console.error('Error fetching redemptions:', error)
  }
}

const openBonusModal = () => {
  resetBonusForm()
  if (bonusModal) {
    bonusModal.open()
  }
}

const openRedemptionModal = () => {
  resetRedemptionForm()
  editingRedemption.value = false
  if (redemptionModal) {
    redemptionModal.open()
  }
}

const resetBonusForm = () => {
  bonusForm.value = {
    userId: '',
    points: null,
    description: ''
  }
}

const resetRedemptionForm = () => {
  redemptionForm.value = {
    title: '',
    description: '',
    pointsCost: null,
    discountType: '',
    discountValue: null,
    minOrderValue: null,
    maxUses: null,
    validUntil: '',
    isActive: true
  }
  
  nextTick(() => {
    if (window.M?.updateTextFields) {
      window.M.updateTextFields()
    }
    if (window.M?.FormSelect) {
      window.M.FormSelect.init(document.querySelectorAll('select'))
    }
  })
}

const awardBonus = async () => {
  if (!bonusForm.value.userId || !bonusForm.value.points || !bonusForm.value.description) {
    toast.error('Please fill in all fields')
    return
  }
  
  awardingBonus.value = true
  
  try {
    await loyaltyService.awardBonusPoints(
      bonusForm.value.userId,
      bonusForm.value.points,
      bonusForm.value.description
    )
    
    toast.success('Bonus points awarded successfully!')
    
    if (bonusModal) {
      bonusModal.close()
    }
    
    resetBonusForm()
    await fetchAnalytics()
    
  } catch (error) {
    console.error('Error awarding bonus:', error)
    toast.error('Failed to award bonus points')
  } finally {
    awardingBonus.value = false
  }
}

const saveRedemption = async () => {
  if (!redemptionForm.value.title || !redemptionForm.value.description || 
      !redemptionForm.value.pointsCost || !redemptionForm.value.discountType) {
    toast.error('Please fill in all required fields')
    return
  }
  
  savingRedemption.value = true
  
  try {
    const formData = {
      ...redemptionForm.value,
      validUntil: redemptionForm.value.validUntil || null
    }
    
    await loyaltyService.createRedemption(formData)
    
    toast.success('Redemption saved successfully!')
    
    if (redemptionModal) {
      redemptionModal.close()
    }
    
    resetRedemptionForm()
    await fetchRedemptions()
    
  } catch (error) {
    console.error('Error saving redemption:', error)
    toast.error('Failed to save redemption')
  } finally {
    savingRedemption.value = false
  }
}

const editRedemption = (redemption) => {
  redemptionForm.value = {
    title: redemption.title,
    description: redemption.description,
    pointsCost: redemption.pointsCost,
    discountType: redemption.discountType,
    discountValue: redemption.discountValue,
    minOrderValue: redemption.minOrderValue,
    maxUses: redemption.maxUses,
    validUntil: redemption.validUntil ? redemption.validUntil.split('T')[0] : '',
    isActive: redemption.isActive
  }
  
  editingRedemption.value = true
  
  nextTick(() => {
    if (window.M?.updateTextFields) {
      window.M.updateTextFields()
    }
    if (window.M?.FormSelect) {
      window.M.FormSelect.init(document.querySelectorAll('select'))
    }
  })
  
  if (redemptionModal) {
    redemptionModal.open()
  }
}

const toggleRedemptionStatus = async (redemption) => {
  // This would need to be implemented in the backend
  toast.info('Status toggle feature coming soon')
}

const cleanupExpiredPoints = async () => {
  cleaningUp.value = true
  
  try {
    const response = await loyaltyService.cleanupExpiredPoints()
    toast.success(`Cleaned up expired points successfully`)
    await fetchAnalytics()
  } catch (error) {
    console.error('Error cleaning up points:', error)
    toast.error('Failed to cleanup expired points')
  } finally {
    cleaningUp.value = false
  }
}

const exportData = () => {
  toast.info('Export feature coming soon')
}

// Helper methods
const getActivityIcon = (type) => {
  const icons = {
    'EARN': 'trending_up',
    'REDEEM': 'redeem',
    'BONUS': 'star',
    'PENALTY': 'trending_down',
    'EXPIRED': 'schedule'
  }
  return icons[type] || 'help'
}

const getActivityColor = (type) => {
  const colors = {
    'EARN': 'green-text',
    'REDEEM': 'blue-text',
    'BONUS': 'orange-text',
    'PENALTY': 'red-text',
    'EXPIRED': 'grey-text'
  }
  return colors[type] || 'grey-text'
}

const formatActivityType = (type) => {
  const types = {
    'EARN': 'Points Earned',
    'REDEEM': 'Points Redeemed',
    'BONUS': 'Bonus Points',
    'PENALTY': 'Penalty Points',
    'EXPIRED': 'Points Expired'
  }
  return types[type] || type
}

const formatDiscountType = (type) => {
  const types = {
    'PERCENTAGE': 'Percentage',
    'FIXED_AMOUNT': 'Fixed Amount',
    'FREE_SHIPPING': 'Free Shipping'
  }
  return types[type] || type
}

const getTypeClass = (type) => {
  const classes = {
    'PERCENTAGE': 'percentage',
    'FIXED_AMOUNT': 'fixed',
    'FREE_SHIPPING': 'shipping'
  }
  return classes[type] || 'default'
}

// Lifecycle
onMounted(async () => {
  await refreshAllData()
  
  // Initialize Materialize components
  nextTick(() => {
    const bonusModalEl = document.querySelector('#bonus-modal')
    const redemptionModalEl = document.querySelector('#redemption-modal')
    
    if (bonusModalEl && window.M?.Modal) {
      bonusModal = window.M.Modal.init(bonusModalEl, {
        dismissible: true,
        onCloseEnd: resetBonusForm
      })
    }
    
    if (redemptionModalEl && window.M?.Modal) {
      redemptionModal = window.M.Modal.init(redemptionModalEl, {
        dismissible: true,
        onCloseEnd: resetRedemptionForm
      })
    }
    
    if (window.M?.FormSelect) {
      window.M.FormSelect.init(document.querySelectorAll('select'))
    }
  })
})
</script>

<style scoped lang="scss">
@import '@/assets/styles/variables';

.admin-loyalty-management {
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
      
      i.spinning {
        animation: spin 1s linear infinite;
      }
    }
  }
}

.analytics-section {
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
        i {
          font-size: 3rem;
          opacity: 0.8;
        }
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

.quick-actions-card {
  margin-bottom: $spacing-xl;
  
  .quick-actions-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
    gap: $spacing-md;
    
    .action-btn {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      gap: $spacing-sm;
      padding: $spacing-lg $spacing-md;
      text-align: center;
      min-height: 100px;
      border-radius: $border-radius-md;
      transition: all 0.3s ease;
      text-decoration: none;
      position: relative;
      overflow: hidden;
      
      &:hover {
        transform: translateY(-2px);
        box-shadow: 0 4px 12px rgba(0,0,0,0.15);
      }
      
      &.btn-primary {
        background: linear-gradient(135deg, #1976d2, #1565c0);
        color: white;
        border: none;
        
        &:hover {
          background: linear-gradient(135deg, #1565c0, #0d47a1);
        }
      }
      
      &.btn-secondary {
        background: linear-gradient(135deg, #424242, #212121);
        color: white;
        border: none;
        
        &:hover {
          background: linear-gradient(135deg, #212121, #000);
        }
      }
      
      &.btn-warning {
        background: linear-gradient(135deg, #ff9800, #f57c00);
        color: white;
        border: none;
        
        &:hover {
          background: linear-gradient(135deg, #f57c00, #e65100);
        }
        
        &:disabled {
          background: #e0e0e0;
          color: #9e9e9e;
          cursor: not-allowed;
          transform: none;
          box-shadow: none;
        }
      }
      
      &.btn-flat {
        background: #f8f9fa;
        color: #495057;
        border: 1px solid #dee2e6;
        
        &:hover {
          background: #e9ecef;
          color: #212529;
        }
      }
      
      i {
        font-size: 1.8rem;
        margin-bottom: $spacing-xs;
        display: block;
      }
      
      span {
        font-size: 0.85rem;
        font-weight: 500;
        display: block;
        line-height: 1.2;
      }
    }
  }
}

.activity-card {
  margin-bottom: $spacing-xl;
  
  .activity-summary {
    .activity-item {
      display: flex;
      align-items: center;
      gap: $spacing-md;
      padding: $spacing-md 0;
      border-bottom: 1px solid #f0f0f0;
      
      &:last-child {
        border-bottom: none;
      }
      
      .activity-icon {
        i {
          width: 40px;
          height: 40px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 18px;
          
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
            color: #9e9e9e;
          }
        }
      }
      
      .activity-info {
        flex: 1;
        
        .activity-title {
          font-weight: 500;
          color: #2c3e50;
          margin-bottom: 4px;
        }
        
        .activity-stats {
          display: flex;
          gap: $spacing-md;
          font-size: 0.85rem;
          color: #6c757d;
          
          .transactions {
            &::after {
              content: " • ";
            }
          }
        }
      }
    }
  }
}

.redemptions-management-card {
  .redemptions-table {
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
        vertical-align: middle;
      }
      
      .redemption-title {
        strong {
          display: block;
          color: #2c3e50;
          margin-bottom: 4px;
        }
        
        small {
          color: #6c757d;
          font-size: 0.8rem;
        }
      }
      
      .type-badge {
        padding: 4px 8px;
        border-radius: 12px;
        font-size: 0.75rem;
        font-weight: 600;
        text-transform: uppercase;
        
        &.percentage {
          background: rgba($info-color, 0.1);
          color: $info-color;
        }
        
        &.fixed {
          background: rgba($success-color, 0.1);
          color: $success-color;
        }
        
        &.shipping {
          background: rgba($warning-color, 0.1);
          color: $warning-color;
        }
      }
      
      .usage-info {
        font-weight: 500;
      }
      
      .action-buttons {
        display: flex;
        gap: $spacing-xs;
        
        .btn-small {
          min-width: 36px;
          padding: 0 8px;
        }
      }
    }
    
    .mobile-redemptions {
      .mobile-redemption-card {
        background: white;
        border-radius: $border-radius-md;
        box-shadow: $shadow-sm;
        margin-bottom: $spacing-md;
        padding: $spacing-md;
        
        .mobile-redemption-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: $spacing-sm;
          
          h6 {
            margin: 0;
            color: #2c3e50;
            font-weight: 600;
          }
        }
        
        .mobile-redemption-body {
          p {
            color: #6c757d;
            margin-bottom: $spacing-md;
          }
          
          .mobile-redemption-meta {
            margin-bottom: $spacing-md;
            
            .meta-row {
              display: flex;
              justify-content: space-between;
              align-items: center;
              margin-bottom: $spacing-xs;
              
              .label {
                color: #6c757d;
                font-weight: 500;
              }
            }
          }
          
          .mobile-actions {
            display: flex;
            gap: $spacing-sm;
            
            .btn-small {
              flex: 1;
              text-align: center;
            }
          }
        }
      }
    }
  }
  
  .empty-redemptions {
    text-align: center;
    padding: $spacing-xl;
    color: #6c757d;
    
    i {
      font-size: 4rem;
      margin-bottom: $spacing-md;
      opacity: 0.5;
    }
    
    p {
      margin: $spacing-md 0;
    }
  }
}

.top-redemptions-card {
  margin-bottom: $spacing-xl;
  
  .top-redemptions-list {
    .top-redemption-item {
      display: flex;
      align-items: center;
      gap: $spacing-md;
      padding: $spacing-md 0;
      border-bottom: 1px solid #f0f0f0;
      
      &:last-child {
        border-bottom: none;
      }
      
      .rank {
        width: 30px;
        height: 30px;
        border-radius: 50%;
        background: $primary-color;
        color: white;
        display: flex;
        align-items: center;
        justify-content: center;
        font-weight: 600;
        font-size: 0.9rem;
      }
      
      .redemption-info {
        flex: 1;
        
        .redemption-name {
          font-weight: 500;
          color: #2c3e50;
          margin-bottom: 2px;
        }
        
        .redemption-usage {
          font-size: 0.8rem;
          color: #6c757d;
        }
      }
      
      .redemption-chart {
        width: 60px;
        height: 8px;
        background: #e0e0e0;
        border-radius: 4px;
        overflow: hidden;
        
        .usage-bar {
          height: 100%;
          background: $primary-color;
          border-radius: 4px;
          transition: width 0.3s ease;
        }
      }
    }
  }
  
  .empty-top-redemptions {
    text-align: center;
    padding: $spacing-lg;
    color: #6c757d;
  }
}

.settings-card {
  .settings-list {
    .setting-item {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: $spacing-md 0;
      border-bottom: 1px solid #f0f0f0;
      
      &:last-child {
        border-bottom: none;
      }
      
      .setting-info {
        h6 {
          margin: 0 0 4px;
          color: #2c3e50;
          font-weight: 600;
        }
        
        p {
          margin: 0;
          font-size: 0.8rem;
          color: #6c757d;
        }
      }
      
      .setting-value {
        font-weight: 600;
        color: $primary-color;
        font-size: 1.1rem;
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

.modal {
  .modal-content {
    .input-field {
      .prefix {
        color: $primary-color;
      }
      
      input:focus + label,
      textarea:focus + label {
        color: $primary-color;
      }
      
      input:focus,
      textarea:focus {
        border-bottom: 1px solid $primary-color;
        box-shadow: 0 1px 0 0 $primary-color;
      }
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
  
  .quick-actions-grid {
    grid-template-columns: repeat(2, 1fr);
    gap: $spacing-sm;
    
    .action-btn {
      padding: $spacing-md;
      min-height: 80px;
      
      i {
        font-size: 1.5rem;
      }
      
      span {
        font-size: 0.8rem;
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
  .admin-loyalty-management {
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
  
  .stat-card {
    .stat-content {
      flex-direction: column;
      text-align: center;
      gap: $spacing-sm;
      
      .stat-icon {
        i {
          font-size: 2.5rem;
        }
      }
      
      .stat-info {
        h3 {
          font-size: 1.8rem;
        }
      }
    }
  }
  
  .quick-actions-grid {
    grid-template-columns: 1fr;
    
    .action-btn {
      flex-direction: row;
      justify-content: flex-start;
      text-align: left;
      padding: $spacing-md $spacing-lg;
      min-height: auto;
      
      i {
        font-size: 1.5rem;
        margin-bottom: 0;
        margin-right: $spacing-md;
      }
      
      span {
        font-size: 0.9rem;
      }
    }
  }
  
  .activity-item {
    .activity-stats {
      flex-direction: column;
      gap: $spacing-xs;
      
      .transactions {
        &::after {
          content: "";
        }
      }
    }
  }
  
  .top-redemption-item {
    .redemption-chart {
      width: 40px;
    }
  }
  
  .setting-item {
    flex-direction: column;
    align-items: flex-start;
    
    .setting-value {
      margin-top: $spacing-xs;
    }
  }
}
</style>