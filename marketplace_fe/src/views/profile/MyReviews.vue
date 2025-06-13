    <!-- src/views/profile/MyReviews.vue -->
<template>
  <div class="container">
    <h4>My Reviews</h4>
    
    <div v-if="reviews.length === 0" class="no-reviews">
      <p>You haven't written any reviews yet</p>
    </div>
    
    <div v-else class="reviews-list">
      <div v-for="review in reviews" :key="review.id" class="review-card">
        <!-- Review content with edit/delete options -->
      </div>
    </div>
  </div>
</template>

<script>
export default {
  data() {
    return {
      reviews: []
    }
  }
}
</script>