<template>
  <div class="user-profile-page">
    <div class="container">
      <!-- Page Header -->
      <div class="page-header">
        <div class="header-content">
          <div class="header-info">
            <i class="material-icons">account_circle</i>
            <div class="header-text">
              <h4>My Profile</h4>
              <p>Manage your account settings and preferences</p>
            </div>
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
                <img 
                  :src="getAvatarUrl()" 
                  :alt="profile?.name"
                  @error="handleAvatarError"
                  class="avatar-image"
                >
                
                <!-- Avatar Upload Overlay -->
                <div class="avatar-overlay" :class="{ 'uploading': uploadingAvatar }">
                  <label for="avatar-upload" class="avatar-upload-label">
                    <i class="material-icons">{{ uploadingAvatar ? 'hourglass_empty' : 'camera_alt' }}</i>
                    <span class="upload-text">{{ uploadingAvatar ? 'Uploading...' : 'Change Photo' }}</span>
                  </label>
                  <input 
                    id="avatar-upload"
                    type="file" 
                    accept="image/*"
                    @change="handleAvatarChange"
                    :disabled="uploadingAvatar"
                    style="display: none"
                  >
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
          <!-- Profile Information Form -->
          <div class="custom-card profile-form-card">
            <div class="card-header">
              <h5>
                <i class="material-icons">person</i>
                Profile Information
              </h5>
            </div>
            
            <form @submit.prevent="updateProfile" class="profile-form">
              <div class="row">
                <div class="input-field col s12">
                  <i class="material-icons prefix">account_circle</i>
                  <input 
                    id="name" 
                    type="text" 
                    v-model="form.name"
                    required
                    class="validate"
                  >
                  <label for="name" :class="{ active: form.name }">Full Name</label>
                  <span class="helper-text" data-error="Name is required">Enter your full name</span>
                </div>
                
                <div class="input-field col s12">
                  <i class="material-icons prefix">email</i>
                  <input 
                    id="email" 
                    type="email" 
                    v-model="form.email"
                    disabled
                    class="disabled"
                  >
                  <label for="email" class="active">Email Address</label>
                  <span class="helper-text">Email cannot be changed for security reasons</span>
                </div>
                
                <div class="input-field col s12">
                  <i class="material-icons prefix">phone</i>
                  <input 
                    id="phone" 
                    type="tel" 
                    v-model="form.phone"
                    class="validate"
                  >
                  <label for="phone" :class="{ active: !!form.phone }">Phone Number</label>
                  <span class="helper-text" data-error="Invalid phone number">Optional: Your contact number</span>
                </div>
              </div>
              
              <!-- Form Actions -->
              <div class="form-actions">
                <button 
                  type="button"
                  class="btn-flat waves-effect"
                  @click="resetForm"
                  :disabled="!hasChanges"
                >
                  Reset
                </button>
                
                <button 
                  type="submit" 
                  class="btn btn-primary waves-effect waves-light"
                  :disabled="!hasChanges || updating"
                >
                  <i class="material-icons left">{{ updating ? 'hourglass_empty' : 'save' }}</i>
                  {{ updating ? 'Updating...' : 'Update Profile' }}
                </button>
              </div>
            </form>
          </div>
          
          <!-- Change Password Form -->
          <div class="custom-card password-form-card">
            <div class="card-header">
              <h5>
                <i class="material-icons">lock</i>
                Change Password
              </h5>
            </div>
            
            <form @submit.prevent="changePassword" class="password-form">
              <div class="row">
                <div class="input-field col s12">
                  <i class="material-icons prefix">lock_outline</i>
                  <input 
                    id="currentPassword" 
                    type="password" 
                    v-model="passwordForm.currentPassword"
                    required
                    class="validate"
                  >
                  <label for="currentPassword">Current Password</label>
                  <span class="helper-text" data-error="Current password is required">Enter your current password</span>
                </div>
                
                <div class="input-field col s12">
                  <i class="material-icons prefix">lock</i>
                  <input 
                    id="newPassword" 
                    type="password" 
                    v-model="passwordForm.newPassword"
                    required
                    minlength="6"
                    class="validate"
                    :class="{ 'valid': isPasswordValid, 'invalid': passwordForm.newPassword && !isPasswordValid }"
                  >
                  <label for="newPassword">New Password</label>
                  <span class="helper-text" data-error="Password must be at least 6 characters">
                    Password strength: {{ getPasswordStrength() }}
                  </span>
                </div>
                
                <div class="input-field col s12">
                  <i class="material-icons prefix">lock</i>
                  <input 
                    id="confirmPassword" 
                    type="password" 
                    v-model="passwordForm.confirmPassword"
                    required
                    class="validate"
                    :class="{ 'valid': passwordsMatch && passwordForm.confirmPassword, 'invalid': passwordForm.confirmPassword && !passwordsMatch }"
                  >
                  <label for="confirmPassword">Confirm New Password</label>
                  <span class="helper-text" data-error="Passwords do not match">Re-enter your new password</span>
                </div>
              </div>
              
              <!-- Password Requirements -->
              <div class="password-requirements">
                <h6>Password Requirements:</h6>
                <ul class="password-checklist">
                  <li :class="{ 'valid': passwordForm.newPassword?.length >= 6 }">
                    <i class="material-icons">{{ passwordForm.newPassword?.length >= 6 ? 'check' : 'close' }}</i>
                    At least 6 characters
                  </li>
                  <li :class="{ 'valid': /[A-Z]/.test(passwordForm.newPassword) }">
                    <i class="material-icons">{{ /[A-Z]/.test(passwordForm.newPassword) ? 'check' : 'close' }}</i>
                    One uppercase letter
                  </li>
                  <li :class="{ 'valid': /[0-9]/.test(passwordForm.newPassword) }">
                    <i class="material-icons">{{ /[0-9]/.test(passwordForm.newPassword) ? 'check' : 'close' }}</i>
                    One number
                  </li>
                </ul>
              </div>
              
              <!-- Form Actions -->
              <div class="form-actions">
                <button 
                  type="button"
                  class="btn-flat waves-effect"
                  @click="resetPasswordForm"
                >
                  Clear
                </button>
                
                <button 
                  type="submit" 
                  class="btn btn-primary waves-effect waves-light"
                  :disabled="!canChangePassword || changingPassword"
                >
                  <i class="material-icons left">{{ changingPassword ? 'hourglass_empty' : 'security' }}</i>
                  {{ changingPassword ? 'Changing...' : 'Change Password' }}
                </button>
              </div>
            </form>
          </div>
          
          <!-- Account Actions -->
          <div class="custom-card account-actions-card">
            <div class="card-header">
              <h5>
                <i class="material-icons">settings</i>
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
                  Export Data
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
                  <i class="material-icons left">delete_forever</i>
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
import { useToast } from 'vue-toastification'
import { formatDate } from '@/utils/formatters'
import { getStaticUrl } from '@/services/api'
import authService from '@/services/auth.service'

const authStore = useAuthStore()
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
    console.error('Error uploading avatar:', error)
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
    console.error('Error updating profile:', error)
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
    console.error('Error changing password:', error)
    toast.error('Failed to change password. Please check your current password.')
  } finally {
    changingPassword.value = false
  }
}

const resetForm = () => {
  if (profile.value) {
    form.value = {
      name: profile.value.name || '',
      email: profile.value.email || '',
      phone: profile.value.phone || ''
    }
    
    nextTick(() => {
      if (window.M?.updateTextFields) {
        window.M.updateTextFields()
      }
    })
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
      console.error('Error fetching profile:', error)
    }
  }
  
  // Initialize Materialize
  nextTick(() => {
    if (window.M?.updateTextFields) {
      window.M.updateTextFields()
    }
  })
})
</script>

<style scoped lang="scss">
// Import variables
@import '@/assets/styles/variables';

.user-profile-page {
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
      
      i {
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
      
      i {
        font-size: 18px;
        margin-bottom: 2px;
      }
      
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
  margin-bottom: $spacing-xl;
  
  .card-header {
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
}

.profile-form,
.password-form {
  .input-field {
    margin-bottom: $spacing-lg;
    
    .prefix {
      color: $primary-color;
    }
    
    input:focus + label,
    input.valid + label {
      color: $primary-color;
    }
    
    input:focus {
      border-bottom: 1px solid $primary-color;
      box-shadow: 0 1px 0 0 $primary-color;
    }
    
    input.disabled {
      color: #9e9e9e;
    }
    
    .helper-text {
      font-size: 0.8rem;
      
      &[data-error] {
        color: $error-color;
      }
    }
  }
}

.form-actions {
  display: flex;
  justify-content: flex-end;
  gap: $spacing-md;
  margin-top: $spacing-xl;
  padding-top: $spacing-lg;
  border-top: 1px solid #f0f0f0;
  
  .btn-flat {
    color: #6c757d;
    
    &:hover {
      background: #f8f9fa;
    }
    
    &:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }
  }
  
  .btn {
    &:disabled {
      opacity: 0.7;
      cursor: not-allowed;
    }
  }
}

.password-requirements {
  background: #f8f9fa;
  border-radius: $border-radius-md;
  padding: $spacing-md;
  margin-bottom: $spacing-lg;
  
  h6 {
    margin: 0 0 $spacing-sm;
    color: #495057;
    font-size: 0.9rem;
    font-weight: 600;
  }
  
  .password-checklist {
    list-style: none;
    margin: 0;
    padding: 0;
    
    li {
      display: flex;
      align-items: center;
      gap: $spacing-xs;
      margin-bottom: $spacing-xs;
      font-size: 0.85rem;
      color: #6c757d;
      
      &.valid {
        color: $success-color;
        
        i {
          color: $success-color;
        }
      }
      
      i {
        font-size: 16px;
        color: #dee2e6;
      }
    }
  }
}

.account-actions {
  .action-item {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: $spacing-lg;
    border: 1px solid #e9ecef;
    border-radius: $border-radius-md;
    margin-bottom: $spacing-md;
    
    &:last-child {
      margin-bottom: 0;
    }
    
    &.danger {
      border-color: rgba($error-color, 0.3);
      background: rgba($error-color, 0.02);
    }
    
    .action-info {
      flex: 1;
      
      h6 {
        margin: 0 0 $spacing-xs;
        color: #2c3e50;
        font-weight: 600;
      }
      
      p {
        margin: 0;
        color: #6c757d;
        font-size: 0.9rem;
      }
      
      .warning-text {
        display: block;
        color: $error-color;
        font-size: 0.8rem;
        margin-top: $spacing-xs;
        font-weight: 500;
      }
    }
  }
}

// Animations
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
  
  .profile-avatar {
    width: 150px;
    height: 150px;
    
    .avatar-overlay {
      .avatar-upload-label {
        width: 45px;
        height: 45px;
        
        i {
          font-size: 16px;
        }
        
        .upload-text {
          font-size: 7px;
        }
      }
    }
  }
  
  .profile-stats {
    .stat-item {
      .stat-value {
        font-size: 1.5rem;
      }
    }
  }
  
  .form-actions {
    flex-direction: column;
    
    .btn,
    .btn-flat {
      width: 100%;
    }
  }
  
  .account-actions {
    .action-item {
      flex-direction: column;
      text-align: center;
      gap: $spacing-md;
    }
  }
}

@media (max-width: $mobile) {
  .user-profile-page {
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
  
  .profile-avatar {
    width: 120px;
    height: 120px;
    margin-bottom: $spacing-md;
    
    .avatar-overlay {
      .avatar-upload-label {
        width: 40px;
        height: 40px;
        
        i {
          font-size: 14px;
        }
        
        .upload-text {
          display: none;
        }
      }
    }
  }
  
  .user-info {
    .user-name {
      font-size: 1.3rem;
    }
  }
  
  .profile-stats {
    padding-top: $spacing-md;
    
    .stat-item {
      .stat-value {
        font-size: 1.3rem;
      }
      
      .stat-label {
        font-size: 0.8rem;
      }
    }
  }
  
  .profile-form,
  .password-form {
    .input-field {
      margin-bottom: $spacing-md;
    }
  }
  
  .password-requirements {
    padding: $spacing-sm;
    
    .password-checklist {
      li {
        font-size: 0.8rem;
        margin-bottom: $spacing-xs;
        
        i {
          font-size: 14px;
        }
      }
    }
  }
}

// Additional utility classes using variables
.text-primary { color: $primary-color !important; }
.text-secondary { color: $secondary-color !important; }
.text-success { color: $success-color !important; }
.text-error { color: $error-color !important; }
.text-warning { color: $warning-color !important; }
.text-info { color: $info-color !important; }

.bg-primary { background-color: $primary-color !important; }
.bg-secondary { background-color: $secondary-color !important; }
.bg-success { background-color: $success-color !important; }
.bg-error { background-color: $error-color !important; }
.bg-warning { background-color: $warning-color !important; }
.bg-info { background-color: $info-color !important; }

// Enhanced hover effects
.profile-card {
  transition: transform 0.3s ease, box-shadow 0.3s ease;
  
  &:hover {
    transform: translateY(-2px);
    box-shadow: $shadow-lg;
  }
}

.custom-card {
  transition: all 0.3s ease;
  
  &:hover {
    box-shadow: $shadow-lg;
  }
}

// Loading states
.loading {
  position: relative;
  overflow: hidden;
  
  &::after {
    content: '';
    position: absolute;
    top: 0;
    left: -100%;
    width: 100%;
    height: 100%;
    background: linear-gradient(
      90deg,
      transparent,
      rgba(255, 255, 255, 0.6),
      transparent
    );
    animation: loading-shimmer 1.5s infinite;
  }
}

@keyframes loading-shimmer {
  0% {
    left: -100%;
  }
  100% {
    left: 100%;
  }
}

// Focus improvements for accessibility
.btn:focus,
.btn-flat:focus,
input:focus,
.avatar-upload-label:focus {
  outline: 2px solid $primary-color;
  outline-offset: 2px;
}

// Print styles
@media print {
  .header-actions,
  .form-actions,
  .account-actions,
  .avatar-overlay {
    display: none !important;
  }
  
  .user-profile-page {
    background: white !important;
  }
  
  .custom-card {
    box-shadow: none !important;
    border: 1px solid #ddd !important;
  }
}
</style>