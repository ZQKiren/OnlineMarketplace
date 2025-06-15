<template>
  <div class="product-reviews">
    <!-- Reviews Header -->
    <div class="reviews-header">
      <h5>Customer Reviews</h5>
      <div class="reviews-summary" v-if="stats">
        <span class="review-count">{{ stats.totalReviews }} {{ stats.totalReviews === 1 ? 'review' : 'reviews' }}</span>
      </div>
    </div>
    
    <!-- Review Stats -->
    <div class="review-stats" v-if="stats && stats.totalReviews > 0">
      <div class="average-rating">
        <div class="rating-display">
          <h3 class="rating-number">{{ stats.averageRating.toFixed(1) }}</h3>
          <div class="stars">
            <i class="material-icons" v-for="i in 5" :key="i">
              {{ i <= Math.round(stats.averageRating) ? 'star' : 'star_border' }}
            </i>
          </div>
          <p class="rating-text">{{ stats.totalReviews }} {{ stats.totalReviews === 1 ? 'review' : 'reviews' }}</p>
        </div>
      </div>
      
      <div class="rating-distribution">
        <div 
          v-for="rating in [5, 4, 3, 2, 1]" 
          :key="rating"
          class="rating-bar"
        >
          <span class="rating-label">{{ rating }}</span>
          <i class="material-icons star-icon">star</i>
          <div class="progress-bar">
            <div 
              class="progress-fill"
              :style="{ width: getDistributionPercentage(rating) + '%' }"
            ></div>
          </div>
          <span class="rating-count">{{ stats.distribution[rating] || 0 }}</span>
        </div>
      </div>
    </div>
    
    <!-- No Reviews State -->
    <div v-if="!loading && stats && stats.totalReviews === 0" class="no-reviews">
      <i class="material-icons large">rate_review</i>
      <h6>No reviews yet</h6>
      <p>Be the first to share your experience with this product!</p>
    </div>
    
    <!-- Add Review Form -->
    <div v-if="showReviewForm" class="add-review-section">
      <div class="section-header">
        <h6>Write a Review</h6>
        <button class="btn-flat" @click="toggleReviewForm">
          <i class="material-icons">close</i>
        </button>
      </div>
      
      <form @submit.prevent="submitReview" class="review-form">
        <div class="rating-input">
          <label class="form-label">Your Rating *</label>
          <div class="star-rating">
            <button
              v-for="star in 5" 
              :key="star"
              type="button"
              class="star-btn"
              :class="{ active: star <= newReview.rating, hover: star <= hoverRating }"
              @click="setRating(star)"
              @mouseenter="hoverRating = star"
              @mouseleave="hoverRating = 0"
            >
              <i class="material-icons">
                {{ star <= (hoverRating || newReview.rating) ? 'star' : 'star_border' }}
              </i>
            </button>
          </div>
          <span class="rating-desc">{{ getRatingDescription(newReview.rating) }}</span>
        </div>
        
        <div class="comment-input">
          <label class="form-label">Your Review</label>
          <textarea 
            v-model="newReview.comment"
            class="textarea"
            placeholder="Share your experience with this product..."
            maxlength="500"
            rows="4"
          ></textarea>
          <div class="char-count">
            <span :class="{ 'near-limit': newReview.comment.length > 450 }">
              {{ newReview.comment.length }}/500
            </span>
          </div>
        </div>
        
        <div class="form-actions">
          <button 
            type="button" 
            class="btn-flat"
            @click="toggleReviewForm"
            :disabled="submitting"
          >
            Cancel
          </button>
          <button 
            type="submit" 
            class="btn"
            :disabled="!newReview.rating || submitting"
          >
            <i class="material-icons left">{{ submitting ? 'hourglass_empty' : 'send' }}</i>
            {{ submitting ? 'Submitting...' : 'Submit Review' }}
          </button>
        </div>
      </form>
    </div>
    
    <!-- Review Action Button -->
    <div v-else-if="canReview && !hasReviewed" class="review-action">
      <button 
        class="btn"
        @click="toggleReviewForm"
      >
        <i class="material-icons left">rate_review</i>
        Write a Review
      </button>
    </div>
    
    <!-- Already Reviewed Notice -->
    <div v-else-if="hasReviewed" class="already-reviewed">
      <div class="notice">
        <i class="material-icons">check_circle</i>
        <span>You have already reviewed this product. You can edit your review below.</span>
      </div>
    </div>
    
    <!-- Reviews Filter -->
    <div v-if="reviews.length > 0" class="reviews-filter">
      <div class="filter-options">
        <label>Filter by rating:</label>
        <select v-model="selectedFilter" @change="filterReviews" class="browser-default">
          <option value="">All reviews</option>
          <option v-for="star in [5, 4, 3, 2, 1]" :key="star" :value="star">{{ star }} stars</option>
        </select>
      </div>
      
      <div class="sort-options">
        <label>Sort by:</label>
        <select v-model="sortBy" @change="sortReviews" class="browser-default">
          <option value="newest">Newest first</option>
          <option value="oldest">Oldest first</option>
          <option value="highest">Highest rated</option>
          <option value="lowest">Lowest rated</option>
        </select>
      </div>
    </div>
    
    <!-- Loading State -->
    <div v-if="loading" class="reviews-loading">
      <LoadingSpinner text="Loading reviews..." />
    </div>
    
    <!-- Reviews List -->
    <div v-else-if="filteredReviews.length > 0" class="reviews-list">
      <div 
        v-for="review in paginatedReviews" 
        :key="review.id"
        class="review-item"
        :class="{ 'user-review': review.user.id === authStore.user?.id }"
      >
        <!-- Edit Mode -->
        <div v-if="editingReview === review.id" class="review-edit">
          <div class="edit-header">
            <h6>Edit Your Review</h6>
            <button class="btn-flat" @click="cancelEdit">
              <i class="material-icons">close</i>
            </button>
          </div>
          
          <form @submit.prevent="saveEdit(review.id)" class="edit-form">
            <div class="rating-input">
              <label>Rating:</label>
              <div class="star-rating">
                <button
                  v-for="star in 5" 
                  :key="star"
                  type="button"
                  class="star-btn"
                  :class="{ active: star <= editForm.rating }"
                  @click="editForm.rating = star"
                >
                  <i class="material-icons">
                    {{ star <= editForm.rating ? 'star' : 'star_border' }}
                  </i>
                </button>
              </div>
            </div>
            
            <div class="comment-input">
              <textarea 
                v-model="editForm.comment"
                class="textarea"
                placeholder="Update your review..."
                maxlength="500"
                rows="3"
              ></textarea>
              <div class="char-count">
                <span>{{ editForm.comment.length }}/500</span>
              </div>
            </div>
            
            <div class="form-actions">
              <button 
                type="button" 
                class="btn-flat"
                @click="cancelEdit"
                :disabled="updating"
              >
                Cancel
              </button>
              <button 
                type="submit" 
                class="btn"
                :disabled="updating"
              >
                <i class="material-icons left">{{ updating ? 'hourglass_empty' : 'save' }}</i>
                {{ updating ? 'Saving...' : 'Save Changes' }}
              </button>
            </div>
          </form>
        </div>
        
        <!-- Display Mode -->
        <div v-else class="review-display">
          <div class="review-header">
            <div class="reviewer-info">
              <img 
                :src="getUserAvatar(review.user)" 
                :alt="review.user.name"
                class="reviewer-avatar"
                @error="handleAvatarError"
              >
              <div class="reviewer-details">
                <h6 class="reviewer-name">{{ review.user.name }}</h6>
                <div class="review-meta">
                  <div class="stars">
                    <i class="material-icons" v-for="i in 5" :key="i">
                      {{ i <= review.rating ? 'star' : 'star_border' }}
                    </i>
                  </div>
                  <span class="review-date">{{ formatDate(review.createdAt) }}</span>
                  <span v-if="review.updatedAt !== review.createdAt" class="edited-badge">
                    (edited)
                  </span>
                </div>
              </div>
            </div>
            
            <!-- Review Actions -->
            <div v-if="review.user.id === authStore.user?.id" class="review-actions">
              <button 
                class="btn-flat btn-small"
                title="Edit review"
                @click="startEdit(review)"
                :disabled="loading"
              >
                <i class="material-icons">edit</i>
              </button>
              <button 
                class="btn-flat btn-small"
                title="Delete review"
                @click="confirmDelete(review.id)"
                :disabled="loading"
              >
                <i class="material-icons">delete</i>
              </button>
            </div>
          </div>
          
          <div class="review-content">
            <p v-if="review.comment" class="review-comment">{{ review.comment }}</p>
            <em v-else class="no-comment">No additional comments provided</em>
          </div>
          
          <!-- Review Helpful -->
          <div class="review-footer">
            <span class="helpful-text">Was this review helpful?</span>
            <div class="helpful-actions">
              <button class="btn-flat btn-small">
                <i class="material-icons left">thumb_up</i>
                Yes (0)
              </button>
              <button class="btn-flat btn-small">
                <i class="material-icons left">thumb_down</i>
                No (0)
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
    
    <!-- No Filtered Reviews -->
    <div v-else-if="reviews.length > 0 && filteredReviews.length === 0" class="no-filtered-reviews">
      <p>No reviews match your current filter.</p>
      <button class="btn-flat" @click="clearFilter">Clear Filter</button>
    </div>
    
    <!-- Pagination -->
    <div v-if="filteredReviews.length > reviewsPerPage" class="pagination-wrapper">
      <ul class="pagination">
        <li :class="{ disabled: currentPage === 1 }">
          <a @click="changePage(currentPage - 1)">
            <i class="material-icons">chevron_left</i>
          </a>
        </li>
        
        <li 
          v-for="page in visiblePages" 
          :key="page"
          :class="{ active: page === currentPage }"
        >
          <a @click="changePage(page)">{{ page }}</a>
        </li>
        
        <li :class="{ disabled: currentPage === totalPages }">
          <a @click="changePage(currentPage + 1)">
            <i class="material-icons">chevron_right</i>
          </a>
        </li>
      </ul>
    </div>
  </div>
</template>

<script>
import { ref, computed } from 'vue'
import { useAuthStore } from '@/stores/auth'
import { useToast } from 'vue-toastification'
import reviewService from '@/services/review.service'
import { getStaticUrl } from '@/services/api'
import LoadingSpinner from '@/components/common/LoadingSpinner.vue'

export default {
  name: 'ProductReviews',
  components: { LoadingSpinner },
  props: {
    productId: {
      type: String,
      required: true
    },
    canReview: {
      type: Boolean,
      default: false
    }
  },
  emits: ['review-added', 'review-updated'],
  
  setup() {
    const authStore = useAuthStore()
    const toast = useToast()
    
    const reviews = ref([])
    const stats = ref(null)
    const loading = ref(false)
    const submitting = ref(false)
    const updating = ref(false)
    const showReviewForm = ref(false)
    const editingReview = ref(null)
    const selectedFilter = ref('')
    const sortBy = ref('newest')
    const currentPage = ref(1)
    const reviewsPerPage = ref(10)
    const hoverRating = ref(0)
    const newReview = ref({ rating: 0, comment: '' })
    const editForm = ref({ rating: 0, comment: '' })

    // Computed properties for optimized filtering and sorting
    const filteredReviews = computed(() => {
      if (!selectedFilter.value) return [...reviews.value]
      return reviews.value.filter(r => r.rating == selectedFilter.value)
    })

    const sortedReviews = computed(() => {
      const sortFunctions = {
        newest: (a, b) => new Date(b.createdAt) - new Date(a.createdAt),
        oldest: (a, b) => new Date(a.createdAt) - new Date(b.createdAt),
        highest: (a, b) => b.rating - a.rating,
        lowest: (a, b) => a.rating - b.rating
      }
      return [...filteredReviews.value].sort(sortFunctions[sortBy.value])
    })

    const paginatedReviews = computed(() => {
      const start = (currentPage.value - 1) * reviewsPerPage.value
      const end = start + reviewsPerPage.value
      return sortedReviews.value.slice(start, end)
    })

    const totalPages = computed(() => {
      return Math.ceil(filteredReviews.value.length / reviewsPerPage.value)
    })

    const visiblePages = computed(() => {
      const pages = []
      const total = totalPages.value
      const current = currentPage.value

      if (total <= 7) {
        for (let i = 1; i <= total; i++) pages.push(i)
      } else {
        if (current <= 4) {
          for (let i = 1; i <= 5; i++) pages.push(i)
          pages.push('...', total)
        } else if (current >= total - 3) {
          pages.push(1, '...')
          for (let i = total - 4; i <= total; i++) pages.push(i)
        } else {
          pages.push(1, '...', current - 1, current, current + 1, '...', total)
        }
      }
      return pages
    })

    const hasReviewed = computed(() => {
      return reviews.value.some(r => r.user.id === authStore.user?.id)
    })

    return {
      authStore,
      toast,
      reviews,
      stats,
      loading,
      submitting,
      updating,
      showReviewForm,
      editingReview,
      selectedFilter,
      sortBy,
      currentPage,
      reviewsPerPage,
      hoverRating,
      newReview,
      editForm,
      filteredReviews,
      sortedReviews,
      paginatedReviews,
      totalPages,
      visiblePages,
      hasReviewed
    }
  },
  
  methods: {
    async fetchReviews() {
      this.loading = true
      try {
        const response = await reviewService.getProductReviews(this.productId)
        this.reviews = response.data.reviews || []
        this.stats = response.data.stats || null
      } catch (error) {
        console.error('Error fetching reviews:', error)
        this.toast.error('Failed to load reviews')
      } finally {
        this.loading = false
      }
    },
    
    getDistributionPercentage(rating) {
      if (!this.stats || this.stats.totalReviews === 0) return 0
      const count = this.stats.distribution[rating] || 0
      return (count / this.stats.totalReviews) * 100
    },
    
    getUserAvatar(user) {
      return getStaticUrl(user.avatar) || '/default-avatar.png'
    },
    
    handleAvatarError(event) {
      event.target.src = '/default-avatar.png'
    },
    
    formatDate(dateString) {
      return new Date(dateString).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      })
    },
    
    getRatingDescription(rating) {
      const descriptions = {
        1: 'Poor',
        2: 'Fair',
        3: 'Good',
        4: 'Very Good',
        5: 'Excellent'
      }
      return descriptions[rating] || 'Select a rating'
    },
    
    toggleReviewForm() {
      this.showReviewForm = !this.showReviewForm
      if (!this.showReviewForm) {
        this.newReview = { rating: 0, comment: '' }
        this.hoverRating = 0
      }
    },
    
    setRating(rating) {
      this.newReview.rating = rating
    },
    
    async submitReview() {
      if (!this.newReview.rating) {
        this.toast.error('Please select a rating')
        return
      }
      
      this.submitting = true
      try {
        await reviewService.createReview({
          productId: this.productId,
          rating: this.newReview.rating,
          comment: this.newReview.comment.trim()
        })
        this.toast.success('Review submitted successfully!')
        this.toggleReviewForm()
        await this.fetchReviews()
        this.$emit('review-added')
      } catch (error) {
        console.error('Error submitting review:', error)
        this.toast.error(error.response?.data?.message || 'Failed to submit review')
      } finally {
        this.submitting = false
      }
    },
    
    startEdit(review) {
      this.editingReview = review.id
      this.editForm = {
        rating: review.rating,
        comment: review.comment || ''
      }
    },
    
    cancelEdit() {
      this.editingReview = null
      this.editForm = { rating: 0, comment: '' }
    },
    
    async saveEdit(reviewId) {
      this.updating = true
      try {
        await reviewService.updateReview(reviewId, {
          rating: this.editForm.rating,
          comment: this.editForm.comment.trim()
        })
        this.toast.success('Review updated successfully!')
        this.cancelEdit()
        await this.fetchReviews()
        this.$emit('review-updated')
      } catch (error) {
        console.error('Error updating review:', error)
        this.toast.error(error.response?.data?.message || 'Failed to update review')
      } finally {
        this.updating = false
      }
    },
    
    confirmDelete(reviewId) {
      if (confirm('Are you sure you want to delete this review? This action cannot be undone.')) {
        this.deleteReview(reviewId)
      }
    },
    
    async deleteReview(reviewId) {
      try {
        await reviewService.deleteReview(reviewId)
        this.toast.success('Review deleted successfully')
        await this.fetchReviews()
        this.$emit('review-updated')
      } catch (error) {
        console.error('Error deleting review:', error)
        this.toast.error(error.response?.data?.message || 'Failed to delete review')
      }
    },
    
    filterReviews() {
      this.currentPage = 1
    },
    
    sortReviews() {
      this.currentPage = 1
    },
    
    clearFilter() {
      this.selectedFilter = ''
      this.currentPage = 1
    },
    
    changePage(page) {
      if (page >= 1 && page <= this.totalPages) {
        this.currentPage = page
        this.$el.scrollIntoView({ behavior: 'smooth' })
      }
    }
  },
  
  async mounted() {
    await this.fetchReviews()
  }
}
</script>

<style scoped lang="scss">
@import '@/assets/styles/variables';

.product-reviews {
  padding: 20px;

  .reviews-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 24px;
    
    h5 {
      margin: 0;
      font-weight: 600;
      color: #333;
    }
    
    .reviews-summary {
      .review-count {
        color: #666;
        font-size: 0.9rem;
      }
    }
  }
  
  .review-stats {
    display: grid;
    grid-template-columns: auto 1fr;
    gap: 32px;
    padding: 24px;
    background: #f8f9fa;
    border-radius: 8px;
    margin-bottom: 32px;
    
    @media (max-width: 768px) {
      grid-template-columns: 1fr;
      gap: 24px;
    }
    
    .average-rating {
      text-align: center;
      
      .rating-display {
        .rating-number {
          font-size: 3rem;
          font-weight: 700;
          margin: 0;
          color: $primary-color;
        }
        
        .stars {
          margin: 8px 0;
          
          i {
            color: #ffc107;
            font-size: 1.5rem;
          }
        }
        
        .rating-text {
          margin: 0;
          color: #666;
          font-size: 0.9rem;
        }
      }
    }
    
    .rating-distribution {
      .rating-bar {
        display: grid;
        grid-template-columns: auto auto 1fr auto;
        gap: 12px;
        align-items: center;
        margin-bottom: 12px;
        
        .rating-label {
          font-weight: 500;
          min-width: 12px;
        }
        
        .star-icon {
          color: #ffc107;
          font-size: 1rem;
        }
        
        .progress-bar {
          height: 8px;
          background: #e0e0e0;
          border-radius: 4px;
          overflow: hidden;
          
          .progress-fill {
            height: 100%;
            background: #ffc107;
            transition: width 0.3s ease;
          }
        }
        
        .rating-count {
          min-width: 30px;
          text-align: right;
          font-size: 0.875rem;
          color: #666;
        }
      }
    }
  }
  
  .no-reviews {
    text-align: center;
    padding: 32px;
    
    i {
      font-size: 4rem;
      color: #ccc;
      margin-bottom: 16px;
    }
    
    h6 {
      color: #666;
      margin-bottom: 8px;
    }
    
    p {
      color: #666;
      margin: 0;
    }
  }
  
  .add-review-section,
  .review-edit {
    background: white;
    border: 1px solid #e0e0e0;
    border-radius: 8px;
    padding: 24px;
    margin-bottom: 24px;
    
    .section-header,
    .edit-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 24px;
      
      h6 {
        margin: 0;
        font-weight: 600;
        color: #333;
      }
      
      .btn-flat {
        padding: 0;
        background: none;
        border: none;
        cursor: pointer;
        
        i {
          font-size: 1.5rem;
          color: #666;
        }
      }
    }
    
    .review-form,
    .edit-form {
      .form-label {
        display: block;
        margin-bottom: 8px;
        font-weight: 500;
        color: #666;
      }
      
      .rating-input {
        margin-bottom: 24px;
        
        .star-rating {
          display: flex;
          gap: 4px;
          margin-bottom: 8px;
          
          .star-btn {
            background: none;
            border: none;
            cursor: pointer;
            padding: 4px;
            border-radius: 50%;
            transition: all 0.2s ease;
            
            &:hover {
              background: rgba(255, 193, 7, 0.1);
              transform: scale(1.1);
            }
            
            i {
              font-size: 2rem;
              color: #e0e0e0;
              transition: color 0.2s ease;
            }
            
            &.active i,
            &.hover i {
              color: #ffc107;
            }
          }
        }
        
        .rating-desc {
          font-size: 0.875rem;
          color: $primary-color;
          font-weight: 500;
        }
      }
      
      .comment-input {
        margin-bottom: 24px;
        
        .textarea {
          border: 1px solid #e0e0e0;
          border-radius: 4px;
          padding: 12px;
          font-family: inherit;
          resize: vertical;
          min-height: 100px;
          width: 100%;
          box-sizing: border-box;
          
          &:focus {
            border-color: $primary-color;
            outline: none;
            box-shadow: 0 0 0 2px rgba(25, 118, 210, 0.1);
          }
        }
        
        .char-count {
          text-align: right;
          margin-top: 4px;
          
          span {
            font-size: 0.75rem;
            color: #666;
            
            &.near-limit {
              color: #ff9800;
            }
          }
        }
      }
      
      .form-actions {
        display: flex;
        justify-content: flex-end;
        gap: 12px;
        
        .btn-flat {
          padding: 8px 16px;
          background: #f8f9fa;
          border: 1px solid #e0e0e0;
          border-radius: 4px;
          cursor: pointer;
          color: #666;
          
          &:hover {
            background: #e9ecef;
          }
          
          &:disabled {
            opacity: 0.5;
            cursor: not-allowed;
          }
        }
        
        .btn {
          padding: 8px 16px;
          background: $primary-color;
          color: white;
          border: none;
          border-radius: 4px;
          cursor: pointer;
          display: flex;
          align-items: center;
          gap: 8px;
          
          &:hover {
            background: darken($primary-color, 10%);
          }
          
          &:disabled {
            opacity: 0.5;
            cursor: not-allowed;
          }
          
          i {
            font-size: 1.2rem;
          }
        }
      }
    }
  }
  
  .review-action {
    margin-bottom: 24px;
    
    .btn {
      padding: 8px 16px;
      background: $primary-color;
      color: white;
      border: none;
      border-radius: 4px;
      cursor: pointer;
      display: flex;
      align-items: center;
      gap: 8px;
      
      &:hover {
        background: darken($primary-color, 10%);
      }
      
      i {
        font-size: 1.2rem;
      }
    }
  }
  
  .already-reviewed {
    margin-bottom: 24px;
    
    .notice {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 16px;
      background: #e8f5e8;
      border: 1px solid #4caf50;
      border-radius: 4px;
      color: #2e7d32;
      
      i {
        color: #4caf50;
        font-size: 1.5rem;
      }
    }
  }
  
  .reviews-filter {
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 24px;
    padding: 16px;
    background: #f8f9fa;
    border-radius: 4px;
    margin-bottom: 24px;
    
    @media (max-width: 768px) {
      flex-direction: column;
      align-items: stretch;
      gap: 16px;
    }
    
    .filter-options,
    .sort-options {
      display: flex;
      align-items: center;
      gap: 8px;
      
      label {
        font-weight: 500;
        color: #666;
        white-space: nowrap;
      }
      
      select {
        min-width: 150px;
        padding: 4px 8px;
        border: 1px solid #ddd;
        border-radius: 4px;
        background: white;
        font-size: 0.9rem;
      }
    }
  }
  
  .reviews-loading {
    display: flex;
    justify-content: center;
    align-items: center;
    padding: 32px;
  }
  
  .reviews-list {
    .review-item {
      border-bottom: 1px solid #e0e0e0;
      padding: 24px 0;
      
      &:last-child {
        border-bottom: none;
      }
      
      &.user-review {
        background: rgba(25, 118, 210, 0.02);
        margin: 0 -16px;
        padding: 24px 16px;
        border-radius: 4px;
      }
      
      .review-display {
        .review-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: 16px;
          
          .reviewer-info {
            display: flex;
            gap: 16px;
            
            .reviewer-avatar {
              width: 50px;
              height: 50px;
              border-radius: 50%;
              object-fit: cover;
              border: 2px solid #e0e0e0;
            }
            
            .reviewer-details {
              .reviewer-name {
                margin: 0 0 8px 0;
                font-weight: 600;
                font-size: 1rem;
                color: #333;
              }
              
              .review-meta {
                display: flex;
                align-items: center;
                gap: 16px;
                
                @media (max-width: 768px) {
                  flex-direction: column;
                  align-items: flex-start;
                  gap: 8px;
                }
                
                .stars i {
                  color: #ffc107;
                  font-size: 1rem;
                }
                
                .review-date {
                  color: #666;
                  font-size: 0.875rem;
                }
                
                .edited-badge {
                  font-size: 0.75rem;
                  color: #666;
                  font-style: italic;
                }
              }
            }
          }
          
          .review-actions {
            display: flex;
            gap: 8px;
            
            .btn-flat {
              width: 36px;
              height: 36px;
              padding: 0;
              background: none;
              border: none;
              display: flex;
              align-items: center;
              justify-content: center;
              cursor: pointer;
              
              i {
                font-size: 1.1rem;
                color: #666;
              }
              
              &:hover {
                background: rgba(0, 0, 0, 0.1);
                border-radius: 50%;
              }
              
              &:disabled {
                opacity: 0.5;
                cursor: not-allowed;
              }
            }
          }
        }
        
        .review-content {
          margin-bottom: 16px;
          
          .review-comment {
            color: #333;
            line-height: 1.6;
            margin: 0;
          }
          
          .no-comment {
            color: #666;
            font-style: italic;
          }
        }
        
        .review-footer {
          display: flex;
          align-items: center;
          gap: 16px;
          padding-top: 16px;
          border-top: 1px solid #f0f0f0;
          
          .helpful-text {
            font-size: 0.875rem;
            color: #666;
          }
          
          .helpful-actions {
            display: flex;
            gap: 8px;
            
            .btn-flat {
              font-size: 0.75rem;
              padding: 4px 8px;
              background: none;
              border: none;
              display: flex;
              align-items: center;
              gap: 4px;
              cursor: pointer;
              
              i {
                font-size: 0.875rem;
                color: #666;
              }
              
              &:hover {
                background: rgba(0, 0, 0, 0.1);
                border-radius: 4px;
              }
            }
          }
        }
      }
    }
  }
  
  .no-filtered-reviews {
    text-align: center;
    padding: 32px;
    color: #666;
    
    .btn-flat {
      padding: 8px 16px;
      background: #f8f9fa;
      border: 1px solid #e0e0e0;
      border-radius: 4px;
      cursor: pointer;
      color: #666;
      
      &:hover {
        background: #e9ecef;
      }
    }
  }
  
  .pagination-wrapper {
    display: flex;
    justify-content: center;
    margin-top: 32px;
    
    .pagination {
      display: flex;
      gap: 8px;
      
      li {
        &.active a {
          background-color: $primary-color;
          color: white;
        }
        
        &.disabled a {
          opacity: 0.5;
          cursor: not-allowed;
        }
        
        a {
          padding: 8px 12px;
          border-radius: 4px;
          cursor: pointer;
          color: #333;
          
          &:hover {
            background-color: rgba(25, 118, 210, 0.1);
          }
        }
      }
    }
  }
}
</style>