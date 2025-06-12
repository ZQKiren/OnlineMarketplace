// src/services/product.service.js
import api from './api'

export default {
  getProducts(params) {
    return api.get('/products', { params })
  },

  getProductById(id) {
    return api.get(`/products/${id}`)
  },

  createProduct(productData) {
    const formData = new FormData()

    // Append non-file data - ensure correct types
    formData.append('name', productData.name)
    formData.append('description', productData.description)
    formData.append('price', productData.price.toString())
    formData.append('stock', productData.stock.toString())
    formData.append('categoryId', productData.categoryId)

    // Append image files (not image URLs)
    if (productData.images && productData.images.length > 0) {
      productData.images.forEach(imageFile => {
        formData.append('images', imageFile)
      })
    }

    return api.post('/products', formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    })
  },

  // src/services/product.service.js - Update method for handling images
  updateProduct(id, productData) {
    const formData = new FormData()

    // Append text fields
    formData.append('name', productData.name)
    formData.append('description', productData.description)
    formData.append('price', productData.price)
    formData.append('stock', productData.stock)
    formData.append('categoryId', productData.categoryId)

    // Append images to remove
    if (productData.imagesToRemove) {
      productData.imagesToRemove.forEach(image => {
        formData.append('imagesToRemove[]', image)
      })
    }

    // Append new images
    if (productData.newImages) {
      productData.newImages.forEach(image => {
        formData.append('images', image)
      })
    }

    return api.patch(`/products/${id}`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    })
  },

  deleteProduct(id) {
    return api.delete(`/products/${id}`)
  },

  getUserProducts() {
    return api.get('/users/products')
  }
}