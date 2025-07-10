<!-- src/views/profile/UserProfile.vue - Complete with Loyalty Integration -->
<template>
  <div class="user-profile-page">
    <div class="container">
      <!-- Page Header -->
      <div class="page-header">
        <div class="header-content">
          <div class="header-info">
            <UserCircle :size="40" />
            <div class="header-text">
              <h4>My Profile</h4>
              <p>Manage your account settings and preferences</p>
            </div>
          </div>
          <div class="header-actions">
            <button class="btn-flat waves-effect" @click="refreshProfile" :disabled="refreshing">
              <RotateCcw :size="20" :class="{ 'spinning': refreshing }" />
              Refresh
            </button>
          </div>
        </div>
      </div>

      <div class="row profile-content">
        <!-- Left Column - Profile Card -->
        <div class="col s12 m12 l4">
          <div class="profile-card custom-card">
            <!-- Avatar Section -->
            <div class="profile-avatar-section">
              <div class="profile-avatar">
                <img :src="getAvatarUrl()" :alt="profile?.name" @error="handleAvatarError" class="avatar-image">

                <!-- Avatar Upload Overlay -->
                <div class="avatar-overlay" :class="{ 'uploading': uploadingAvatar }">
                  <label for="avatar-upload" class="avatar-upload-label">
                    <Clock v-if="uploadingAvatar" :size="18" />
                    <Camera v-else :size="18" />
                    <span class="upload-text">{{ uploadingAvatar ? 'Uploading...' : 'Change Photo' }}</span>
                  </label>
                  <input id="avatar-upload" type="file" accept="image/*" @change="handleAvatarChange"
                    :disabled="uploadingAvatar" style="display: none">
                </div>
              </div>

              <!-- User Info -->
              <div class="user-info">
                <h5 class="user-name">{{ profile?.name || 'Loading...' }}</h5>
                <p class="user-email">{{ profile?.email }}</p>
                <div class="user-role">
                  <span class="status-badge" :class="getRoleClass(profile?.role)">
                    {{ formatRole(profile?.role) }}
                  </span>
                </div>
                <p class="member-since">
                  Member since {{ formatDate(profile?.createdAt) }}
                </p>
              </div>
            </div>

            <!-- Profile Stats -->
            <div class="profile-stats">
              <div class="stat-item">
                <span class="stat-value">{{ profile?._count?.products || 0 }}</span>
                <span class="stat-label">Products</span>
              </div>
              <div class="stat-item">
                <span class="stat-value">{{ profile?._count?.orders || 0 }}</span>
                <span class="stat-label">Orders</span>
              </div>
              <div class="stat-item">
                <span class="stat-value">{{ profile?._count?.reviews || 0 }}</span>
                <span class="stat-label">Reviews</span>
              </div>
            </div>
          </div>
        </div>

        <!-- Right Column - Forms -->
        <div class="col s12 m12 l8">
          <!-- Loyalty Points Card -->
          <div class="custom-card loyalty-profile-card">
            <div class="card-header">
              <h5>
                <Star :size="24" />
                Loyalty Points
              </h5>
              <router-link to="/loyalty" class="btn-flat waves-effect loyalty-dashboard-btn">
                <BarChart :size="20" class="left-icon" />
                View Dashboard
              </router-link>
            </div>

            <div class="loyalty-summary">
              <div class="points-display">
                <div class="current-points">
                  <span class="points-number">{{ loyaltyStore.currentBalance.toLocaleString() }}</span>
                  <span class="points-label">Available Points</span>
                </div>

                <div class="points-actions">
                  <router-link to="/loyalty/redeem" class="btn btn-small btn-primary waves-effect">
                    <Gift :size="16" class="left-icon" />
                    Redeem
                  </router-link>
                </div>
              </div>

              <div class="loyalty-stats-mini">
                <div class="stat-mini">
                  <span class="value">{{ loyaltyStore.totalEarned.toLocaleString() }}</span>
                  <span class="label">Total Earned</span>
                </div>
                <div class="stat-mini">
                  <span class="value">{{ loyaltyStore.totalRedeemed.toLocaleString() }}</span>
                  <span class="label">Total Redeemed</span>
                </div>
                <div class="stat-mini" v-if="loyaltyStore.pointsExpiringSoon > 0">
                  <span class="value warning">{{ loyaltyStore.pointsExpiringSoon.toLocaleString() }}</span>
                  <span class="label">Expiring Soon</span>
                </div>
              </div>

              <!-- Milestone Progress -->
              <div class="milestone-progress" v-if="milestoneProgress">
                <div class="milestone-header">
                  <h6>Next Milestone</h6>
                  <span class="milestone-target">{{ milestoneProgress.target.toLocaleString() }} points</span>
                </div>
                <div class="progress-container">
                  <div class="progress">
                    <div class="determinate" :style="{ width: milestoneProgress.progress + '%' }"></div>
                  </div>
                  <span class="progress-text">{{ milestoneProgress.progress.toFixed(1) }}% complete</span>
                </div>
                <p class="remaining-text">
                  {{ milestoneProgress.remaining.toLocaleString() }} points to go!
                </p>
              </div>

              <div class="quick-links">
                <router-link to="/loyalty/history" class="quick-link">
                  <History :size="20" />
                  <span>Points History</span>
                </router-link>
                <router-link to="/loyalty/redeem" class="quick-link">
                  <Gift :size="20" />
                  <span>Redeem Points</span>
                </router-link>
                <a href="#" @click.prevent="calculateEarnPotential" class="quick-link">
                  <Calculator :size="20" />
                  <span>Earn Calculator</span>
                </a>
              </div>

              <!-- How to Earn More Points -->
              <div class="earn-more-section">
                <h6>Earn More Points</h6>
                <div class="earn-methods">
                  <div class="earn-method">
                    <ShoppingBag :size="20" />
                    <span>Shop & earn {{ (loyaltyStore.earnRate * 100).toFixed(0) }}% back in points</span>
                  </div>
                  <div class="earn-method">
                    <MessageSquare :size="20" />
                    <span>Write product reviews for 50 bonus points</span>
                  </div>
                  <div class="earn-method">
                    <Gift :size="20" />
                    <span>Watch for special promotions</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- Profile Information Form -->
          <div class="custom-card profile-form-card">
            <div class="card-header">
              <h5>
                <User :size="24" />
                Profile Information
              </h5>
            </div>

            <form @submit.prevent="updateProfile" class="profile-form">
              <div class="row">
                <div class="input-field col s12">
                  <UserCircle :size="20" class="prefix" />
                  <input id="name" type="text" v-model="form.name" required class="validate">
                  <label for="name" :class="{ active: form.name }">Full Name</label>
                  <span class="helper-text" data-error="Name is required">Enter your full name</span>
                </div>

                <div class="input-field col s12">
                  <Mail :size="20" class="prefix" />
                  <input id="email" type="email" v-model="form.email" disabled class="disabled">
                  <label for="email" class="active">Email Address</label>
                  <span class="helper-text">Email cannot be changed for security reasons</span>
                </div>

                <div class="input-field col s12">
                  <Phone :size="20" class="prefix" />
                  <input id="phone" type="tel" v-model="form.phone" class="validate">
                  <label for="phone" :class="{ active: !!form.phone }">Phone Number</label>
                  <span class="helper-text" data-error="Invalid phone number">Optional: Your contact number</span>
                </div>
              </div>

              <!-- Form Actions -->
              <div class="form-actions">
                <button type="button" class="btn-flat waves-effect" @click="resetForm" :disabled="!hasChanges">
                  Reset
                </button>

                <button type="submit" class="btn btn-primary waves-effect waves-light"
                  :disabled="!hasChanges || updating">
                  <Clock v-if="updating" :size="16" class="left-icon" />
                  <Save v-else :size="16" class="left-icon" />
                  {{ updating ? 'Updating...' : 'Update Profile' }}
                </button>
              </div>
            </form>
          </div>

          <!-- Change Password Form -->
          <div class="custom-card password-form-card">
            <div class="card-header">
              <h5>
                <Lock :size="24" />
                Change Password
              </h5>
            </div>

            <form @submit.prevent="changePassword" class="password-form">
              <div class="row">
                <div class="input-field col s12">
                  <Unlock :size="20" class="prefix" />
                  <input id="currentPassword" type="password" v-model="passwordForm.currentPassword" required
                    class="validate">
                  <label for="currentPassword">Current Password</label>
                  <span class="helper-text" data-error="Current password is required">Enter your current password</span>
                </div>

                <div class="input-field col s12">
                  <Lock :size="20" class="prefix" />
                  <input id="newPassword" type="password" v-model="passwordForm.newPassword" required minlength="6"
                    class="validate"
                    :class="{ 'valid': isPasswordValid, 'invalid': passwordForm.newPassword && !isPasswordValid }">
                  <label for="newPassword">New Password</label>
                  <span class="helper-text" data-error="Password must be at least 6 characters">
                    Password strength: {{ getPasswordStrength() }}
                  </span>
                </div>

                <div class="input-field col s12">
                  <Lock :size="20" class="prefix" />
                  <input id="confirmPassword" type="password" v-model="passwordForm.confirmPassword" required
                    class="validate"
                    :class="{ 'valid': passwordsMatch && passwordForm.confirmPassword, 'invalid': passwordForm.confirmPassword && !passwordsMatch }">
                  <label for="confirmPassword">Confirm New Password</label>
                  <span class="helper-text" data-error="Passwords do not match">Re-enter your new password</span>
                </div>
              </div>

              <!-- Password Requirements -->
              <div class="password-requirements">
                <h6>Password Requirements:</h6>
                <ul class="password-checklist">
                  <li :class="{ 'valid': passwordForm.newPassword?.length >= 6 }">
                    <Check v-if="passwordForm.newPassword?.length >= 6" :size="16" />
                    <X v-else :size="16" />
                    At least 6 characters
                  </li>
                  <li :class="{ 'valid': /[A-Z]/.test(passwordForm.newPassword) }">
                    <Check v-if="/[A-Z]/.test(passwordForm.newPassword)" :size="16" />
                    <X v-else :size="16" />
                    One uppercase letter
                  </li>
                  <li :class="{ 'valid': /[0-9]/.test(passwordForm.newPassword) }">
                    <Check v-if="/[0-9]/.test(passwordForm.newPassword)" :size="16" />
                    <X v-else :size="16" />
                    One number
                  </li>
                </ul>
              </div>

              <!-- Form Actions -->
              <div class="form-actions">
                <button type="button" class="btn-flat waves-effect" @click="resetPasswordForm">
                  Clear
                </button>

                <button type="submit" class="btn btn-primary waves-effect waves-light"
                  :disabled="!canChangePassword || changingPassword">
                  <Clock v-if="changingPassword" :size="16" class="left-icon" />
                  <Shield v-else :size="16" class="left-icon" />
                  {{ changingPassword ? 'Changing...' : 'Change Password' }}
                </button>
              </div>
            </form>
          </div>

          <!-- Account Actions -->
          <div class="custom-card account-actions-card">
            <div class="card-header">
              <h5>
                <Settings :size="24" />
                Account Settings
              </h5>
            </div>

            <div class="account-actions">
              <!-- Export Data -->
              <div class="action-item">
                <div class="action-info">
                  <h6>Export Your Data</h6>
                  <p>Download a copy of your account data and activity</p>
                </div>
                <button class="btn btn-secondary waves-effect waves-light" @click="exportData">
                  <Download :size="16" class="left-icon" />
                  Export Data
                </button>
              </div>

              <!-- Privacy Settings -->
              <div class="action-item">
                <div class="action-info">
                  <h6>Privacy Settings</h6>
                  <p>Manage your privacy preferences and data sharing</p>
                </div>
                <button class="btn btn-secondary waves-effect waves-light" @click="showPrivacySettings">
                  <ShieldCheck :size="16" class="left-icon" />
                  Privacy Settings
                </button>
              </div>

              <!-- Two-Factor Authentication -->
              <div class="action-item">
                <div class="action-info">
                  <h6>Two-Factor Authentication</h6>
                  <p>Enhance your account security with 2FA</p>
                  <span class="status-indicator"
                    :class="{ 'enabled': profile?.twoFactorEnabled, 'disabled': !profile?.twoFactorEnabled }">
                    {{ profile?.twoFactorEnabled ? 'Enabled' : 'Disabled' }}
                  </span>
                </div>
                <button class="btn waves-effect waves-light" :class="profile?.twoFactorEnabled ? 'red' : 'green'"
                  @click="toggleTwoFactor">
                  <Shield v-if="profile?.twoFactorEnabled" :size="16" class="left-icon" />
                  <ShieldCheck v-else :size="16" class="left-icon" />
                  {{ profile?.twoFactorEnabled ? 'Disable 2FA' : 'Enable 2FA' }}
                </button>
              </div>

              <!-- Delete Account -->
              <div class="action-item danger">
                <div class="action-info">
                  <h6>Delete Account</h6>
                  <p>Permanently delete your account and all associated data</p>
                  <small class="warning-text">This action cannot be undone</small>
                </div>
                <button class="btn red waves-effect waves-light" @click="confirmDeleteAccount">
                  <Trash2 :size="16" class="left-icon" />
                  Delete Account
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch, nextTick } from 'vue'
import { useAuthStore } from '@/stores/auth'
import { useLoyaltyStore } from '@/stores/loyalty'
import { useToast } from 'vue-toastification'
import { formatDate } from '@/utils/formatters'
import { getStaticUrl } from '@/services/api'
import authService from '@/services/auth.service'

// Lucide Vue Icons
import {
  UserCircle, RotateCcw, Camera, Clock, Star, BarChart, Gift,
  History, Calculator, ShoppingBag, MessageSquare, User, Mail,
  Phone, Save, Lock, Unlock, Check, X, Shield, Settings,
  Download, ShieldCheck, Trash2
} from 'lucide-vue-next'

const authStore = useAuthStore()
const loyaltyStore = useLoyaltyStore()
const toast = useToast()

// Reactive state
const profile = computed(() => authStore.user)
const updating = ref(false)
const changingPassword = ref(false)
const uploadingAvatar = ref(false)
const refreshing = ref(false)

// Form data
const form = ref({
  name: '',
  email: '',
  phone: ''
})

const passwordForm = ref({
  currentPassword: '',
  newPassword: '',
  confirmPassword: ''
})

// Computed properties
const hasChanges = computed(() => {
  return form.value.name !== profile.value?.name ||
    form.value.phone !== (profile.value?.phone || '')
})

const isPasswordValid = computed(() => {
  const password = passwordForm.value.newPassword
  return password && password.length >= 6
})

const passwordsMatch = computed(() => {
  return passwordForm.value.newPassword === passwordForm.value.confirmPassword
})

const canChangePassword = computed(() => {
  return passwordForm.value.currentPassword &&
    isPasswordValid.value &&
    passwordsMatch.value
})

// Loyalty computed properties
const milestoneProgress = computed(() => {
  return loyaltyStore.getMilestoneProgress()
})

// Methods
const getAvatarUrl = () => {
  const avatarPath = profile.value?.avatar
  const fallbackUrl = 'https://ui-avatars.com/api/?name=' +
    encodeURIComponent(profile.value?.name || 'User') +
    '&background=1976d2&color=fff&size=400&bold=true'

  return getStaticUrl(avatarPath) || fallbackUrl
}

const handleAvatarError = (event) => {
  const fallbackUrl = 'https://ui-avatars.com/api/?name=' +
    encodeURIComponent(profile.value?.name || 'User') +
    '&background=1976d2&color=fff&size=400&bold=true'
  event.target.src = fallbackUrl
}

const getRoleClass = (role) => {
  const classes = {
    'ADMIN': 'orange',
    'USER': 'blue'
  }
  return classes[role] || 'blue'
}

const formatRole = (role) => {
  const roles = {
    'ADMIN': 'Administrator',
    'USER': 'Member'
  }
  return roles[role] || 'Member'
}

const getPasswordStrength = () => {
  const password = passwordForm.value.newPassword
  if (!password) return 'Enter password'

  let score = 0
  if (password.length >= 6) score++
  if (/[A-Z]/.test(password)) score++
  if (/[a-z]/.test(password)) score++
  if (/[0-9]/.test(password)) score++
  if (/[^A-Za-z0-9]/.test(password)) score++

  const strengths = ['Very Weak', 'Weak', 'Fair', 'Good', 'Strong']
  return strengths[Math.min(score, 4)]
}

const handleAvatarChange = async (event) => {
  const file = event.target.files[0]
  if (!file) return

  // Validate file size (5MB)
  if (file.size > 5 * 1024 * 1024) {
    toast.error('File size must be less than 5MB')
    return
  }

  // Validate file type
  const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp']
  if (!allowedTypes.includes(file.type)) {
    toast.error('Please select a valid image file (JPEG, PNG, GIF, WebP)')
    return
  }

  uploadingAvatar.value = true

  try {
    await authService.uploadAvatar(file)
    toast.success('Avatar updated successfully!')
    await authStore.fetchProfile()
  } catch (error) {
    toast.error('Failed to upload avatar. Please try again.')
  } finally {
    uploadingAvatar.value = false
    event.target.value = ''
  }
}

const updateProfile = async () => {
  updating.value = true

  try {
    await authService.updateProfile({
      name: form.value.name,
      phone: form.value.phone || null
    })
    toast.success('Profile updated successfully!')
    await authStore.fetchProfile()
  } catch (error) {
    toast.error('Failed to update profile. Please try again.')
  } finally {
    updating.value = false
  }
}

const changePassword = async () => {
  if (!canChangePassword.value) {
    toast.error('Please check all password requirements')
    return
  }

  changingPassword.value = true

  try {
    await authService.changePassword({
      currentPassword: passwordForm.value.currentPassword,
      newPassword: passwordForm.value.newPassword
    })
    toast.success('Password changed successfully!')
    resetPasswordForm()
  } catch (error) {
    toast.error('Failed to change password. Please check your current password.')
  } finally {
    changingPassword.value = false
  }
}

const resetPasswordForm = () => {
  passwordForm.value = {
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  }
}

const refreshProfile = async () => {
  refreshing.value = true
  try {
    await authStore.fetchProfile()
    await loyaltyStore.fetchBalance()
    toast.success('Profile refreshed!')
  } catch (error) {
    toast.error('Failed to refresh profile')
  } finally {
    refreshing.value = false
  }
}

const exportData = () => {
  toast.info('Data export feature coming soon')
  // TODO: Implement data export
}

const showPrivacySettings = () => {
  toast.info('Privacy settings feature coming soon')
  // TODO: Implement privacy settings modal
}

const toggleTwoFactor = () => {
  if (profile.value?.twoFactorEnabled) {
    toast.info('Two-factor authentication disable feature coming soon')
  } else {
    toast.info('Two-factor authentication setup feature coming soon')
  }
  // TODO: Implement 2FA toggle
}

const confirmDeleteAccount = () => {
  // Enhanced confirmation dialog
  const confirmText = prompt(
    'WARNING: This will permanently delete your account and all data.\n\n' +
    'Type "DELETE" to confirm:'
  )

  if (confirmText === 'DELETE') {
    toast.error('Account deletion feature coming soon')
    // TODO: Implement account deletion
  } else if (confirmText !== null) {
    toast.info('Account deletion cancelled')
  }
}

// Loyalty methods
const calculateEarnPotential = () => {
  const amount = prompt('Enter order amount to calculate points:')
  if (amount && !isNaN(amount)) {
    const points = Math.floor(parseFloat(amount) * loyaltyStore.earnRate)
    toast.info(`You would earn ${points} points from a $${amount} order`)
  }
}

// Watch for profile changes
watch(profile, (newProfile) => {
  if (newProfile) {
    form.value = {
      name: newProfile.name || '',
      email: newProfile.email || '',
      phone: newProfile.phone || ''
    }

    nextTick(() => {
      if (window.M?.updateTextFields) {
        window.M.updateTextFields()
      }
    })
  }
}, { immediate: true, deep: true })

// Component lifecycle
onMounted(async () => {
  if (!profile.value || !profile.value.phone) {
    try {
      await authStore.fetchProfile()
    } catch (error) {
      // XÓA console.error không cần thiết
    }
  }

  // Initialize loyalty store
  try {
    await loyaltyStore.initialize()
  } catch (error) {
    // XÓA console.error không cần thiết
  }

  // Initialize Materialize
  nextTick(() => {
    if (window.M?.updateTextFields) {
      window.M.updateTextFields()
    }
  })
})

// Thêm vào phần script của UserProfile.vue

// Method để update Materialize text fields
const updateMaterializeFields = () => {
  nextTick(() => {
    // Update text fields
    if (window.M?.updateTextFields) {
      window.M.updateTextFields()
    }
    
    // Manual update for labels with values
    document.querySelectorAll('.user-profile-page .input-field input').forEach(input => {
      const label = input.nextElementSibling
      if (input.value && label && label.tagName === 'LABEL') {
        label.classList.add('active')
      }
    })
  })
}

// Watch for form data changes
watch(form, () => {
  updateMaterializeFields()
}, { deep: true })

// Watch for profile changes
watch(profile, (newProfile) => {
  if (newProfile) {
    form.value = {
      name: newProfile.name || '',
      email: newProfile.email || '',
      phone: newProfile.phone || ''
    }
    updateMaterializeFields()
  }
}, { immediate: true, deep: true })

// Update mounted lifecycle
onMounted(async () => {
  if (!profile.value || !profile.value.phone) {
    try {
      await authStore.fetchProfile()
    } catch (error) {
      // XÓA console.error không cần thiết
    }
  }
  
  // Initialize loyalty store
  try {
    await loyaltyStore.initialize()
  } catch (error) {
    // XÓA console.error không cần thiết
  }
  
  // Initialize Materialize and update fields
  updateMaterializeFields()
})

// Update resetForm method
const resetForm = () => {
  if (profile.value) {
    form.value = {
      name: profile.value.name || '',
      email: profile.value.email || '',
      phone: profile.value.phone || ''
    }
    updateMaterializeFields()
  }
}
</script>

<style scoped lang="scss">
// Import variables
@import '@/assets/styles/variables';

// Icon positioning helper classes
.left-icon {
  margin-right: 8px;
}

.user-profile-page {
  background: #f8f9fa;
  min-height: 100vh;
  padding: $spacing-lg 0;

  // Fix input field underline và positioning - LOẠI BỎ DOUBLE UNDERLINE
  .input-field {
    position: relative;
    margin-bottom: 2rem;

    // Prefix icon positioning
    .prefix {
      position: absolute;
      left: 10px;
      top: 16px;
      z-index: 10;
      color: $primary-color;
      pointer-events: none;
    }

    // Input styling với custom underline - OVERRIDE HOÀN TOÀN MATERIALIZE
    input {
      height: 3rem;
      line-height: 3rem;
      padding: 0 16px 0 45px;
      margin: 0;
      border-radius: 0;
      font-size: 16px;
      
      // LOẠI BỎ TẤT CẢ BORDER VÀ BOX-SHADOW CỦA MATERIALIZE
      border: none !important;
      border-bottom: none !important;
      outline: none !important;
      box-shadow: none !important;
      -webkit-box-shadow: none !important;
      -moz-box-shadow: none !important;
      background-color: transparent !important;
      
      // Custom underline chỉ hiển thị sau icon
      background-image: linear-gradient(to right, transparent 42px, #e0e0e0 42px) !important;
      background-size: 100% 1px !important;
      background-position: bottom !important;
      background-repeat: no-repeat !important;

      // Remove any pseudo elements that might create extra lines
      &:before,
      &:after {
        display: none !important;
      }

      // Focus state - OVERRIDE MATERIALIZE FOCUS
      &:focus,
      &:focus:not([readonly]),
      &:focus:not([readonly]):not(.browser-default) {
        border: none !important;
        border-bottom: none !important;
        outline: none !important;
        box-shadow: none !important;
        -webkit-box-shadow: none !important;
        -moz-box-shadow: none !important;
        background-image: linear-gradient(to right, transparent 42px, $primary-color 42px) !important;
        background-size: 100% 2px !important;
        background-position: bottom !important;
        background-repeat: no-repeat !important;
      }

      // Valid state
      &.valid,
      &.valid:not([readonly]) {
        border: none !important;
        border-bottom: none !important;
        box-shadow: none !important;
        background-image: linear-gradient(to right, transparent 42px, #4CAF50 42px) !important;
        background-size: 100% 2px !important;
        background-position: bottom !important;
        background-repeat: no-repeat !important;
      }

      // Invalid state
      &.invalid,
      &.invalid:not([readonly]) {
        border: none !important;
        border-bottom: none !important;
        box-shadow: none !important;
        background-image: linear-gradient(to right, transparent 42px, #f44336 42px) !important;
        background-size: 100% 2px !important;
        background-position: bottom !important;
        background-repeat: no-repeat !important;
      }

      // Disabled state
      &.disabled {
        color: #999 !important;
        border: none !important;
        border-bottom: none !important;
        box-shadow: none !important;
        background-image: linear-gradient(to right, transparent 42px, #e0e0e0 42px) !important;
        background-size: 100% 1px !important;
        background-position: bottom !important;
        background-repeat: no-repeat !important;
        background-color: rgba(0,0,0,0.05) !important;
      }
    }

    // Label positioning với prefix icon
    label {
      font-size: 0.9rem;
      color: #9e9e9e;
      position: absolute;
      top: 0.8rem;
      left: 45px;
      cursor: text;
      transition: transform 0.2s ease-out, color 0.2s ease-out, font-size 0.2s ease-out;
      transform-origin: 0% 100%;
      text-align: initial;
      z-index: 1;
      
      // Remove any pseudo elements
      &:before,
      &:after {
        display: none !important;
      }
      
      // Active state (khi có value hoặc focus)
      &.active {
        transform: translateY(-140%) scale(0.8);
        color: $primary-color;
        left: 45px;
        font-size: 0.8rem;
      }
    }

    // Helper text positioning
    .helper-text {
      color: #6c757d;
      font-size: 0.8rem;
      margin-left: 45px;
      margin-top: 4px;
      line-height: 1.4;

      &[data-error] {
        color: #f44336;
      }

      &[data-success] {
        color: #4CAF50;
      }
    }

    // Remove any potential underline pseudo elements
    &:before,
    &:after {
      display: none !important;
    }
  }
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

.profile-content {
  margin: 0;
}

.profile-card {
  position: sticky;
  top: $spacing-lg;
}

.profile-avatar-section {
  text-align: center;
  margin-bottom: $spacing-xl;
}

.profile-avatar {
  position: relative;
  width: 180px;
  height: 180px;
  margin: 0 auto $spacing-lg;

  .avatar-image {
    width: 100%;
    height: 100%;
    border-radius: 50%;
    object-fit: cover;
    border: 4px solid #e3f2fd;
    box-shadow: $shadow-lg;
    transition: transform 0.3s ease;

    &:hover {
      transform: scale(1.02);
    }
  }

  .avatar-overlay {
    position: absolute;
    bottom: 8px;
    right: 8px;
    background: $primary-color;
    border-radius: 50%;
    box-shadow: $shadow-md;
    transition: all 0.3s ease;

    &:hover {
      transform: scale(1.1);
      box-shadow: $shadow-lg;
    }

    &.uploading {
      background: $warning-color;
      cursor: not-allowed;

      svg {
        animation: spin 1s linear infinite;
      }
    }

    .avatar-upload-label {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      width: 50px;
      height: 50px;
      cursor: pointer;
      color: white;
      gap: 2px;

      .upload-text {
        font-size: 8px;
        text-align: center;
        line-height: 1;
      }
    }
  }
}

.user-info {
  .user-name {
    margin: 0 0 $spacing-xs;
    color: #2c3e50;
    font-weight: 600;
    font-size: 1.5rem;
  }

  .user-email {
    margin: 0 0 $spacing-sm;
    color: #6c757d;
    font-size: 0.95rem;
  }

  .user-role {
    margin-bottom: $spacing-sm;

    .status-badge {
      font-size: 0.75rem;
      padding: $spacing-xs $spacing-sm;
      border-radius: $border-radius-sm;
      font-weight: 500;
      text-transform: uppercase;

      &.orange {
        background: rgba($warning-color, 0.1);
        color: $warning-color;
        border: 1px solid rgba($warning-color, 0.3);
      }

      &.blue {
        background: rgba($primary-color, 0.1);
        color: $primary-color;
        border: 1px solid rgba($primary-color, 0.3);
      }
    }
  }

  .member-since {
    margin: 0;
    color: #999;
    font-size: 0.85rem;
  }
}

.profile-stats {
  display: flex;
  justify-content: space-around;
  padding-top: $spacing-lg;
  border-top: 1px solid #f0f0f0;

  .stat-item {
    text-align: center;

    .stat-value {
      display: block;
      font-size: 2rem;
      font-weight: 700;
      color: $primary-color;
      margin-bottom: $spacing-xs;
    }

    .stat-label {
      display: block;
      color: #6c757d;
      font-size: 0.85rem;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }
  }
}

.custom-card {
  background: white;
  border-radius: $border-radius-lg;
  padding: $spacing-xl;
  box-shadow: $shadow-md;
  margin-bottom: $spacing-xl;

  .card-header {
    margin-bottom: $spacing-lg;
    padding-bottom: $spacing-md;
    border-bottom: 2px solid #f0f0f0;
    display: flex;
    justify-content: space-between;
    align-items: center;

    h5 {
      margin: 0;
      color: #2c3e50;
      font-weight: 600;
      display: flex;
      align-items: center;
      gap: $spacing-sm;

      >* {
        color: $primary-color;
      }
    }
  }
}

// Loyalty Profile Card Styles
.loyalty-profile-card {
  background: linear-gradient(135deg, #FFD700 0%, #FFA500 100%);
  color: white;
  border: none;

  .card-header {
    border-bottom-color: rgba(255, 255, 255, 0.2);

    h5 {
      color: white;

      >* {
        color: white;
      }
    }

    .loyalty-dashboard-btn {
      color: white;
      background: rgba(255, 255, 255, 0.2);
      border-radius: $border-radius-md;
      display: flex;
      align-items: center;

      &:hover {
        background: rgba(255, 255, 255, 0.3);
      }
    }
  }
}

.loyalty-summary {
  .points-display {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: $spacing-lg;

    .current-points {
      .points-number {
        display: block;
        font-size: 3rem;
        font-weight: 700;
        color: white;
        line-height: 1;
        margin-bottom: $spacing-xs;
      }

      .points-label {
        font-size: 0.9rem;
        opacity: 0.9;
      }
    }

    .points-actions {
      .btn {
        background: white;
        color: #FF8C00;
        display: flex;
        align-items: center;

        &:hover {
          background: #f8f9fa;
        }
      }
    }
  }

  .loyalty-stats-mini {
    display: flex;
    gap: $spacing-lg;
    margin-bottom: $spacing-lg;

    .stat-mini {
      text-align: center;

      .value {
        display: block;
        font-size: 1.5rem;
        font-weight: 600;
        margin-bottom: $spacing-xs;

        &.warning {
          color: #ffeb3b;
        }
      }

      .label {
        font-size: 0.8rem;
        opacity: 0.9;
      }
    }
  }

  .milestone-progress {
    background: rgba(255, 255, 255, 0.1);
    padding: $spacing-lg;
    border-radius: $border-radius-md;
    margin-bottom: $spacing-lg;

    .milestone-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: $spacing-sm;

      h6 {
        margin: 0;
        color: white;
        font-weight: 600;
      }

      .milestone-target {
        font-size: 0.9rem;
        opacity: 0.9;
      }
    }

    .progress-container {
      margin-bottom: $spacing-sm;

      .progress {
        background: rgba(255, 255, 255, 0.2);

        .determinate {
          background: white;
        }
      }

      .progress-text {
        font-size: 0.85rem;
        opacity: 0.9;
        margin-top: $spacing-xs;
        display: block;
      }
    }

    .remaining-text {
      margin: 0;
      font-size: 0.9rem;
      opacity: 0.9;
    }
  }

  .quick-links {
    display: flex;
    gap: $spacing-md;
    margin-bottom: $spacing-lg;

    .quick-link {
      display: flex;
      flex-direction: column;
      align-items: center;
      text-decoration: none;
      color: white;
      padding: $spacing-sm;
      border-radius: $border-radius-md;
      background: rgba(255, 255, 255, 0.1);
      transition: background 0.3s ease;
      gap: $spacing-xs;

      &:hover {
        background: rgba(255, 255, 255, 0.2);
        color: white;
      }

      span {
        font-size: 0.8rem;
        text-align: center;
      }
    }
  }

  .earn-more-section {
    h6 {
      color: white;
      margin: 0 0 $spacing-md;
      font-weight: 600;
    }

    .earn-methods {
      .earn-method {
        display: flex;
        align-items: center;
        gap: $spacing-sm;
        margin-bottom: $spacing-sm;
        color: white;

        span {
          font-size: 0.9rem;
          opacity: 0.9;
        }
      }
    }
  }
}

// Form Actions
.form-actions {
  display: flex;
  justify-content: flex-end;
  gap: $spacing-md;
  margin-top: $spacing-lg;
  padding-top: $spacing-lg;
  border-top: 1px solid #f0f0f0;

  .btn,
  .btn-flat {
    display: flex;
    align-items: center;
  }
}

.password-requirements {
  margin: $spacing-lg 0;

  h6 {
    color: #2c3e50;
    margin: 0 0 $spacing-md;
    font-weight: 600;
  }

  .password-checklist {
    list-style: none;
    padding: 0;
    margin: 0;

    li {
      display: flex;
      align-items: center;
      gap: $spacing-sm;
      margin-bottom: $spacing-xs;
      color: #6c757d;
      font-size: 0.9rem;

      svg {
        color: #e0e0e0;
      }

      &.valid {
        color: $success-color;

        svg {
          color: $success-color;
        }
      }
    }
  }
}

// Account Actions Styles
.account-actions {
  .action-item {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: $spacing-lg;
    border: 1px solid #e0e0e0;
    border-radius: $border-radius-md;
    margin-bottom: $spacing-md;

    &.danger {
      border-color: rgba($error-color, 0.3);
      background: rgba($error-color, 0.05);
    }

    .action-info {
      flex: 1;

      h6 {
        margin: 0 0 $spacing-xs;
        color: #2c3e50;
        font-weight: 600;
      }

      p {
        margin: 0 0 $spacing-xs;
        color: #6c757d;
        font-size: 0.9rem;
      }

      .warning-text {
        color: $error-color;
        font-weight: 500;
        font-size: 0.8rem;
      }

      .status-indicator {
        display: inline-block;
        padding: $spacing-xs $spacing-sm;
        border-radius: $border-radius-sm;
        font-size: 0.75rem;
        font-weight: 500;
        text-transform: uppercase;

        &.enabled {
          background: rgba($success-color, 0.1);
          color: $success-color;
          border: 1px solid rgba($success-color, 0.3);
        }

        &.disabled {
          background: rgba($error-color, 0.1);
          color: $error-color;
          border: 1px solid rgba($error-color, 0.3);
        }
      }
    }

    .btn {
      display: flex;
      align-items: center;
    }
  }
}

// Button Styles
.btn {
  &.btn-primary {
    background: $primary-color;

    &:hover {
      background: darken($primary-color, 10%);
    }
  }

  &.btn-secondary {
    background: #6c757d;
    color: white;

    &:hover {
      background: darken(#6c757d, 10%);
    }
  }
}

// Animations
@keyframes spin {
  0% {
    transform: rotate(0deg);
  }

  100% {
    transform: rotate(360deg);
  }
}

// Mobile responsive fixes
@media (max-width: 600px) {
  .user-profile-page {
    .input-field {
      .prefix {
        left: 8px;
        top: 16px;
      }

      input {
        padding-left: 38px;
        background-image: linear-gradient(to right, transparent 36px, #e0e0e0 36px) !important;

        &:focus,
        &:focus:not([readonly]) {
          background-image: linear-gradient(to right, transparent 36px, $primary-color 36px) !important;
        }

        &.valid,
        &.valid:not([readonly]) {
          background-image: linear-gradient(to right, transparent 36px, #4CAF50 36px) !important;
        }

        &.invalid,
        &.invalid:not([readonly]) {
          background-image: linear-gradient(to right, transparent 36px, #f44336 36px) !important;
        }

        &.disabled {
          background-image: linear-gradient(to right, transparent 36px, #e0e0e0 36px) !important;
        }
      }

      label {
        left: 38px;

        &.active {
          left: 38px;
        }
      }

      .helper-text {
        margin-left: 38px;
      }
    }
  }
}

// Responsive Design
@media (max-width: 992px) {
  .profile-card {
    position: static;
    margin-bottom: $spacing-xl;
  }

  .loyalty-stats-mini {
    flex-wrap: wrap;
    gap: $spacing-md;

    .stat-mini {
      flex: 1;
      min-width: 120px;
    }
  }

  .quick-links {
    flex-wrap: wrap;

    .quick-link {
      flex: 1;
      min-width: 100px;
    }
  }
}

@media (max-width: 768px) {
  .user-profile-page {
    padding: $spacing-md 0;
  }

  .header-content {
    padding: $spacing-lg;
    flex-direction: column;
    gap: $spacing-md;
    text-align: center;
  }

  .profile-avatar {
    width: 150px;
    height: 150px;
  }

  .profile-stats {
    flex-direction: column;
    gap: $spacing-md;
  }

  .points-display {
    flex-direction: column;
    gap: $spacing-md;
    text-align: center;
  }

  .account-actions .action-item {
    flex-direction: column;
    gap: $spacing-md;
    text-align: center;
  }
}

@media (max-width: 600px) {
  .custom-card {
    padding: $spacing-lg;
  }

  .form-actions {
    flex-direction: column;

    .btn,
    .btn-flat {
      width: 100%;
      margin: 0;
      justify-content: center;
    }
  }
}

// GLOBAL OVERRIDE - ĐẢM BẢO KHÔNG CÓ CONFLICT VỚI MATERIALIZE
:deep(.input-field) {
  input[type=text],
  input[type=email], 
  input[type=tel],
  input[type=password] {
    // FORCE REMOVE ALL MATERIALIZE BORDERS AND SHADOWS
    border: none !important;
    border-bottom: none !important;
    outline: none !important;
    box-shadow: none !important;
    -webkit-box-shadow: none !important;
    -moz-box-shadow: none !important;
    
    // Remove any pseudo elements that might create extra lines
    &:before,
    &:after {
      display: none !important;
    }
    
    // Focus states - COMPLETELY OVERRIDE MATERIALIZE
    &:focus,
    &:focus:not([readonly]),
    &:focus:not([readonly]):not(.browser-default) {
      border: none !important;
      border-bottom: none !important;
      outline: none !important;
      box-shadow: none !important;
      -webkit-box-shadow: none !important;
      -moz-box-shadow: none !important;
    }
    
    // Valid/Invalid states
    &.valid,
    &.valid:not([readonly]),
    &.invalid,
    &.invalid:not([readonly]) {
      border: none !important;
      border-bottom: none !important;
      box-shadow: none !important;
    }
  }
  
  // Remove any potential underline pseudo elements
  &:before,
  &:after {
    display: none !important;
  }
  
  // Ensure labels don't interfere
  label {
    &:before,
    &:after {
      display: none !important;
    }
  }
}
</style>