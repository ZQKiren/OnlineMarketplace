<template>
  <div class="user-management-page">
    <div class="container">
      <!-- Page Header -->
      <div class="page-header">
        <div class="header-content">
          <div class="header-info">
            <Users :size="40" />
            <div class="header-text">
              <h4>User Management</h4>
              <p>Manage and monitor all system users</p>
            </div>
          </div>
        </div>
      </div>

      <!-- Loading State -->
      <div v-if="loading" class="loading-container">
        <LoadingSpinner text="Loading users..." />
      </div>

      <div v-else>
        <!-- Search and Filters -->
        <div class="custom-card filters-card">
          <div class="search-and-filters">
            <!-- Search Box -->
            <div class="search-container">
              <div class="search-box">
                <Search :size="20" class="search-icon" />
                <input type="text" v-model="searchQuery" placeholder="Search users by name or email..."
                  @input="debouncedSearch" class="search-input">
                <button v-if="searchQuery" @click="clearSearch" class="clear-search-btn">
                  <X :size="16" />
                </button>
              </div>
            </div>

            <!-- Filters -->
            <!-- ✅ FIXED: Filter section in template - change @change handlers -->
            <div class="filters-container">
              <div class="input-field">
                <Filter :size="20" class="prefix" />
                <select v-model="filters.role" @change="onFilterChange">
                  <option value="">All Roles</option>
                  <option value="USER">Users</option>
                  <option value="ADMIN">Admins</option>
                </select>
                <label>Role</label>
              </div>

              <div class="input-field">
                <Shield :size="20" class="prefix" />
                <select v-model="filters.status" @change="onFilterChange">
                  <option value="">All Status</option>
                  <option value="active">Active</option>
                  <option value="blocked">Blocked</option>
                </select>
                <label>Status</label>
              </div>

              <div class="input-field">
                <ArrowUpDown :size="20" class="prefix" />
                <select v-model="filters.sortBy" @change="onFilterChange">
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

        <!-- User Stats Cards -->
        <div class="stats-container">
          <div class="stat-card total">
            <div class="stat-icon">
              <Users :size="32" />
            </div>
            <div class="stat-content">
              <h3>{{ userStats.total }}</h3>
              <p>Total Users</p>
            </div>
          </div>

          <div class="stat-card users">
            <div class="stat-icon">
              <User :size="32" />
            </div>
            <div class="stat-content">
              <h3>{{ userStats.users }}</h3>
              <p>Regular Users</p>
            </div>
          </div>

          <div class="stat-card admins">
            <div class="stat-icon">
              <ShieldCheck :size="32" />
            </div>
            <div class="stat-content">
              <h3>{{ userStats.admins }}</h3>
              <p>Administrators</p>
            </div>
          </div>

          <div class="stat-card blocked">
            <div class="stat-icon">
              <UserX :size="32" />
            </div>
            <div class="stat-content">
              <h3>{{ userStats.blocked }}</h3>
              <p>Blocked Users</p>
            </div>
          </div>
        </div>

        <!-- Users Table -->
        <div class="custom-card table-card">
          <div class="card-header">
            <h5>
              <Database :size="24" />
              Users Database
            </h5>
            <div class="table-actions">
              <button class="btn-flat waves-effect" @click="refreshUsers" :disabled="refreshing">
                <RotateCcw :size="20" :class="{ 'spinning': refreshing }" />
                Refresh
              </button>
              <button class="btn-flat waves-effect" @click="exportUsers">
                <Download :size="20" />
                Export
              </button>
            </div>
          </div>

          <div class="table-responsive">
            <table class="users-table">
              <thead>
                <tr>
                  <th>User</th>
                  <th>Contact</th>
                  <th>Role</th>
                  <th>Joined</th>
                  <th>Activity</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="user in users" :key="user.id" class="user-row">
                  <td>
                    <div class="user-info">
                      <div class="user-avatar">
                        <img :src="getUserAvatar(user)" :alt="user.name" @error="handleAvatarError">
                      </div>
                      <div class="user-details">
                        <span class="user-name">{{ user.name }}</span>
                        <span class="user-id">#{{ user.id.slice(-8) }}</span>
                      </div>
                    </div>
                  </td>
                  <td>
                    <div class="contact-info">
                      <div class="contact-item">
                        <Mail :size="16" />
                        <span>{{ user.email }}</span>
                      </div>
                      <div class="contact-item" v-if="user.phone">
                        <Phone :size="16" />
                        <span>{{ user.phone }}</span>
                      </div>
                    </div>
                  </td>
                  <td>
                    <span class="role-badge" :class="getRoleClass(user.role)">
                      <ShieldCheck v-if="user.role === 'ADMIN'" :size="16" />
                      <User v-else :size="16" />
                      {{ user.role }}
                    </span>
                  </td>
                  <td>
                    <div class="date-info">
                      <span class="date">{{ formatDate(user.createdAt) }}</span>
                      <span class="time">{{ formatTime(user.createdAt) }}</span>
                    </div>
                  </td>
                  <td>
                    <div class="activity-summary">
                      <div class="activity-item">
                        <ShoppingBag :size="16" />
                        <span>{{ user._count?.orders || 0 }}</span>
                      </div>
                      <div class="activity-item">
                        <Package :size="16" />
                        <span>{{ user._count?.products || 0 }}</span>
                      </div>
                      <div class="activity-item">
                        <Star :size="16" />
                        <span>{{ user._count?.reviews || 0 }}</span>
                      </div>
                    </div>
                  </td>
                  <td>
                    <div class="status-container">
                      <!-- Status Badge -->
                      <span class="status-badge" :class="getUserStatusClass(user)">
                        <CheckCircle v-if="!user.isBlocked" :size="16" />
                        <XCircle v-else :size="16" />
                        {{ getUserStatusText(user) }}
                      </span>

                      <!-- Action Button -->
                      <button class="status-action-btn"
                        :class="{ 'block-btn': !user.isBlocked, 'unblock-btn': user.isBlocked }"
                        @click="toggleUserStatus(user)" :disabled="user.role === 'ADMIN'"
                        :title="user.role === 'ADMIN' ? 'Cannot block admin users' : (user.isBlocked ? 'Unblock user' : 'Block user')">
                        <UserCheck v-if="user.isBlocked" :size="16" />
                        <UserX v-else :size="16" />
                        {{ user.isBlocked ? 'Unblock' : 'Block' }}
                      </button>
                    </div>
                  </td>
                  <td>
                    <div class="actions-menu">
                      <button class="action-btn view" @click="viewUserDetails(user)" title="View Details">
                        <Eye :size="18" />
                      </button>

                      <!-- ❌ REMOVED: Duplicate Block/Unblock Button in actions menu -->

                      <button class="action-btn delete" @click="confirmDeleteUser(user)"
                        :disabled="user.role === 'ADMIN'" title="Delete User">
                        <Trash2 :size="18" />
                      </button>

                      <button class="action-btn more" @click="showUserMenu(user)" title="More Actions">
                        <MoreVertical :size="18" />
                      </button>
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          <!-- Empty State -->
          <div v-if="users.length === 0" class="empty-state">
            <UserX :size="64" />
            <h6>No users found</h6>
            <p>{{ searchQuery ? 'Try adjusting your search criteria' : 'No users have registered yet' }}</p>
          </div>

          <!-- Pagination -->
          <div class="pagination-container" v-if="totalPages > 1">
            <div class="pagination-info">
              <span>Showing {{ (currentPage - 1) * itemsPerPage + 1 }} to {{ Math.min(currentPage * itemsPerPage,
                totalItems) }} of {{ totalItems }} users</span>
            </div>
            <div class="pagination-controls">
              <button class="btn-flat waves-effect" @click="changePage(currentPage - 1)" :disabled="currentPage === 1">
                <ChevronLeft :size="20" />
                Previous
              </button>

              <div class="page-numbers">
                <button v-for="page in visiblePages" :key="page" class="page-btn"
                  :class="{ active: page === currentPage }" @click="changePage(page)">
                  {{ page }}
                </button>
              </div>

              <button class="btn-flat waves-effect" @click="changePage(currentPage + 1)"
                :disabled="currentPage === totalPages">
                Next
                <ChevronRight :size="20" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- User Details Modal -->
    <div id="user-details-modal" class="modal">
      <div class="modal-content" v-if="selectedUser">
        <div class="modal-header">
          <h5>
            <Eye :size="24" />
            User Details
          </h5>
          <button class="modal-close btn-flat">
            <X :size="24" />
          </button>
        </div>

        <div class="user-details">
          <div class="detail-header">
            <div class="detail-avatar">
              <img :src="getUserAvatar(selectedUser)" :alt="selectedUser.name" @error="handleAvatarError">
            </div>
            <div class="detail-info">
              <h6>{{ selectedUser.name }}</h6>
              <p>{{ selectedUser.email }}</p>
              <span class="role-badge" :class="getRoleClass(selectedUser.role)">
                <ShieldCheck v-if="selectedUser.role === 'ADMIN'" :size="16" />
                <User v-else :size="16" />
                {{ selectedUser.role }}
              </span>
            </div>
            <div class="detail-status">
              <span class="status-indicator" :class="getUserStatusClass(selectedUser)">
                <CheckCircle v-if="!selectedUser.isBlocked" :size="16" />
                <XCircle v-else :size="16" />
                {{ getUserStatusText(selectedUser) }}
              </span>

              <!-- Quick Action Button in Modal -->
              <button class="btn-small status-toggle-btn"
                :class="{ 'unblock-btn': selectedUser.isBlocked, 'block-btn': !selectedUser.isBlocked }"
                @click="toggleUserStatus(selectedUser)" :disabled="selectedUser.role === 'ADMIN'">
                <UserCheck v-if="selectedUser.isBlocked" :size="16" />
                <UserX v-else :size="16" />
                {{ selectedUser.isBlocked ? 'Unblock' : 'Block' }}
              </button>
            </div>
          </div>

          <div class="detail-sections">
            <div class="detail-section">
              <h6>
                <Phone :size="20" />
                Contact Information
              </h6>
              <div class="info-grid">
                <div class="info-item">
                  <Mail :size="16" />
                  <span>{{ selectedUser.email }}</span>
                </div>
                <div class="info-item" v-if="selectedUser.phone">
                  <Phone :size="16" />
                  <span>{{ selectedUser.phone }}</span>
                </div>
                <div class="info-item" v-else>
                  <Phone :size="16" />
                  <span class="no-data">No phone number provided</span>
                </div>
              </div>
            </div>

            <div class="detail-section">
              <h6>
                <Calendar :size="20" />
                Account Information
              </h6>
              <div class="info-grid">
                <div class="info-item">
                  <Hash :size="16" />
                  <span>ID: {{ selectedUser.id }}</span>
                </div>
                <div class="info-item">
                  <Calendar :size="16" />
                  <span>Joined: {{ formatDateTime(selectedUser.createdAt) }}</span>
                </div>
                <div class="info-item">
                  <Clock :size="16" />
                  <span>Last Updated: {{ formatDateTime(selectedUser.updatedAt) }}</span>
                </div>
              </div>
            </div>

            <div class="detail-section">
              <h6>
                <BarChart :size="20" />
                Activity Summary
              </h6>
              <div class="activity-stats">
                <div class="activity-card">
                  <ShoppingBag :size="24" />
                  <div class="activity-content">
                    <span class="activity-value">{{ selectedUser._count?.orders || 0 }}</span>
                    <span class="activity-label">Orders Placed</span>
                  </div>
                </div>
                <div class="activity-card">
                  <Package :size="24" />
                  <div class="activity-content">
                    <span class="activity-value">{{ selectedUser._count?.products || 0 }}</span>
                    <span class="activity-label">Products Listed</span>
                  </div>
                </div>
                <div class="activity-card">
                  <Star :size="24" />
                  <div class="activity-content">
                    <span class="activity-value">{{ selectedUser._count?.reviews || 0 }}</span>
                    <span class="activity-label">Reviews Written</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div class="detail-actions">
            <router-link :to="`/admin/orders?userId=${selectedUser.id}`" class="btn-flat waves-effect"
              @click="closeModal('user-details-modal')">
              <ShoppingBag :size="20" />
              View Orders
            </router-link>
            <router-link :to="`/admin/products?sellerId=${selectedUser.id}`" class="btn-flat waves-effect"
              @click="closeModal('user-details-modal')">
              <Package :size="20" />
              View Products
            </router-link>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
// Complete UserManagement.vue Script - CẢ 2 PHIÊN BẢN

import { ref, computed, onMounted } from 'vue'
import { useToast } from 'vue-toastification'
import adminService from '@/services/admin.service'
import LoadingSpinner from '@/components/common/LoadingSpinner.vue'
import { formatDate, formatDateTime, formatTime } from '@/utils/formatters'
import { debounce } from 'lodash-es'

// Icons import
import {
  Users, User, UserX, UserCheck, Search, Filter, Shield, ArrowUpDown,
  ShieldCheck, Database, RotateCcw, Download, Mail, Phone, Eye,
  Trash2, MoreVertical, ChevronLeft, ChevronRight, X,
  Clock, CheckCircle, XCircle, Calendar, Hash, BarChart, ShoppingBag,
  Package, Star
} from 'lucide-vue-next'

const toast = useToast()

// ✅ CHOOSE YOUR FILTERING APPROACH:
const USE_BACKEND_FILTERING = true // Set to false for frontend filtering

// Reactive state
const users = ref([])
const allUsers = ref([]) // For frontend filtering only
const loading = ref(false)
const refreshing = ref(false)
const searchQuery = ref('')
const currentPage = ref(1)
const totalPages = ref(1)
const totalItems = ref(0)
const itemsPerPage = ref(20)
const selectedUser = ref(null)

// ✅ Separate stats data
const statsData = ref({
  total: 0,
  users: 0,
  admins: 0,
  blocked: 0
})

const filters = ref({
  role: '',
  status: '',
  sortBy: ''
})

// ✅ FIXED: Use real stats data
const userStats = computed(() => statsData.value)

const getUserStatusText = (user) => {
  return user.isBlocked ? 'Blocked' : 'Active'
}

const getUserStatusClass = (user) => {
  return user.isBlocked ? 'blocked' : 'active'
}

const visiblePages = computed(() => {
  const pages = []
  const start = Math.max(1, currentPage.value - 2)
  const end = Math.min(totalPages.value, currentPage.value + 2)

  for (let i = start; i <= end; i++) {
    pages.push(i)
  }

  return pages
})

// Modal instances
let modalInstances = {}

// Methods
const getUserAvatar = (user) => {
  return user.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.name)}&background=1976d2&color=fff&size=200&bold=true`
}

const handleAvatarError = (event) => {
  event.target.src = '/default-avatar.png'
}

const getRoleClass = (role) => {
  return role.toLowerCase()
}

// ✅ VERSION 1: BACKEND FILTERING (RECOMMENDED)
const fetchUsersBackend = async () => {
  loading.value = true;
  try {
    const params = {
      page: currentPage.value,
      limit: itemsPerPage.value,
      search: searchQuery.value.trim() || undefined,
      role: filters.value.role || undefined,
      status: filters.value.status || undefined,
      sortBy: filters.value.sortBy || undefined,
    };
    Object.keys(params).forEach(key => {
      if (params[key] === undefined || params[key] === '') {
        delete params[key];
      }
    });
    const response = await adminService.getUsers(params);
    users.value = response.data.data || [];
    totalPages.value = response.data.meta?.totalPages || 1;
    totalItems.value = response.data.meta?.total || 0;
  } catch (error) {
    console.error('❌ Backend Filtering - Error:', error);
    toast.error('Failed to load users');
    users.value = [];
  } finally {
    loading.value = false;
    reinitializeSelects(); // Khởi tạo lại select
  }
};

const fetchUsersFrontend = async () => {
  if (allUsers.value.length === 0) {
    loading.value = true;
    try {
      const response = await adminService.getUsers({ page: 1, limit: 10000 });
      allUsers.value = response.data.data || [];
    } catch (error) {
      console.error('❌ Frontend Filtering - Error:', error);
      toast.error('Failed to load users');
      allUsers.value = [];
    } finally {
      loading.value = false;
    }
  }
  applyFrontendFilters();
  reinitializeSelects(); // Khởi tạo lại select
};

const refreshUsers = async () => {
  refreshing.value = true;
  try {
    if (!USE_BACKEND_FILTERING) {
      allUsers.value = [];
    }
    await Promise.all([fetchUsers(), fetchStats()]);
    toast.success('Users refreshed successfully');
  } catch (error) {
    toast.error('Failed to refresh users');
  } finally {
    refreshing.value = false;
    reinitializeSelects(); // Khởi tạo lại select
  }
};

const applyFrontendFilters = () => {
  console.log('🔍 Frontend Filtering - Applying filters:', {
    search: searchQuery.value,
    ...filters.value
  })

  let filteredUsers = [...allUsers.value]

  // Search filter
  if (searchQuery.value.trim()) {
    const search = searchQuery.value.trim().toLowerCase()
    filteredUsers = filteredUsers.filter(user =>
      user.name.toLowerCase().includes(search) ||
      user.email.toLowerCase().includes(search)
    )
  }

  // Role filter
  if (filters.value.role) {
    filteredUsers = filteredUsers.filter(user => user.role === filters.value.role)
  }

  // Status filter
  if (filters.value.status) {
    if (filters.value.status === 'blocked') {
      filteredUsers = filteredUsers.filter(user => user.isBlocked === true)
    } else if (filters.value.status === 'active') {
      filteredUsers = filteredUsers.filter(user => user.isBlocked === false)
    }
  }

  // Sort
  if (filters.value.sortBy) {
    switch (filters.value.sortBy) {
      case 'newest':
        filteredUsers.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
        break
      case 'oldest':
        filteredUsers.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt))
        break
      case 'name':
        filteredUsers.sort((a, b) => a.name.localeCompare(b.name))
        break
      case 'orders':
        filteredUsers.sort((a, b) => (b._count?.orders || 0) - (a._count?.orders || 0))
        break
    }
  }

  // Pagination
  totalItems.value = filteredUsers.length
  totalPages.value = Math.ceil(filteredUsers.length / itemsPerPage.value)

  const start = (currentPage.value - 1) * itemsPerPage.value
  const end = start + itemsPerPage.value
  users.value = filteredUsers.slice(start, end)

  console.log('✅ Frontend Filtering - Applied:', {
    filtered: filteredUsers.length,
    page: currentPage.value,
    showing: users.value.length
  })
}

// ✅ UNIFIED FETCH METHOD
const fetchUsers = () => {
  if (USE_BACKEND_FILTERING) {
    return fetchUsersBackend()
  } else {
    return fetchUsersFrontend()
  }
}

// ✅ FETCH REAL STATS
const fetchStats = async () => {
  try {
    console.log('📊 Fetching dashboard stats...')

    // Always get all users for accurate stats
    const allUsersResponse = await adminService.getUsers({ page: 1, limit: 10000 })
    const allUsersData = allUsersResponse.data.data || []

    const total = allUsersData.length
    const admins = allUsersData.filter(u => u.role === 'ADMIN').length
    const blocked = allUsersData.filter(u => u.isBlocked).length
    const regularUsers = total - admins

    statsData.value = {
      total,
      users: regularUsers,
      admins,
      blocked
    }

    console.log('✅ Stats updated:', statsData.value)

  } catch (error) {
    console.error('❌ Error fetching stats:', error)
    // Fallback to current page stats
    const total = users.value.length
    const admins = users.value.filter(u => u.role === 'ADMIN').length
    const blocked = users.value.filter(u => u.isBlocked).length

    statsData.value = {
      total,
      users: total - admins,
      admins,
      blocked
    }
  }
}

// ✅ SEARCH HANDLERS
const debouncedSearch = debounce(() => {
  console.log('🔍 Search triggered:', searchQuery.value)
  currentPage.value = 1

  if (USE_BACKEND_FILTERING) {
    fetchUsers()
  } else {
    applyFrontendFilters()
  }
}, 500)

const clearSearch = () => {
  console.log('🔍 Clearing search')
  searchQuery.value = ''
  currentPage.value = 1

  if (USE_BACKEND_FILTERING) {
    fetchUsers()
  } else {
    applyFrontendFilters()
  }
}

// ✅ FILTER CHANGE HANDLER
const onFilterChange = () => {
  console.log('🔍 Filter changed:', filters.value)
  currentPage.value = 1

  if (USE_BACKEND_FILTERING) {
    fetchUsers()
  } else {
    applyFrontendFilters()
  }
}

const viewUserDetails = (user) => {
  selectedUser.value = user
  modalInstances['user-details-modal'].open()
}

const toggleUserStatus = async (user) => {
  try {
    const action = user.isBlocked ? 'unblock' : 'block'
    const confirmMessage = user.isBlocked
      ? `Are you sure you want to unblock user "${user.name}"?`
      : `Are you sure you want to block user "${user.name}"?\n\nThis will prevent them from accessing the platform.`

    const confirmed = confirm(confirmMessage)
    if (!confirmed) return

    console.log(`🔄 ${action} user:`, user.id)

    let response
    if (user.isBlocked) {
      response = await adminService.unblockUser(user.id, { note: 'Unblocked by admin' })
    } else {
      response = await adminService.blockUser(user.id, { reason: 'Blocked by admin' })
    }

    // Update local state
    if (response.data.user) {
      const updatedUser = response.data.user
      const userIndex = users.value.findIndex(u => u.id === user.id)
      if (userIndex !== -1) {
        users.value[userIndex] = { ...users.value[userIndex], ...updatedUser }
      }

      // Update allUsers for frontend filtering
      if (!USE_BACKEND_FILTERING) {
        const allUserIndex = allUsers.value.findIndex(u => u.id === user.id)
        if (allUserIndex !== -1) {
          allUsers.value[allUserIndex] = { ...allUsers.value[allUserIndex], ...updatedUser }
        }
      }

      // Update selectedUser if it's the same user
      if (selectedUser.value && selectedUser.value.id === user.id) {
        selectedUser.value = { ...selectedUser.value, ...updatedUser }
      }
    } else {
      user.isBlocked = !user.isBlocked
    }

    // Refresh stats
    await fetchStats()

    toast.success(response.data.message)
  } catch (error) {
    console.error('❌ Error updating user status:', error)
    toast.error(error.response?.data?.message || 'Failed to update user status')
  }
}

const confirmDeleteUser = async (user) => {
  const confirmMessage = `⚠️ DELETE USER CONFIRMATION

User: ${user.name} (${user.email})
ID: ${user.id}

📊 Current Activity:
• Orders: ${user._count?.orders || 0}
• Products: ${user._count?.products || 0}  
• Reviews: ${user._count?.reviews || 0}

${user._count?.orders > 0 || user._count?.products > 0 || user._count?.reviews > 0
      ? '⚠️ WARNING: This user has associated data. They will be BLOCKED instead of deleted to preserve data integrity.'
      : '⚠️ WARNING: This action cannot be undone and will permanently remove all user data.'
    }

Are you sure you want to proceed?`

  const confirmed = confirm(confirmMessage)
  if (!confirmed) return

  try {
    const userIndex = users.value.findIndex(u => u.id === user.id)
    if (userIndex !== -1) {
      users.value[userIndex] = { ...users.value[userIndex], deleting: true }
    }

    console.log('🗑️ Deleting user:', user.id)

    const response = await adminService.deleteUser(user.id)

    if (response.data.deletedUserId) {
      toast.success(response.data.message || 'User deleted successfully')

      // Refresh data
      if (!USE_BACKEND_FILTERING) {
        allUsers.value = []
      }
      await Promise.all([fetchUsers(), fetchStats()])
    } else if (response.data.user && response.data.user.isBlocked) {
      toast.warning(response.data.message || 'User has been blocked instead of deleted due to existing data')

      if (userIndex !== -1) {
        users.value[userIndex] = { ...users.value[userIndex], ...response.data.user, deleting: false }
      }

      if (selectedUser.value && selectedUser.value.id === user.id) {
        selectedUser.value = { ...selectedUser.value, ...response.data.user }
      }

      await fetchStats()
    }

  } catch (error) {
    console.error('❌ Error deleting user:', error)

    const userIndex = users.value.findIndex(u => u.id === user.id)
    if (userIndex !== -1) {
      users.value[userIndex] = { ...users.value[userIndex], deleting: false }
    }

    if (error.response?.status === 403) {
      toast.error('You do not have permission to delete users')
    } else if (error.response?.status === 404) {
      toast.error('User not found')
    } else if (error.response?.status === 400) {
      toast.error(error.response?.data?.message || 'Cannot delete user due to existing relationships')
    } else {
      toast.error(error.response?.data?.message || 'Failed to delete user')
    }
  }
}

const showUserMenu = (user) => {
  toast.info('Additional user actions coming soon')
}

const exportUsers = () => {
  toast.info('Export functionality coming soon')
}

const changePage = (page) => {
  if (page >= 1 && page <= totalPages.value) {
    console.log('📄 Changing page to:', page)
    currentPage.value = page

    if (USE_BACKEND_FILTERING) {
      fetchUsers()
    } else {
      applyFrontendFilters()
    }
  }
}

const closeModal = (modalId) => {
  if (modalInstances[modalId]) {
    modalInstances[modalId].close()
  }
}

// Lifecycle
onMounted(async () => {
  console.log(`🚀 UserManagement mounted - Using ${USE_BACKEND_FILTERING ? 'BACKEND' : 'FRONTEND'} filtering`)

  await Promise.all([
    fetchUsers(),
    fetchStats()
  ])

  // Initialize Materialize components
  setTimeout(() => {
    const selectElems = document.querySelectorAll('select')
    M.FormSelect.init(selectElems)

    const modalElems = document.querySelectorAll('.modal')
    modalElems.forEach(elem => {
      modalInstances[elem.id] = M.Modal.init(elem, {
        dismissible: true,
        opacity: 0.5,
        inDuration: 300,
        outDuration: 200
      })
    })
  }, 100)
})

const reinitializeSelects = () => {
  setTimeout(() => {
    const selectElems = document.querySelectorAll('select');
    M.FormSelect.init(selectElems);
  }, 100); // Delay để đảm bảo DOM đã được cập nhật
};
</script>

<style scoped lang="scss">
// Import variables
@import '@/assets/styles/variables';

.user-management-page {
  background: #f8f9fa;
  min-height: 100vh;
  padding: $spacing-lg 0;
}

// Page Header
.page-header {
  margin-bottom: $spacing-xl;
}

.header-content {
  background: white;
  border-radius: $border-radius-lg;
  padding: $spacing-xl;
  box-shadow: $shadow-md;
  display: flex;
  justify-content: flex-start;
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
}

// Loading Container
.loading-container {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 400px;
}

// Filters Card
.filters-card {
  margin-bottom: $spacing-xl;
}

.search-and-filters {
  display: flex;
  flex-direction: column;
  gap: $spacing-lg;

  @media (min-width: 768px) {
    flex-direction: row;
    align-items: center;
    justify-content: space-between;
  }
}

.search-container {
  flex: 1;
  max-width: 500px;
}

.search-box {
  position: relative;
  display: flex;
  align-items: center;

  .search-icon {
    position: absolute;
    left: 12px;
    color: #6c757d;
    z-index: 1;
  }

  .search-input {
    width: 100%;
    padding: 12px 16px 12px 40px;
    border: 2px solid #e0e0e0;
    border-radius: $border-radius-md;
    font-size: 16px;
    transition: border-color 0.3s ease;

    &:focus {
      outline: none;
      border-color: $primary-color;
    }

    &::placeholder {
      color: #999;
    }
  }

  .clear-search-btn {
    position: absolute;
    right: 8px;
    background: none;
    border: none;
    padding: 4px;
    cursor: pointer;
    color: #6c757d;
    border-radius: 50%;

    &:hover {
      background: #f0f0f0;
    }
  }
}

.filters-container {
  display: flex;
  gap: $spacing-md;
  align-items: center;

  .input-field {
    margin: 0;
    min-width: 150px;

    .prefix {
      color: $primary-color;
      left: 10px;
      top: 16px;
    }

    select {
      padding-left: 35px;
    }

    label {
      left: 35px;
    }
  }
}

// Stats Container
.stats-container {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: $spacing-lg;
  margin-bottom: $spacing-xl;
}

.stat-card {
  background: white;
  border-radius: $border-radius-lg;
  padding: $spacing-lg;
  box-shadow: $shadow-md;
  display: flex;
  align-items: center;
  gap: $spacing-md;
  transition: transform 0.2s ease, box-shadow 0.2s ease;

  &:hover {
    transform: translateY(-2px);
    box-shadow: $shadow-lg;
  }

  .stat-icon {
    width: 60px;
    height: 60px;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    color: white;
  }

  .stat-content {
    h3 {
      margin: 0 0 $spacing-xs;
      font-size: 2rem;
      font-weight: 700;
      color: #2c3e50;
    }

    p {
      margin: 0;
      color: #6c757d;
      font-size: 0.9rem;
      font-weight: 500;
    }
  }

  &.total .stat-icon {
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  }

  &.users .stat-icon {
    background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
  }

  &.admins .stat-icon {
    background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%);
  }

  &.blocked .stat-icon {
    background: linear-gradient(135deg, #fa709a 0%, #fee140 100%);
  }
}

// Table Card
.table-card {
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

    .table-actions {
      display: flex;
      gap: $spacing-sm;

      .btn-flat {
        display: flex;
        align-items: center;
        gap: $spacing-xs;
        color: $primary-color;

        &:hover {
          background: rgba($primary-color, 0.1);
        }

        .spinning {
          animation: spin 1s linear infinite;
        }
      }
    }
  }
}

.table-responsive {
  overflow-x: auto;
}

.users-table {
  width: 100%;
  border-collapse: collapse;

  th,
  td {
    padding: $spacing-md;
    text-align: left;
    border-bottom: 1px solid #f0f0f0;
  }

  th {
    background: #f8f9fa;
    font-weight: 600;
    color: #2c3e50;
    font-size: 0.9rem;
    text-transform: uppercase;
    letter-spacing: 0.5px;
  }

  .user-row {
    transition: background-color 0.2s ease;

    &:hover {
      background: #f8f9fa;
    }
  }
}

.user-info {
  display: flex;
  align-items: center;
  gap: $spacing-sm;

  .user-avatar {
    width: 48px;
    height: 48px;
    border-radius: 50%;
    overflow: hidden;
    border: 2px solid #e3f2fd;

    img {
      width: 100%;
      height: 100%;
      object-fit: cover;
    }
  }

  .user-details {
    .user-name {
      display: block;
      font-weight: 600;
      color: #2c3e50;
      margin-bottom: 2px;
    }

    .user-id {
      display: block;
      font-size: 0.8rem;
      color: #6c757d;
      font-family: monospace;
    }
  }
}

.contact-info {
  .contact-item {
    display: flex;
    align-items: center;
    gap: $spacing-xs;
    margin-bottom: $spacing-xs;
    font-size: 0.9rem;
    color: #2c3e50;

    >svg {
      color: #6c757d;
    }

    &:last-child {
      margin-bottom: 0;
    }
  }
}

.role-badge {
  display: inline-flex;
  align-items: center;
  gap: $spacing-xs;
  padding: $spacing-xs $spacing-sm;
  border-radius: $border-radius-sm;
  font-size: 0.8rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.5px;

  &.user {
    background: rgba(33, 150, 243, 0.1);
    color: #1976d2;
    border: 1px solid rgba(33, 150, 243, 0.3);
  }

  &.admin {
    background: rgba(156, 39, 176, 0.1);
    color: #7b1fa2;
    border: 1px solid rgba(156, 39, 176, 0.3);
  }
}

.date-info {
  .date {
    display: block;
    font-weight: 500;
    color: #2c3e50;
    margin-bottom: 2px;
  }

  .time {
    display: block;
    font-size: 0.8rem;
    color: #6c757d;
  }
}

.activity-summary {
  display: flex;
  gap: $spacing-md;

  .activity-item {
    display: flex;
    align-items: center;
    gap: $spacing-xs;
    font-size: 0.9rem;
    color: #2c3e50;

    >svg {
      color: $primary-color;
    }
  }
}

.status-container {
  display: flex;
  flex-direction: column;
  gap: $spacing-xs;
  align-items: flex-start;
}

// Status Badge
.status-badge {
  display: inline-flex;
  align-items: center;
  gap: $spacing-xs;
  padding: $spacing-xs $spacing-sm;
  border-radius: $border-radius-sm;
  font-size: 0.8rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.5px;

  &.active {
    background: rgba(76, 175, 80, 0.1);
    color: #388e3c;
    border: 1px solid rgba(76, 175, 80, 0.3);
  }

  &.blocked {
    background: rgba(244, 67, 54, 0.1);
    color: #d32f2f;
    border: 1px solid rgba(244, 67, 54, 0.3);
  }
}

// Status Action Button
.status-action-btn {
  display: flex;
  align-items: center;
  gap: $spacing-xs;
  padding: $spacing-xs $spacing-sm;
  border: none;
  border-radius: $border-radius-sm;
  font-size: 0.75rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
  min-width: 80px;
  justify-content: center;

  &.block-btn {
    background: rgba(255, 152, 0, 0.1);
    color: #f57c00;
    border: 1px solid rgba(255, 152, 0, 0.3);

    &:hover:not(:disabled) {
      background: rgba(255, 152, 0, 0.2);
      transform: translateY(-1px);
    }
  }

  &.unblock-btn {
    background: rgba(76, 175, 80, 0.1);
    color: #388e3c;
    border: 1px solid rgba(76, 175, 80, 0.3);

    &:hover:not(:disabled) {
      background: rgba(76, 175, 80, 0.2);
      transform: translateY(-1px);
    }
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
    transform: none !important;
  }
}

.actions-menu {
  display: flex;
  gap: $spacing-xs;

  .action-btn {
    width: 32px;
    height: 32px;
    border: none;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    transition: all 0.2s ease;

    &:hover:not(:disabled) {
      transform: scale(1.1);
    }

    &.view {
      background: rgba(33, 150, 243, 0.1);
      color: #1976d2;

      &:hover {
        background: rgba(33, 150, 243, 0.2);
      }
    }

    &.delete {
      background: rgba(244, 67, 54, 0.1);
      color: #d32f2f;

      &:hover:not(:disabled) {
        background: rgba(244, 67, 54, 0.2);
      }
    }

    &.more {
      background: rgba(158, 158, 158, 0.1);
      color: #757575;

      &:hover {
        background: rgba(158, 158, 158, 0.2);
      }
    }

    &:disabled {
      opacity: 0.5;
      cursor: not-allowed;
      transform: none !important;
    }
  }
}

.status-toggle-btn {
  display: flex;
  align-items: center;
  gap: $spacing-xs;
  padding: $spacing-xs $spacing-md;
  border: none;
  border-radius: $border-radius-md;
  font-size: 0.85rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;

  &.block-btn {
    background: rgba(255, 152, 0, 0.1);
    color: #f57c00;
    border: 1px solid rgba(255, 152, 0, 0.3);

    &:hover:not(:disabled) {
      background: rgba(255, 152, 0, 0.2);
    }
  }

  &.unblock-btn {
    background: rgba(76, 175, 80, 0.1);
    color: #388e3c;
    border: 1px solid rgba(76, 175, 80, 0.3);

    &:hover:not(:disabled) {
      background: rgba(76, 175, 80, 0.2);
    }
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
}

// Empty State
.empty-state {
  text-align: center;
  padding: $spacing-xl * 2;
  color: #6c757d;

  >svg {
    margin-bottom: $spacing-lg;
    color: #bdbdbd;
  }

  h6 {
    margin: 0 0 $spacing-sm;
    color: #2c3e50;
    font-size: 1.2rem;
  }

  p {
    margin: 0;
    font-size: 0.9rem;
  }
}

// Pagination
.pagination-container {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: $spacing-lg;
  padding-top: $spacing-lg;
  border-top: 1px solid #f0f0f0;

  .pagination-info {
    color: #6c757d;
    font-size: 0.9rem;
  }

  .pagination-controls {
    display: flex;
    align-items: center;
    gap: $spacing-sm;

    .btn-flat {
      display: flex;
      align-items: center;
      gap: $spacing-xs;
      color: $primary-color;

      &:disabled {
        color: #bdbdbd;
        cursor: not-allowed;
      }
    }

    .page-numbers {
      display: flex;
      gap: $spacing-xs;

      .page-btn {
        width: 40px;
        height: 40px;
        border: none;
        border-radius: 50%;
        background: transparent;
        color: $primary-color;
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
        transition: all 0.2s ease;

        &:hover {
          background: rgba($primary-color, 0.1);
        }

        &.active {
          background: $primary-color;
          color: white;
        }
      }
    }
  }
}

// Modal Styles
.modal {
  .modal-header {
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

      >svg {
        color: $primary-color;
      }
    }

    .modal-close {
      padding: $spacing-xs;
      min-width: auto;
    }
  }
}

// User Details
.user-details {
  .detail-header {
    display: flex;
    align-items: center;
    gap: $spacing-lg;
    margin-bottom: $spacing-xl;
    padding-bottom: $spacing-lg;
    border-bottom: 2px solid #f0f0f0;

    .detail-avatar {
      width: 80px;
      height: 80px;
      border-radius: 50%;
      overflow: hidden;
      border: 3px solid #e3f2fd;

      img {
        width: 100%;
        height: 100%;
        object-fit: cover;
      }
    }

    .detail-info {
      flex: 1;

      h6 {
        margin: 0 0 $spacing-xs;
        font-size: 1.3rem;
        font-weight: 600;
        color: #2c3e50;
      }

      p {
        margin: 0 0 $spacing-sm;
        color: #6c757d;
      }
    }

    .detail-status {
      display: flex;
      flex-direction: column;
      align-items: flex-end;
      gap: $spacing-sm;

      .status-indicator {
        display: flex;
        align-items: center;
        gap: $spacing-xs;
        padding: $spacing-sm $spacing-md;
        border-radius: $border-radius-md;
        font-weight: 500;
        font-size: 0.9rem;

        &.active {
          background: rgba(76, 175, 80, 0.1);
          color: #388e3c;
          border: 1px solid rgba(76, 175, 80, 0.3);
        }

        &.blocked {
          background: rgba(244, 67, 54, 0.1);
          color: #d32f2f;
          border: 1px solid rgba(244, 67, 54, 0.3);
        }
      }
    }
  }

  .detail-sections {
    .detail-section {
      margin-bottom: $spacing-xl;

      h6 {
        display: flex;
        align-items: center;
        gap: $spacing-sm;
        margin: 0 0 $spacing-md;
        color: $primary-color;
        font-weight: 600;
      }

      .info-grid {
        display: grid;
        gap: $spacing-sm;

        .info-item {
          display: flex;
          align-items: center;
          gap: $spacing-sm;
          padding: $spacing-sm;
          background: #f8f9fa;
          border-radius: $border-radius-sm;

          >svg {
            color: $primary-color;
          }

          .no-data {
            color: #999;
            font-style: italic;
          }
        }
      }

      .activity-stats {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
        gap: $spacing-md;

        .activity-card {
          background: #f8f9fa;
          padding: $spacing-lg;
          border-radius: $border-radius-md;
          display: flex;
          align-items: center;
          gap: $spacing-md;

          >svg {
            color: $primary-color;
          }

          .activity-content {
            .activity-value {
              display: block;
              font-size: 1.5rem;
              font-weight: 700;
              color: #2c3e50;
              margin-bottom: $spacing-xs;
            }

            .activity-label {
              display: block;
              color: #6c757d;
              font-size: 0.8rem;
            }
          }
        }
      }
    }
  }

  .detail-actions {
    display: flex;
    gap: $spacing-md;
    padding-top: $spacing-lg;
    border-top: 2px solid #f0f0f0;

    .btn-flat {
      display: flex;
      align-items: center;
      gap: $spacing-xs;
      color: $primary-color;

      &:hover {
        background: rgba($primary-color, 0.1);
      }
    }
  }
}

// Custom Card
.custom-card {
  background: white;
  border-radius: $border-radius-lg;
  padding: $spacing-xl;
  box-shadow: $shadow-md;
  margin-bottom: $spacing-xl;
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

// Responsive Design
@media (max-width: 768px) {
  .user-management-page {
    padding: $spacing-md 0;
  }

  .header-content {
    flex-direction: column;
    gap: $spacing-md;
    text-align: center;
  }

  .stats-container {
    grid-template-columns: repeat(2, 1fr);
  }

  .filters-container {
    flex-direction: column;
    align-items: stretch;
  }

  .pagination-container {
    flex-direction: column;
    gap: $spacing-md;
    align-items: center;
  }

  .actions-menu {
    flex-wrap: wrap;
  }

  .activity-summary {
    flex-direction: column;
    gap: $spacing-xs;
  }

  .status-container {
    align-items: center;

    .status-action-btn {
      min-width: 70px;
      font-size: 0.7rem;
      padding: 4px 8px;
    }
  }

  .detail-header {
    flex-direction: column;
    text-align: center;

    .detail-status {
      align-items: center;
    }
  }
}

@media (max-width: 600px) {
  .stats-container {
    grid-template-columns: 1fr;
  }

  .users-table {
    font-size: 0.9rem;

    th,
    td {
      padding: $spacing-sm;
    }
  }

  .user-info {
    flex-direction: column;
    align-items: flex-start;
    gap: $spacing-xs;

    .user-avatar {
      width: 40px;
      height: 40px;
    }
  }

  .detail-header {
    flex-direction: column;
    text-align: center;
  }

  .detail-actions {
    flex-direction: column;
  }
}
</style>