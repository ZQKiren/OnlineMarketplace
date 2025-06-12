// src/stores/category.js
import { defineStore } from 'pinia'
import { ref } from 'vue'
import categoryService from '@/services/category.service'

export const useCategoryStore = defineStore('category', () => {
  const categories = ref([])
  const loading = ref(false)

  async function fetchCategories() {
    if (categories.value.length > 0) return // Cache categories
    
    loading.value = true
    try {
      const response = await categoryService.getCategories()
      categories.value = response.data
    } catch (error) {
      console.error('Error fetching categories:', error)
    } finally {
      loading.value = false
    }
  }

  async function createCategory(categoryData) {
    try {
      const response = await categoryService.createCategory(categoryData)
      categories.value.push(response.data)
      return response.data
    } catch (error) {
      throw error
    }
  }

  async function updateCategory(id, categoryData) {
    try {
      const response = await categoryService.updateCategory(id, categoryData)
      const index = categories.value.findIndex(c => c.id === id)
      if (index !== -1) {
        categories.value[index] = response.data
      }
      return response.data
    } catch (error) {
      throw error
    }
  }

  async function deleteCategory(id) {
    try {
      await categoryService.deleteCategory(id)
      categories.value = categories.value.filter(c => c.id !== id)
    } catch (error) {
      throw error
    }
  }

  return {
    categories,
    loading,
    fetchCategories,
    createCategory,
    updateCategory,
    deleteCategory
  }
})