<!-- src/views/profile/UserProfile.vue -->
<template>
  <div class="container">
    <h4>My Profile</h4>
    
    <div class="row">
      <div class="col s12 m4">
        <!-- Profile Picture -->
        <div class="custom-card center-align">
          <div class="profile-avatar">
            <img 
              :src="getAvatarUrl()" 
              :alt="profile?.name"
              @error="handleAvatarError"
            >
            <div class="avatar-overlay" :class="{ 'uploading': uploadingAvatar }">
              <label for="avatar-upload">
                <i class="material-icons">{{ uploadingAvatar ? 'hourglass_empty' : 'camera_alt' }}</i>
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
          
          <h5>{{ profile?.name }}</h5>
          <p>{{ profile?.email }}</p>
          
          <div class="profile-stats">
            <div class="stat">
              <span class="stat-value">{{ profile?._count?.products || 0 }}</span>
              <span class="stat-label">Products</span>
            </div>
            <div class="stat">
              <span class="stat-value">{{ profile?._count?.orders || 0 }}</span>
              <span class="stat-label">Orders</span>
            </div>
            <div class="stat">
              <span class="stat-value">{{ profile?._count?.reviews || 0 }}</span>
              <span class="stat-label">Reviews</span>
            </div>
          </div>
        </div>
      </div>
      
      <div class="col s12 m8">
        <!-- Profile Information -->
        <div class="custom-card">
          <h5>Profile Information</h5>
          
          <form @submit.prevent="updateProfile">
            <div class="row">
              <div class="input-field col s12">
                <input 
                  id="name" 
                  type="text" 
                  v-model="form.name"
                  required
                >
                <label for="name" :class="{ active: form.name }">Full Name</label>
              </div>
              
              <div class="input-field col s12">
                <input 
                  id="email" 
                  type="email" 
                  v-model="form.email"
                  disabled
                >
                <label for="email" class="active">Email</label>
                <span class="helper-text">Email cannot be changed</span>
              </div>
              
              <div class="input-field col s12">
                <input 
                  id="phone" 
                  type="tel" 
                  v-model="form.phone"
                >
                <label for="phone" :class="{ active: !!form.phone }">Phone Number</label>
              </div>
            </div>
            
            <button 
              type="submit" 
              class="btn waves-effect waves-light"
              :disabled="!hasChanges || updating"
            >
              {{ updating ? 'Updating...' : 'Update Profile' }}
            </button>
          </form>
        </div>
        
        <!-- Change Password -->
        <div class="custom-card">
          <h5>Change Password</h5>
          
          <form @submit.prevent="changePassword">
            <div class="row">
              <div class="input-field col s12">
                <input 
                  id="currentPassword" 
                  type="password" 
                  v-model="passwordForm.currentPassword"
                  required
                >
                <label for="currentPassword">Current Password</label>
              </div>
              
              <div class="input-field col s12">
                <input 
                  id="newPassword" 
                  type="password" 
                  v-model="passwordForm.newPassword"
                  required
                  minlength="6"
                >
                <label for="newPassword">New Password</label>
                <span class="helper-text">Minimum 6 characters</span>
              </div>
              
              <div class="input-field col s12">
                <input 
                  id="confirmPassword" 
                  type="password" 
                  v-model="passwordForm.confirmPassword"
                  required
                >
                <label for="confirmPassword">Confirm New Password</label>
              </div>
            </div>
            
            <button 
              type="submit" 
              class="btn waves-effect waves-light"
              :disabled="changingPassword || !passwordForm.currentPassword || !passwordForm.newPassword || !passwordForm.confirmPassword"
            >
              {{ changingPassword ? 'Changing...' : 'Change Password' }}
            </button>
          </form>
        </div>
        
        <!-- Account Actions -->
        <div class="custom-card">
          <h5>Account Actions</h5>
          
          <p>Member since: {{ formatDate(profile?.createdAt) }}</p>
          
          <button 
            class="btn red waves-effect waves-light"
            @click="deleteAccount"
          >
            Delete Account
          </button>
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

const profile = computed(() => authStore.user)
const updating = ref(false)
const changingPassword = ref(false)
const uploadingAvatar = ref(false)

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

const hasChanges = computed(() => {
  return form.value.name !== profile.value?.name || 
         form.value.phone !== (profile.value?.phone || '')
})

const getAvatarUrl = () => {
  const avatarPath = profile.value?.avatar
  // Use UI Avatars as fallback with user's name
  const fallbackUrl = 'https://ui-avatars.com/api/?name=' + 
    encodeURIComponent(profile.value?.name || 'User') + 
    '&background=1976d2&color=fff&size=200'
  
  return getStaticUrl(avatarPath) || fallbackUrl
}

const handleAvatarError = (event) => {
  // Use UI Avatars as final fallback
  const fallbackUrl = 'https://ui-avatars.com/api/?name=' + 
    encodeURIComponent(profile.value?.name || 'User') + 
    '&background=1976d2&color=fff&size=200'
  event.target.src = fallbackUrl
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
    // Clear the input
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
  if (passwordForm.value.newPassword !== passwordForm.value.confirmPassword) {
    toast.error('Passwords do not match')
    return
  }
  
  if (passwordForm.value.newPassword.length < 6) {
    toast.error('Password must be at least 6 characters long')
    return
  }
  
  changingPassword.value = true
  
  try {
    await authService.changePassword({
      currentPassword: passwordForm.value.currentPassword,
      newPassword: passwordForm.value.newPassword
    })
    toast.success('Password changed successfully!')
    passwordForm.value = {
      currentPassword: '',
      newPassword: '',
      confirmPassword: ''
    }
  } catch (error) {
    console.error('Error changing password:', error)
    toast.error('Failed to change password. Please check your current password.')
  } finally {
    changingPassword.value = false
  }
}

const deleteAccount = () => {
  if (confirm('Are you sure you want to delete your account? This action cannot be undone.')) {
    toast.info('Account deletion feature coming soon')
    // TODO: Implement account deletion
  }
}

// Improved watch for form population
watch(profile, (newProfile) => {
  if (newProfile) {
    form.value = {
      name: newProfile.name || '',
      email: newProfile.email || '',
      phone: newProfile.phone || ''
    }
    
    // Trigger Materialize label update
    nextTick(() => {
      if (window.M && window.M.updateTextFields) {
        window.M.updateTextFields()
      }
    })
  }
}, { immediate: true, deep: true })

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
    if (window.M && window.M.updateTextFields) {
      window.M.updateTextFields()
    }
  })
})
</script>

<style scoped lang="scss">
.profile-avatar {
  position: relative;
  width: 200px;
  height: 200px;
  margin: 0 auto 20px;
  
  img {
    width: 100%;
    height: 100%;
    border-radius: 50%;
    object-fit: cover;
    border: 4px solid #e0e0e0;
  }
  
  .avatar-overlay {
    position: absolute;
    bottom: 10px;
    right: 10px;
    background: #1976d2;
    width: 40px;
    height: 40px;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
    transition: transform 0.2s;
    
    &:hover {
      transform: scale(1.1);
    }
    
    &.uploading {
      background: #ff9800;
      cursor: not-allowed;
      
      i {
        animation: spin 1s linear infinite;
      }
    }
    
    i {
      color: white;
      font-size: 20px;
    }
  }
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.profile-stats {
  display: flex;
  justify-content: space-around;
  margin-top: 30px;
  padding-top: 20px;
  border-top: 1px solid #e0e0e0;
  
  .stat {
    text-align: center;
    
    .stat-value {
      display: block;
      font-size: 2rem;
      font-weight: 600;
      color: #1976d2;
    }
    
    .stat-label {
      display: block;
      color: #666;
      font-size: 0.9rem;
    }
  }
}

.custom-card {
  background: white;
  border-radius: 8px;
  padding: 24px;
  margin-bottom: 24px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  
  h5 {
    margin-bottom: 20px;
    color: #333;
  }
  
  form {
    .helper-text {
      font-size: 0.85rem;
    }
  }
}
</style>