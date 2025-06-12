<!-- src/components/common/Footer.vue -->
<template>
  <footer class="page-footer">
    <div class="container">
      <div class="row">
        <div class="col l6 s12">
          <h5 class="white-text">Online Marketplace</h5>
          <p class="grey-text text-lighten-4">
            Your trusted platform for buying and selling quality products.
          </p>
        </div>
        <div class="col l4 offset-l2 s12">
          <h5 class="white-text">Quick Links</h5>
          <ul>
            <li><router-link to="/products" class="grey-text text-lighten-3">Products</router-link></li>
            <li><router-link to="/categories" class="grey-text text-lighten-3">Categories</router-link></li>
            <li><router-link to="/about" class="grey-text text-lighten-3">About Us</router-link></li>
            <li><router-link to="/contact" class="grey-text text-lighten-3">Contact</router-link></li>
          </ul>
        </div>
      </div>
    </div>
    <div class="footer-copyright">
      <div class="container">
        © {{ currentYear }} Online Marketplace. All rights reserved.
        <span class="grey-text text-lighten-4 right">
          Made with <i class="material-icons tiny">favorite</i> using Vue.js
        </span>
      </div>
    </div>
  </footer>
</template>

<script setup>
import { computed } from 'vue'

const currentYear = computed(() => new Date().getFullYear())
</script>

<style scoped lang="scss">
.page-footer {
  background-color: #1976d2;
  margin-top: auto;
  
  .footer-copyright {
    background-color: rgba(0, 0, 0, 0.2);
  }
  
  i {
    vertical-align: middle;
    color: #f44336;
  }
}
</style>