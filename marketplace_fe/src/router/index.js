// src/router/index.js - FIXED VERSION
import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import Home from '@/views/Home.vue'

const routes = [
  {
    path: '/',
    name: 'home',
    component: Home,
  },
  // Auth routes - Updated with meta properties
  {
    path: '/login',
    name: 'login',
    component: () => import('@/views/auth/Login.vue'),
    meta: { 
      guest: true,
      hideNavbar: true,
      hideFooter: true
    },
  },
  {
    path: '/register',
    name: 'register',
    component: () => import('@/views/auth/Register.vue'),
    meta: { 
      guest: true,
      hideNavbar: true,
      hideFooter: true
    },
  },
  // Product routes
  {
    path: '/products',
    name: 'products',
    component: () => import('@/views/products/ProductList.vue'),
  },
  {
    path: '/products/create',
    name: 'create-product',
    component: () => import('@/views/products/CreateProduct.vue'),
    meta: { requiresAuth: true },
  },
  {
    path: '/products/edit/:id',
    name: 'edit-product',
    component: () => import('@/views/products/EditProduct.vue'),
    meta: { requiresAuth: true },
  },
  {
    path: '/products/:id',
    name: 'product-detail',
    component: () => import('@/views/products/ProductDetail.vue'),
  },
  // Cart & Checkout
  {
    path: '/cart',
    name: 'cart',
    component: () => import('@/views/cart/ShoppingCart.vue'),
    meta: { requiresAuth: true },
  },
  {
    path: '/checkout',
    name: 'checkout',
    component: () => import('@/views/checkout/Checkout.vue'),
    meta: { requiresAuth: true },
  },
  // Orders
  {
    path: '/orders',
    name: 'orders',
    component: () => import('@/views/orders/OrderList.vue'),
    meta: { requiresAuth: true },
  },
  {
    path: '/orders/:id',
    name: 'order-detail',
    component: () => import('@/views/orders/OrderDetail.vue'),
    meta: { requiresAuth: true },
  },
  {
    path: '/chat',
    name: 'chat',
    component: () => import('@/views/chat/ChatRoom.vue'),
    meta: { requiresAuth: true },
  },
  {
    path: '/chat/:id',
    name: 'chat-room',
    component: () => import('@/views/chat/ChatRoom.vue'),
    meta: { requiresAuth: true },
  },
  // Profile
  {
    path: '/profile',
    name: 'profile',
    component: () => import('@/views/profile/UserProfile.vue'),
    meta: { requiresAuth: true },
  },
  {
    path: '/my-products',
    name: 'my-products',
    component: () => import('@/views/profile/MyProducts.vue'),
    meta: { requiresAuth: true },
  },
  {
    path: '/my-reviews',
    name: 'my-reviews',
    component: () => import('@/views/profile/MyReviews.vue'),
    meta: { requiresAuth: true },
  },
  // Admin routes
  {
    path: '/admin',
    redirect: '/admin/dashboard',
    meta: { requiresAuth: true, requiresAdmin: true },
    children: [
      {
        path: 'dashboard',
        name: 'admin-dashboard',
        component: () => import('@/views/admin/Dashboard.vue'),
      },
      {
        path: 'products',
        name: 'admin-products',
        component: () => import('@/views/admin/ProductManagement.vue'),
      },
      {
        path: 'orders',
        name: 'admin-orders',
        component: () => import('@/views/admin/OrderManagement.vue'),
      },
      {
        path: 'users',
        name: 'admin-users',
        component: () => import('@/views/admin/UserManagement.vue'),
      },
      {
        path: 'categories',
        name: 'admin-categories',
        component: () => import('@/views/admin/CategoryManagement.vue'),
      },
    ],
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes,
})

// ✅ FIXED: Navigation guards with proper auth initialization
router.beforeEach(async (to, from, next) => {
  const authStore = useAuthStore()

  console.log('🛡️ Router guard:', {
    to: to.path,
    requiresAuth: to.meta.requiresAuth,
    requiresAdmin: to.meta.requiresAdmin,
    guest: to.meta.guest,
    isAuthenticated: authStore.isAuthenticated,
    hasToken: !!authStore.token,
    hasUser: !!authStore.user,
    isInitialized: authStore.isInitialized,
    isLoading: authStore.isLoading
  })

  try {
    // ✅ CRITICAL: Initialize auth store if not already initialized
    if (!authStore.isInitialized && !authStore.isLoading) {
      console.log('🔄 Auth not initialized, initializing...')
      await authStore.initialize()
    }

    // ✅ Wait for any ongoing initialization to complete
    if (authStore.isLoading) {
      console.log('⏳ Waiting for auth initialization to complete...')
      // Wait for loading to finish
      let attempts = 0
      while (authStore.isLoading && attempts < 50) { // Max 5 seconds
        await new Promise(resolve => setTimeout(resolve, 100))
        attempts++
      }
    }

    // ✅ FIXED: Better auth check - load user if we have token but no user
    if (authStore.token && !authStore.user && !authStore.isLoading) {
      console.log('👤 Token exists but no user data, fetching profile...')
      try {
        await authStore.fetchProfile()
      } catch (error) {
        console.error('❌ Failed to fetch profile in router guard:', error)
        
        // Only logout if it's a clear auth error
        if (error.response?.status === 401 || error.response?.status === 403) {
          console.log('🔐 Invalid token, logging out...')
          authStore.logout()
          return next({ name: 'login', query: { redirect: to.fullPath } })
        }
        
        // For other errors (network, etc), don't logout but continue
        console.log('⚠️ Non-auth error, continuing with navigation')
      }
    }

    // ✅ Check route authentication requirements
    if (to.meta.requiresAuth) {
      if (!authStore.isAuthenticated) {
        console.log('🔐 Route requires auth but user not authenticated')
        return next({ name: 'login', query: { redirect: to.fullPath } })
      }
    }

    // ✅ Check guest routes (login/register pages)
    if (to.meta.guest && authStore.isAuthenticated) {
      console.log('👤 User authenticated, redirecting from guest page')
      return next({ name: 'home' })
    }

    // ✅ Check admin requirements
    if (to.meta.requiresAdmin) {
      if (!authStore.isAuthenticated) {
        console.log('🔐 Admin route requires auth')
        return next({ name: 'login', query: { redirect: to.fullPath } })
      }
      
      if (!authStore.isAdmin) {
        console.log('👮‍♂️ User not admin, redirecting')
        return next({ name: 'home' })
      }
    }

    console.log('✅ Router guard passed, proceeding to:', to.path)
    next()

  } catch (error) {
    console.error('❌ Router guard error:', error)
    
    // If we're going to login page, let it through
    if (to.name === 'login') {
      return next()
    }
    
    // Otherwise redirect to login
    next({ name: 'login', query: { redirect: to.fullPath } })
  }
})

export default router