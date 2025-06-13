// src/router/index.js
import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import Home from '@/views/Home.vue'

const routes = [
  {
    path: '/',
    name: 'home',
    component: Home,
  },
  // Auth routes
  {
    path: '/login',
    name: 'login',
    component: () => import('@/views/auth/Login.vue'),
    meta: { guest: true },
  },
  {
    path: '/register',
    name: 'register',
    component: () => import('@/views/auth/Register.vue'),
    meta: { guest: true },
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
  // src/router/index.js - Thêm route trong admin section
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

// Navigation guards
router.beforeEach(async (to, from, next) => {
  const authStore = useAuthStore()

  // Fetch user profile if authenticated but no user data
  if (authStore.isAuthenticated && !authStore.user) {
    await authStore.fetchProfile()
  }

  if (to.meta.requiresAuth && !authStore.isAuthenticated) {
    next({ name: 'login', query: { redirect: to.fullPath } })
  } else if (to.meta.guest && authStore.isAuthenticated) {
    next({ name: 'home' })
  } else if (to.meta.requiresAdmin && !authStore.isAdmin) {
    next({ name: 'home' })
  } else {
    next()
  }
})

export default router