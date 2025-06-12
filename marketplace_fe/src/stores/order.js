// src/stores/order.js
import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import orderService from '@/services/order.service'
import { useAuthStore } from '@/stores/auth'

export const useOrderStore = defineStore('order', () => {
  // State
  const orders = ref([])
  const currentOrder = ref(null)
  const loading = ref(false)
  const creating = ref(false)

  // Getters
  const userOrders = computed(() => {
    const authStore = useAuthStore()
    return orders.value.filter(order => order.userId === authStore.user?.id)
  })

  const totalOrders = computed(() => orders.value.length)
  
  const totalAmount = computed(() => 
    orders.value.reduce((sum, order) => sum + order.totalAmount, 0)
  )
  
  const pendingOrders = computed(() => 
    orders.value.filter(order => order.status === 'PENDING')
  )
  
  const processingOrders = computed(() => 
    orders.value.filter(order => order.status === 'PROCESSING')
  )
  
  const shippedOrders = computed(() => 
    orders.value.filter(order => order.status === 'SHIPPED')
  )
  
  const deliveredOrders = computed(() => 
    orders.value.filter(order => order.status === 'DELIVERED')
  )

  const cancelledOrders = computed(() => 
    orders.value.filter(order => order.status === 'CANCELLED')
  )

  // Actions
  async function createOrder(orderData) {
    creating.value = true
    try {
      const response = await orderService.createOrder(orderData)
      // Add new order to the beginning of the list
      orders.value.unshift(response.data)
      return response.data
    } catch (error) {
      console.error('Error creating order:', error)
      throw error
    } finally {
      creating.value = false
    }
  }

  async function fetchUserOrders(params = {}) {
    loading.value = true
    try {
      const response = await orderService.getUserOrders(params)
      orders.value = response.data
    } catch (error) {
      console.error('Error fetching user orders:', error)
      throw error
    } finally {
      loading.value = false
    }
  }

  async function fetchOrderById(id) {
    loading.value = true
    try {
      const response = await orderService.getOrderById(id)
      currentOrder.value = response.data
      return response.data
    } catch (error) {
      console.error('Error fetching order:', error)
      throw error
    } finally {
      loading.value = false
    }
  }

  async function updateOrderStatus(id, status) {
    try {
      const response = await orderService.updateOrderStatus(id, status)
      
      // Update in orders array
      const index = orders.value.findIndex(order => order.id === id)
      if (index !== -1) {
        orders.value[index] = response.data
      }
      
      // Update current order if it matches
      if (currentOrder.value?.id === id) {
        currentOrder.value = response.data
      }
      
      return response.data
    } catch (error) {
      console.error('Error updating order status:', error)
      throw error
    }
  }

  // Admin actions
  async function fetchAllOrders(params = {}) {
    loading.value = true
    try {
      const response = await orderService.getAllOrders(params)
      orders.value = response.data
    } catch (error) {
      console.error('Error fetching all orders:', error)
      throw error
    } finally {
      loading.value = false
    }
  }

  // Utility functions
  function getOrderById(id) {
    return orders.value.find(order => order.id === id)
  }

  function clearCurrentOrder() {
    currentOrder.value = null
  }

  function clearOrders() {
    orders.value = []
    currentOrder.value = null
  }

  // Reset state on logout
  function resetStore() {
    orders.value = []
    currentOrder.value = null
    loading.value = false
    creating.value = false
  }

  return {
    // State
    orders,
    currentOrder,
    loading,
    creating,
    
    // Getters
    userOrders,
    totalOrders,
    totalAmount,
    pendingOrders,
    processingOrders,
    shippedOrders,
    deliveredOrders,
    cancelledOrders,
    
    // Actions
    createOrder,
    fetchUserOrders,
    fetchOrderById,
    updateOrderStatus,
    fetchAllOrders,
    getOrderById,
    clearCurrentOrder,
    clearOrders,
    resetStore
  }
})