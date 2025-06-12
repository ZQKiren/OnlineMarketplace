// src/services/category.service.js
import api from './api'

export default {
  getCategories() {
    return api.get('/categories')
  },

  getCategoryById(id) {
    return api.get(`/categories/${id}`)
  },

  createCategory(data) {
    return api.post('/categories', data)
  },

  updateCategory(id, data) {
    return api.patch(`/categories/${id}`, data)
  },

  deleteCategory(id) {
    return api.delete(`/categories/${id}`)
  }
}