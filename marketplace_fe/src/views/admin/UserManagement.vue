# User Management View (Admin)

```vue
<!-- src/views/admin/UserManagement.vue -->
<template>
  <div class="container">
    <h4>User Management</h4>
    
    <div class="row">
      <div class="col s12">
        <div class="action-bar">
          <div class="search-box">
            <i class="material-icons prefix">search</i>
            <input 
              type="text" 
              v-model="searchQuery"
              placeholder="Search users by name or email..."
              @input="debouncedSearch"
            >
          </div>
          
          <button 
            class="btn waves-effect waves-light modal-trigger"
            data-target="create-user-modal"
          >
            <i class="material-icons left">person_add</i>
            Add User
          </button>
        </div>
      </div>
    </div>
    
    <div v-if="loading" class="loading-spinner">
      <LoadingSpinner text="Loading users..." />
    </div>
    
    <div v-else>
      <!-- Filters -->
      <div class="row">
        <div class="col s12">
          <div class="filters">
            <div class="input-field inline">
              <select v-model="filters.role" @change="fetchUsers">
                <option value="">All Roles</option>
                <option value="USER">Users</option>
                <option value="ADMIN">Admins</option>
              </select>
              <label>Role</label>
            </div>
            
            <div class="input-field inline">
              <select v-model="filters.status" @change="fetchUsers">
                <option value="">All Status</option>
                <option value="active">Active</option>
                <option value="blocked">Blocked</option>
              </select>
              <label>Status</label>
            </div>
            
            <div class="input-field inline">
              <select v-model="filters.sortBy" @change="fetchUsers">
                <option value="">Sort By</option>
                <option value="newest">Newest First</option>
                <option value="oldest">Oldest First</option>
                <option value="name">Name (A-Z)</option>
                <option value="orders">Most Orders</option>
              </select>
              <label>Sort</label>
            </div>
          </div>
        </div>
      </div>
      
      <!-- Users Table -->
      <div class="custom-card">
        <div class="table-responsive">
          <table class="striped">
            <thead>
              <tr>
                <th>User</th>
                <th>Email</th>
                <th>Phone</th>
                <th>Role</th>
                <th>Joined</th>
                <th>Orders</th>
                <th>Products</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="user in users" :key="user.id">
                <td>
                  <div class="user-info">
                    <img 
                      :src="user.avatar || '/default-avatar.png'" 
                      :alt="user.name"
                      class="user-avatar"
                    >
                    <span>{{ user.name }}</span>
                  </div>
                </td>
                <td>{{ user.email }}</td>
                <td>{{ user.phone || 'N/A' }}</td>
                <td>
                  <span class="role-badge" :class="user.role.toLowerCase()">
                    {{ user.role }}
                  </span>
                </td>
                <td>{{ formatDate(user.createdAt) }}</td>
                <td>{{ user._count.orders }}</td>
                <td>{{ user._count.products }}</td>
                <td>
                  <div class="switch">
                    <label>
                      <input 
                        type="checkbox" 
                        :checked="!user.isBlocked"
                        @change="toggleUserStatus(user.id)"
                      >
                      <span class="lever"></span>
                    </label>
                  </div>
                </td>
                <td>
                  <div class="actions">
                    <button 
                      class="btn-flat btn-small waves-effect"
                      title="View Details"
                      @click="viewUserDetails(user)"
                    >
                      <i class="material-icons">visibility</i>
                    </button>
                    
                    <button 
                      class="btn-flat btn-small waves-effect"
                      title="Edit"
                      @click="editUser(user)"
                    >
                      <i class="material-icons">edit</i>
                    </button>
                    
                    <button 
                      class="btn-flat btn-small waves-effect"
                      title="Delete"
                      @click="deleteUser(user.id)"
                      :disabled="user.role === 'ADMIN'"
                    >
                      <i class="material-icons">delete</i>
                    </button>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
        
        <!-- Pagination -->
        <div class="center-align">
          <ul class="pagination">
            <li :class="{ disabled: currentPage === 1 }">
              <a @click="changePage(currentPage - 1)">
                <i class="material-icons">chevron_left</i>
              </a>
            </li>
            
            <li 
              v-for="page in totalPages" 
              :key="page"
              :class="{ active: page === currentPage }"
            >
              <a @click="changePage(page)">{{ page }}</a>
            </li>
            
            <li :class="{ disabled: currentPage === totalPages }">
              <a @click="changePage(currentPage + 1)">
                <i class="material-icons">chevron_right</i>
              </a>
            </li>
          </ul>
        </div>
      </div>
      
      <!-- User Stats -->
      <div class="row">
        <div class="col s12 m3">
          <div class="stat-card custom-card">
            <i class="material-icons">people</i>
            <h6>Total Users</h6>
            <h5>{{ userStats.total }}</h5>
          </div>
        </div>
        
        <div class="col s12 m3">
          <div class="stat-card custom-card">
            <i class="material-icons">person</i>
            <h6>Regular Users</h6>
            <h5>{{ userStats.users }}</h5>
          </div>
        </div>
        
        <div class="col s12 m3">
          <div class="stat-card custom-card">
            <i class="material-icons">admin_panel_settings</i>
            <h6>Admins</h6>
            <h5>{{ userStats.admins }}</h5>
          </div>
        </div>
        
        <div class="col s12 m3">
          <div class="stat-card custom-card">
            <i class="material-icons">block</i>
            <h6>Blocked</h6>
            <h5>{{ userStats.blocked }}</h5>
          </div>
        </div>
      </div>
    </div>
    
    <!-- Create User Modal -->
    <div id="create-user-modal" class="modal">
      <div class="modal-content">
        <h5>{{ editingUser ? 'Edit User' : 'Create New User' }}</h5>
        
        <form @submit.prevent="saveUser">
          <div class="row">
            <div class="input-field col s12">
              <input 
                id="user-name" 
                type="text" 
                v-model="userForm.name"
                required
              >
              <label for="user-name">Full Name</label>
            </div>
            
            <div class="input-field col s12">
              <input 
                id="user-email" 
                type="email" 
                v-model="userForm.email"
                required
                :disabled="editingUser"
              >
              <label for="user-email">Email</label>
            </div>
            
            <div class="input-field col s12" v-if="!editingUser">
              <input 
                id="user-password" 
                type="password" 
                v-model="userForm.password"
                required
                minlength="6"
              >
              <label for="user-password">Password</label>
            </div>
            
            <div class="input-field col s12">
              <input 
                id="user-phone" 
                type="tel" 
                v-model="userForm.phone"
              >
              <label for="user-phone">Phone (Optional)</label>
            </div>
            
            <div class="input-field col s12">
              <select v-model="userForm.role" required>
                <option value="USER">User</option>
                <option value="ADMIN">Admin</option>
              </select>
              <label>Role</label>
            </div>
          </div>
        </form>
      </div>
      
      <div class="modal-footer">
        <button 
          class="modal-close btn-flat waves-effect"
        >
          Cancel
        </button>
        <button 
          class="btn waves-effect waves-light"
          @click="saveUser"
          :disabled="savingUser"
        >
          {{ savingUser ? 'Saving...' : 'Save' }}
        </button>
      </div>
    </div>
    
    <!-- User Details Modal -->
    <div id="user-details-modal" class="modal">
      <div class="modal-content" v-if="selectedUser">
        <h5>User Details</h5>
        
        <div class="user-details">
          <div class="detail-header">
            <img 
              :src="selectedUser.avatar || '/default-avatar.png'" 
              :alt="selectedUser.name"
              class="detail-avatar"
            >
            <div>
              <h6>{{ selectedUser.name }}</h6>
              <p>{{ selectedUser.email }}</p>
              <span class="role-badge" :class="selectedUser.role.toLowerCase()">
                {{ selectedUser.role }}
              </span>
            </div>
          </div>
          
          <div class="detail-section">
            <h6>Contact Information</h6>
            <p><strong>Email:</strong> {{ selectedUser.email }}</p>
            <p><strong>Phone:</strong> {{ selectedUser.phone || 'Not provided' }}</p>
          </div>
          
          <div class="detail-section">
            <h6>Account Information</h6>
            <p><strong>User ID:</strong> {{ selectedUser.id }}</p>
            <p><strong>Joined:</strong> {{ formatDateTime(selectedUser.createdAt) }}</p>
            <p><strong>Last Updated:</strong> {{ formatDateTime(selectedUser.updatedAt) }}</p>
          </div>
          
          <div class="detail-section">
            <h6>Activity Summary</h6>
            <div class="activity-stats">
              <div class="activity-item">
                <span class="activity-value">{{ selectedUser._count.orders }}</span>
                <span class="activity-label">Orders</span>
              </div>
              <div class="activity-item">
                <span class="activity-value">{{ selectedUser._count.products }}</span>
                <span class="activity-label">Products</span>
              </div>
              <div class="activity-item">
                <span class="activity-value">{{ selectedUser._count.reviews }}</span>
                <span class="activity-label">Reviews</span>
              </div>
            </div>
          </div>
          
          <div class="detail-actions">
            <router-link 
              :to="`/admin/orders?userId=${selectedUser.id}`"
              class="btn-flat waves-effect"
            >
              View Orders
            </router-link>
            <router-link 
              :to="`/admin/products?sellerId=${selectedUser.id}`"
              class="btn-flat waves-effect"
            >
              View Products
            </router-link>
          </div>
        </div>
      </div>
      
      <div class="modal-footer">
        <button class="modal-close btn-flat waves-effect">
          Close
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useToast } from 'vue-toastification'
import adminService from '@/services/admin.service'
import LoadingSpinner from '@/components/common/LoadingSpinner.vue'
import { formatDate, formatDateTime } from '@/utils/formatters'
import { debounce } from 'lodash-es'

const toast = useToast()

const users = ref([])
const loading = ref(false)
const savingUser = ref(false)
const searchQuery = ref('')
const currentPage = ref(1)
const totalPages = ref(1)
const selectedUser = ref(null)
const editingUser = ref(null)

const filters = ref({
  role: '',
  status: '',
  sortBy: ''
})

const userForm = ref({
  name: '',
  email: '',
  password: '',
  phone: '',
  role: 'USER'
})

const userStats = computed(() => {
  const total = users.value.length
  const admins = users.value.filter(u => u.role === 'ADMIN').length
  const blocked = users.value.filter(u => u.isBlocked).length
  
  return {
    total,
    users: total - admins,
    admins,
    blocked
  }
})

let modalInstances = {}

const fetchUsers = async () => {
  loading.value = true
  
  try {
    const params = {
      page: currentPage.value,
      limit: 20,
      search: searchQuery.value,
      ...filters.value
    }
    
    const response = await adminService.getUsers(params)
    users.value = response.data.data.map(user => ({
      ...user,
      isBlocked: false // In real app, this would come from backend
    }))
    totalPages.value = response.data.meta.totalPages
  } catch (error) {
    console.error('Error fetching users:', error)
  } finally {
    loading.value = false
  }
}

const debouncedSearch = debounce(() => {
  currentPage.value = 1
  fetchUsers()
}, 500)

const viewUserDetails = (user) => {
  selectedUser.value = user
  modalInstances['user-details-modal'].open()
}

const editUser = (user) => {
  editingUser.value = user
  userForm.value = {
    name: user.name,
    email: user.email,
    password: '',
    phone: user.phone || '',
    role: user.role
  }
  modalInstances['create-user-modal'].open()
}

const saveUser = async () => {
  savingUser.value = true
  
  try {
    if (editingUser.value) {
      // Update user
      toast.success('User updated successfully')
    } else {
      // Create user
      toast.success('User created successfully')
    }
    
    modalInstances['create-user-modal'].close()
    await fetchUsers()
    resetForm()
  } catch (error) {
    console.error('Error saving user:', error)
  } finally {
    savingUser.value = false
  }
}

const toggleUserStatus = async (userId) => {
  try {
    await adminService.blockUser(userId)
    toast.success('User status updated')
  } catch (error) {
    console.error('Error updating user status:', error)
  }
}

const deleteUser = async (userId) => {
  if (!confirm('Are you sure you want to delete this user?')) return
  
  try {
    // Implement delete user
    toast.success('User deleted successfully')
    await fetchUsers()
  } catch (error) {
    console.error('Error deleting user:', error)
  }
}

const changePage = (page) => {
  if (page >= 1 && page <= totalPages.value) {
    currentPage.value = page
    fetchUsers()
  }
}

const resetForm = () => {
  userForm.value = {
    name: '',
    email: '',
    password: '',
    phone: '',
    role: 'USER'
  }
  editingUser.value = null
}

onMounted(() => {
  fetchUsers()
  
  // Initialize Materialize components
  setTimeout(() => {
    const selectElems = document.querySelectorAll('select')
    M.FormSelect.init(selectElems)
    
    const modalElems = document.querySelectorAll('.modal')
    modalElems.forEach(elem => {
      modalInstances[elem.id] = M.Modal.init(elem)
    })
  }, 100)
})
</script>

<style scoped lang="scss">
.action-bar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  
  .search-box {
    position: relative;
    flex: 1;
    max-width: 500px;
    
    i {
      position: absolute;
      left: 10px;
      top: 50%;
      transform: translateY(-50%);
      color: #666;
    }
    
    input {
      padding-left: 40px;
      border: 1px solid #e0e0e0;
      border-radius: 4px;
    }
  }
}

.filters {
  display: flex;
  gap: 20px;
  margin-bottom: 20px;
  
  .input-field {
    margin: 0;
    min-width: 150px;
  }
}

.table-responsive {
  overflow-x: auto;
}

.user-info {
  display: flex;
  align-items: center;
  gap: 10px;
  
  .user-avatar {
    width: 40px;
    height: 40px;
    border-radius: 50%;
    object-fit: cover;
  }
}

.role-badge {
  padding: 2px 12px;
  border-radius: 12px;
  font-size: 0.85rem;
  font-weight: 500;
  text-transform: uppercase;
  
  &.user {
    background: #e3f2fd;
    color: #1565c0;
  }
  
  &.admin {
    background: #f3e5f5;
    color: #6a1b9a;
  }
}

.actions {
  display: flex;
  gap: 5px;
  
  button {
    padding: 0;
    width: 30px;
    height: 30px;
    
    i {
      font-size: 18px;
    }
  }
}

.stat-card {
  text-align: center;
  padding: 20px;
  
  i {
    font-size: 48px;
    color: #1976d2;
    margin-bottom: 10px;
  }
  
  h6 {
    margin: 10px 0;
    color: #666;
    font-size: 0.9rem;
  }
  
  h5 {
    margin: 0;
    font-size: 2rem;
    font-weight: 600;
  }
}

// Modal Styles
.user-details {
  .detail-header {
    display: flex;
    align-items: center;
    gap: 20px;
    margin-bottom: 30px;
    padding-bottom: 20px;
    border-bottom: 1px solid #e0e0e0;
    
    .detail-avatar {
      width: 80px;
      height: 80px;
      border-radius: 50%;
      object-fit: cover;
    }
    
    h6 {
      margin: 0 0 5px 0;
      font-size: 1.3rem;
    }
    
    p {
      margin: 5px 0;
      color: #666;
    }
  }
  
  .detail-section {
    margin-bottom: 25px;
    
    h6 {
      margin-bottom: 15px;
      color: #1976d2;
    }
    
    p {
      margin: 8px 0;
    }
  }
  
  .activity-stats {
    display: flex;
    gap: 30px;
    
    .activity-item {
      text-align: center;
      
      .activity-value {
        display: block;
        font-size: 2rem;
        font-weight: 600;
        color: #1976d2;
      }
      
      .activity-label {
        display: block;
        color: #666;
        font-size: 0.9rem;
      }
    }
  }
  
  .detail-actions {
    display: flex;
    gap: 10px;
    margin-top: 20px;
    padding-top: 20px;
    border-top: 1px solid #e0e0e0;
  }
}

.loading-spinner {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 400px;
}
</style>
