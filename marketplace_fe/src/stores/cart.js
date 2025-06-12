// src/stores/cart.js
import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import cartService from '@/services/cart.service'

export const useCartStore = defineStore('cart', () => {
  const items = ref([])
  const loading = ref(false)

  const itemCount = computed(() => 
    items.value.reduce((total, item) => total + item.quantity, 0)
  )

  const total = computed(() => 
    items.value.reduce((sum, item) => sum + (item.product.price * item.quantity), 0)
  )

  async function fetchCart() {
    loading.value = true
    try {
      const response = await cartService.getCart()
      items.value = response.data.items
    } catch (error) {
      console.error('Error fetching cart:', error)
    } finally {
      loading.value = false
    }
  }

  async function addToCart(productId, quantity = 1) {
    try {
      const response = await cartService.addToCart(productId, quantity)
      await fetchCart() // Refresh cart
      return response.data
    } catch (error) {
      throw error
    }
  }

  async function updateCartItem(itemId, quantity) {
    try {
      const response = await cartService.updateCartItem(itemId, quantity)
      const item = items.value.find(i => i.id === itemId)
      if (item) {
        item.quantity = quantity
      }
      return response.data
    } catch (error) {
      throw error
    }
  }

  async function removeFromCart(itemId) {
    try {
      await cartService.removeFromCart(itemId)
      items.value = items.value.filter(item => item.id !== itemId)
    } catch (error) {
      throw error
    }
  }

  async function clearCart() {
    try {
      await cartService.clearCart()
      items.value = []
    } catch (error) {
      throw error
    }
  }

  return {
    items,
    loading,
    itemCount,
    total,
    fetchCart,
    addToCart,
    updateCartItem,
    removeFromCart,
    clearCart
  }
})