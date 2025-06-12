// src/stores/product.js
import { defineStore } from 'pinia'
import { ref } from 'vue'
import productService from '@/services/product.service'

export const useProductStore = defineStore('product', () => {
  const products = ref([])
  const currentProduct = ref(null)
  const loading = ref(false)
  const error = ref(null)

  async function fetchProducts(params) {
    loading.value = true
    error.value = null
    
    try {
      const response = await productService.getProducts(params)
      products.value = response.data.data
      return response.data
    } catch (err) {
      error.value = err.message
      throw err
    } finally {
      loading.value = false
    }
  }

  async function fetchProductById(id) {
    loading.value = true
    error.value = null
    
    try {
      const response = await productService.getProductById(id)
      currentProduct.value = response.data
      return response.data
    } catch (err) {
      error.value = err.message
      throw err
    } finally {
      loading.value = false
    }
  }

  async function createProduct(productData) {
    try {
      const response = await productService.createProduct(productData)
      products.value.unshift(response.data)
      return response.data
    } catch (err) {
      error.value = err.message
      throw err
    }
  }

  async function updateProduct(id, productData) {
    try {
      const response = await productService.updateProduct(id, productData)
      const index = products.value.findIndex(p => p.id === id)
      if (index !== -1) {
        products.value[index] = response.data
      }
      return response.data
    } catch (err) {
      error.value = err.message
      throw err
    }
  }

  async function deleteProduct(id) {
    try {
      await productService.deleteProduct(id)
      products.value = products.value.filter(p => p.id !== id)
    } catch (err) {
      error.value = err.message
      throw err
    }
  }

  return {
    products,
    currentProduct,
    loading,
    error,
    fetchProducts,
    fetchProductById,
    createProduct,
    updateProduct,
    deleteProduct
  }
})