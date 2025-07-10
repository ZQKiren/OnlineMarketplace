<!-- src/views/profile/MyReviews.vue -->
<template>
  <div class="container">
    <h4>My Reviews</h4>
    
    <div v-if="loading" class="loading">
      <p>Loading your reviews...</p>
    </div>
    
    <div v-else-if="error" class="error">
      <AlertCircle class="error-icon" />
      <p>Error loading reviews: {{ error }}</p>
      <button @click="loadReviews" class="btn btn-primary">Try Again</button>
    </div>
    
    <div v-else-if="reviews.length === 0" class="no-reviews">
      <MessageSquare class="empty-icon" />
      <p>You haven't written any reviews yet</p>
    </div>
    
    <div v-else class="reviews-list">
      <div v-for="review in reviews" :key="review.id" class="review-card">
        <div class="product-info">
          <img 
            :src="getProductImage(review.product)" 
            :alt="review.product.name"
            class="product-image"
          />
          <div class="product-details">
            <h5>{{ review.product.name }}</h5>
            <div class="rating">
              <Star 
                v-for="i in 5" 
                :key="i" 
                class="star" 
                :class="{ active: i <= review.rating }"
              />
              <span class="rating-text">{{ review.rating }}/5</span>
            </div>
          </div>
        </div>
        
        <div class="review-content">
          <p v-if="review.comment" class="comment">{{ review.comment }}</p>
          <p v-else class="no-comment">No comment provided</p>
          <small class="review-date">{{ formatDate(review.createdAt) }}</small>
        </div>
        
        <div class="review-actions">
          <button @click="editReview(review)" class="btn btn-outline-primary btn-sm">
            <Edit class="btn-icon" />
            Edit
          </button>
          <button @click="deleteReview(review.id)" class="btn btn-outline-danger btn-sm">
            <Trash2 class="btn-icon" />
            Delete
          </button>
        </div>
      </div>
    </div>

    <!-- Edit Review Modal -->
    <div v-if="showEditModal" class="modal-overlay" @click="closeEditModal">
      <div class="modal-content" @click.stop>
        <h5>
          <Edit class="modal-icon" />
          Edit Review
        </h5>
        <form @submit.prevent="updateReview">
          <div class="form-group">
            <label>Rating</label>
            <div class="rating-input">
              <Star 
                v-for="i in 5" 
                :key="i" 
                class="star clickable" 
                :class="{ active: i <= editingReview.rating }"
                @click="editingReview.rating = i"
              />
            </div>
          </div>
          
          <div class="form-group">
            <label>Comment</label>
            <textarea 
              v-model="editingReview.comment" 
              class="form-control"
              rows="3"
              placeholder="Share your thoughts about this product..."
            ></textarea>
          </div>
          
          <div class="modal-actions">
            <button type="button" @click="closeEditModal" class="btn btn-secondary">
              <X class="btn-icon" />
              Cancel
            </button>
            <button type="submit" class="btn btn-primary" :disabled="updatingReview">
              <Save v-if="!updatingReview" class="btn-icon" />
              <Loader v-else class="btn-icon spinning" />
              {{ updatingReview ? 'Updating...' : 'Update Review' }}
            </button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import reviewService from '@/services/review.service'
import { getStaticUrl } from '@/services/api'

// Lucide Icons
import {
  AlertCircle,
  MessageSquare,
  Star,
  Edit,
  Trash2,
  X,
  Save,
  Loader
} from 'lucide-vue-next'

const reviews = ref([])
const loading = ref(false)
const error = ref(null)
const showEditModal = ref(false)
const editingReview = ref(null)
const updatingReview = ref(false)

const loadReviews = async () => {
  loading.value = true
  error.value = null
  
  try {
    const response = await reviewService.getMyReviews()
    reviews.value = response.data
  } catch (err) {
    error.value = err.response?.data?.message || 'Failed to load reviews'
  } finally {
    loading.value = false
  }
}

const getProductImage = (product) => {
  if (product.images && product.images.length > 0) {
    return getStaticUrl(product.images[0])
  }
  return '/placeholder-product.jpg'
}

const formatDate = (dateString) => {
  return new Date(dateString).toLocaleDateString('vi-VN', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  })
}

const editReview = (review) => {
  editingReview.value = {
    id: review.id,
    rating: review.rating,
    comment: review.comment || ''
  }
  showEditModal.value = true
}

const closeEditModal = () => {
  showEditModal.value = false
  editingReview.value = null
}

const updateReview = async () => {
  if (!editingReview.value.rating) {
    alert('Please select a rating')
    return
  }
  
  updatingReview.value = true
  
  try {
    const response = await reviewService.updateReview(editingReview.value.id, {
      rating: editingReview.value.rating,
      comment: editingReview.value.comment
    })
    
    // Update the review in the list
    const index = reviews.value.findIndex(r => r.id === editingReview.value.id)
    if (index !== -1) {
      reviews.value[index] = { ...reviews.value[index], ...response.data }
    }
    
    closeEditModal()
    alert('Review updated successfully!')
  } catch (err) {
    alert(err.response?.data?.message || 'Failed to update review')
  } finally {
    updatingReview.value = false
  }
}

const deleteReview = async (reviewId) => {
  if (!confirm('Are you sure you want to delete this review?')) {
    return
  }
  
  try {
    await reviewService.deleteReview(reviewId)
    reviews.value = reviews.value.filter(r => r.id !== reviewId)
    alert('Review deleted successfully!')
  } catch (err) {
    alert(err.response?.data?.message || 'Failed to delete review')
  }
}

onMounted(() => {
  loadReviews()
})
</script>

<style scoped>
.container {
  max-width: 800px;
  margin: 0 auto;
  padding: 20px;
}

.error-icon,
.empty-icon,
.modal-icon {
  width: 24px;
  height: 24px;
  margin-right: 8px;
}

.btn-icon {
  width: 16px;
  height: 16px;
  margin-right: 6px;
}

.spinning {
  animation: spin 1s linear infinite;
}

@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

.loading, 
.error, 
.no-reviews {
  text-align: center;
  padding: 40px 20px;
  color: #666;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 16px;
}

.error {
  color: #dc3545;
}

.empty-icon {
  width: 48px;
  height: 48px;
  color: #ccc;
}

.reviews-list {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.review-card {
  background: white;
  border: 1px solid #ddd;
  border-radius: 8px;
  padding: 20px;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
}

.product-info {
  display: flex;
  align-items: center;
  margin-bottom: 15px;
  padding-bottom: 15px;
  border-bottom: 1px solid #eee;
}

.product-image {
  width: 60px;
  height: 60px;
  object-fit: cover;
  border-radius: 8px;
  margin-right: 15px;
}

.product-details h5 {
  margin: 0 0 5px 0;
  font-weight: 600;
}

.rating {
  display: flex;
  align-items: center;
  gap: 2px;
}

.star {
  width: 16px;
  height: 16px;
  color: #ddd;
  cursor: default;
}

.star.active {
  color: #ffc107;
}

.star.clickable {
  cursor: pointer;
  transition: color 0.2s;
}

.star.clickable:hover {
  color: #ffc107;
}

.rating-text {
  font-size: 14px;
  color: #666;
  margin-left: 8px;
}

.review-content {
  margin-bottom: 15px;
}

.comment {
  margin-bottom: 10px;
  line-height: 1.5;
}

.no-comment {
  font-style: italic;
  color: #999;
  margin-bottom: 10px;
}

.review-date {
  color: #666;
  font-size: 12px;
}

.review-actions {
  display: flex;
  gap: 10px;
}

.btn {
  padding: 6px 12px;
  border: 1px solid;
  border-radius: 4px;
  cursor: pointer;
  font-size: 12px;
  text-decoration: none;
  display: inline-flex;
  align-items: center;
  transition: all 0.2s;
}

.btn-outline-primary {
  color: #007bff;
  border-color: #007bff;
  background: transparent;
}

.btn-outline-primary:hover {
  background: #007bff;
  color: white;
}

.btn-outline-danger {
  color: #dc3545;
  border-color: #dc3545;
  background: transparent;
}

.btn-outline-danger:hover {
  background: #dc3545;
  color: white;
}

.btn-primary {
  background: #007bff;
  color: white;
  border-color: #007bff;
}

.btn-primary:hover {
  background: #0056b3;
}

.btn-secondary {
  background: #6c757d;
  color: white;
  border-color: #6c757d;
}

.btn-secondary:hover {
  background: #545b62;
}

/* Modal Styles */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0,0,0,0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
}

.modal-content {
  background: white;
  padding: 30px;
  border-radius: 8px;
  width: 90%;
  max-width: 500px;
  max-height: 90vh;
  overflow-y: auto;
}

.modal-content h5 {
  margin-bottom: 20px;
  display: flex;
  align-items: center;
}

.form-group {
  margin-bottom: 15px;
}

.form-group label {
  display: block;
  margin-bottom: 5px;
  font-weight: 500;
}

.rating-input {
  display: flex;
  gap: 5px;
  margin-bottom: 10px;
}

.form-control {
  width: 100%;
  padding: 8px 12px;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 14px;
  resize: vertical;
}

.modal-actions {
  display: flex;
  gap: 10px;
  justify-content: flex-end;
  margin-top: 20px;
}

.btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

@media (max-width: 768px) {
  .container {
    padding: 10px;
  }
  
  .product-info {
    flex-direction: column;
    align-items: flex-start;
  }
  
  .product-image {
    margin-bottom: 10px;
    margin-right: 0;
  }
  
  .review-actions {
    flex-direction: column;
  }
  
  .modal-content {
    margin: 20px;
    padding: 20px;
  }
  
  .modal-actions {
    flex-direction: column;
  }
}
</style>