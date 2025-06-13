<!-- src/components/common/Navbar.vue -->
<template>
  <nav class="nav-extended">
    <div class="nav-wrapper">
      <div class="container">
        <router-link to="/" class="brand-logo">
          <i class="material-icons">shopping_cart</i>
          Marketplace
        </router-link>
        
        <a href="#" data-target="mobile-nav" class="sidenav-trigger">
          <i class="material-icons">menu</i>
        </a>
        
        <ul class="right hide-on-med-and-down">
          <li>
            <router-link to="/products">
              <i class="material-icons left">store</i>
              Products
            </router-link>
          </li>
          
          <template v-if="authStore.isAuthenticated">
            <li>
              <router-link to="/cart" class="cart-link">
                <i class="material-icons left">shopping_basket</i>
                Cart
                <span v-if="cartCount > 0" class="badge">{{ cartCount }}</span>
              </router-link>
            </li>
            
            <li>
              <a 
                class="dropdown-trigger" 
                href="#!" 
                data-target="user-dropdown"
                @click.prevent="handleDropdownClick"
                :class="{ clicked: showDropdown }"
                :aria-expanded="showDropdown"
              >
                <i class="material-icons left">account_circle</i>
                {{ authStore.user?.name }}
                <i class="material-icons right">arrow_drop_down</i>
              </a>
            </li>
          </template>
          
          <template v-else>
            <li><router-link to="/login">Login</router-link></li>
            <li><router-link to="/register">Register</router-link></li>
          </template>
        </ul>
      </div>
    </div>

    <!-- Categories Tab -->
    <div class="nav-content">
      <div class="container">
        <ul class="tabs tabs-transparent">
          <li class="tab">
            <router-link to="/products">All Products</router-link>
          </li>
          <li class="tab" v-for="category in categories" :key="category.id">
            <router-link :to="`/products?category=${category.id}`">
              {{ category.name }}
            </router-link>
          </li>
        </ul>
      </div>
    </div>
  </nav>

  <!-- User Dropdown -->
  <ul 
    id="user-dropdown" 
    class="dropdown-content" 
    :class="{ show: showDropdown }"
    v-show="authStore.isAuthenticated"
  >
    <li><a href="#!" @click.prevent="navigateTo('/profile')">My Profile</a></li>
    <li><a href="#!" @click.prevent="navigateTo('/my-products')">My Products</a></li>
    <li><a href="#!" @click.prevent="navigateTo('/orders')">My Orders</a></li>
    <li><a href="#!" @click.prevent="navigateTo('/my-reviews')">My Reviews</a></li>
    <li v-if="authStore.isAdmin">
      <a href="#!" @click.prevent="navigateTo('/admin/dashboard')">Admin Dashboard</a>
    </li>
    <li class="divider"></li>
    <li><a href="#!" @click.prevent="logout">Logout</a></li>
  </ul>

  <!-- Mobile Navigation -->
  <ul class="sidenav" id="mobile-nav">
    <li><router-link to="/products">Products</router-link></li>
    <template v-if="authStore.isAuthenticated">
      <li><router-link to="/cart">Cart ({{ cartCount }})</router-link></li>
      <li><router-link to="/profile">Profile</router-link></li>
      <li><router-link to="/orders">Orders</router-link></li>
      <li><a @click="logout">Logout</a></li>
    </template>
    <template v-else>
      <li><router-link to="/login">Login</router-link></li>
      <li><router-link to="/register">Register</router-link></li>
    </template>
  </ul>

  <!-- Click outside overlay -->
  <div 
    v-if="showDropdown" 
    class="dropdown-overlay"
    @click="closeDropdown"
  ></div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted, nextTick, watch } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { useCartStore } from '@/stores/cart'
import { useCategoryStore } from '@/stores/category'

const authStore = useAuthStore()
const cartStore = useCartStore()
const categoryStore = useCategoryStore()
const router = useRouter()
const route = useRoute()

const categories = computed(() => categoryStore.categories)
const cartCount = computed(() => cartStore.itemCount)

// Manual dropdown control
const showDropdown = ref(false)

// Instance references
let dropdownInstance = null
let sidenavInstance = null
let tabsInstance = null

const handleDropdownClick = () => {
  console.log('🖱️ Dropdown click - Current state:', showDropdown.value)
  
  // Try Materialize first
  if (dropdownInstance) {
    try {
      if (dropdownInstance.isOpen) {
        dropdownInstance.close()
        showDropdown.value = false
      } else {
        dropdownInstance.open()
        showDropdown.value = true
      }
      console.log('✅ Materialize dropdown toggled')
      return
    } catch (error) {
      console.warn('⚠️ Materialize dropdown failed:', error)
    }
  }
  
  // Fallback to manual control
  console.log('🔄 Using manual dropdown control')
  showDropdown.value = !showDropdown.value
}

const closeDropdown = () => {
  console.log('❌ Closing dropdown')
  showDropdown.value = false
  if (dropdownInstance && dropdownInstance.isOpen) {
    dropdownInstance.close()
  }
}

const navigateTo = (path) => {
  console.log('🔄 Navigating to:', path)
  closeDropdown()
  router.push(path)
}

const logout = async () => {
  console.log('🚪 Logging out...')
  closeDropdown()
  await authStore.logout()
  setTimeout(initializeMaterialize, 300)
}

const destroyInstances = () => {
  try {
    if (dropdownInstance && typeof dropdownInstance.destroy === 'function') {
      dropdownInstance.destroy()
      dropdownInstance = null
    }
    if (sidenavInstance && typeof sidenavInstance.destroy === 'function') {
      sidenavInstance.destroy()
      sidenavInstance = null
    }
    if (tabsInstance && typeof tabsInstance.destroy === 'function') {
      tabsInstance.destroy()
      tabsInstance = null
    }
  } catch (error) {
    console.warn('Error destroying instances:', error)
  }
}

const initializeMaterialize = () => {
  if (!window.M) {
    console.warn('Materialize not available')
    return
  }

  destroyInstances()

  setTimeout(() => {
    try {
      // Initialize dropdown ONLY if user is authenticated
      if (authStore.isAuthenticated) {
        const dropdownElem = document.querySelector('.dropdown-trigger')
        if (dropdownElem) {
          dropdownInstance = M.Dropdown.init(dropdownElem, {
            coverTrigger: false,
            constrainWidth: false,
            hover: false,
            alignment: 'right',
            closeOnClick: true,
            inDuration: 300,
            outDuration: 200,
            onOpenStart: () => {
              console.log('📖 Materialize dropdown opening')
              showDropdown.value = true
            },
            onCloseStart: () => {
              console.log('📕 Materialize dropdown closing')  
              showDropdown.value = false
            }
          })
          console.log('✅ Dropdown initialized')
        }
      }
      
      // Initialize sidenav
      const sidenavElem = document.querySelector('.sidenav')
      if (sidenavElem) {
        sidenavInstance = M.Sidenav.init(sidenavElem)
      }
      
      // Initialize tabs
      const tabsElem = document.querySelector('.tabs')
      if (tabsElem) {
        tabsInstance = M.Tabs.init(tabsElem)
      }
    } catch (error) {
      console.warn('Error initializing Materialize:', error)
    }
  }, 200)
}

// Watch for auth changes
watch(() => authStore.isAuthenticated, async (newVal, oldVal) => {
  if (newVal !== oldVal) {
    showDropdown.value = false // Reset dropdown state
    await nextTick()
    setTimeout(initializeMaterialize, 300)
  }
})

// Watch for user changes
watch(() => authStore.user, async () => {
  if (authStore.isAuthenticated) {
    await nextTick()
    setTimeout(initializeMaterialize, 300)
  }
})

// Close dropdown on route change
watch(() => route.path, () => {
  closeDropdown()
  if (sidenavInstance) {
    sidenavInstance.close()
  }
})

// Close dropdown on ESC key
const handleEscape = (event) => {
  if (event.key === 'Escape') {
    closeDropdown()
  }
}

onMounted(async () => {
  await nextTick()
  
  // Add escape key listener
  document.addEventListener('keydown', handleEscape)
  
  // Fetch data first
  await categoryStore.fetchCategories()
  if (authStore.isAuthenticated) {
    await cartStore.fetchCart()
  }
  
  // Initialize after data is loaded
  setTimeout(initializeMaterialize, 100)
})

onUnmounted(() => {
  document.removeEventListener('keydown', handleEscape)
  destroyInstances()
})


</script>

<style scoped lang="scss">
nav {
  background-color: #1976d2;
  
  .brand-logo {
    display: flex;
    align-items: center;
    
    i {
      margin-right: 10px;
    }
  }
  
  .cart-link {
    position: relative;
    
    .badge {
      position: absolute;
      top: -8px;
      right: -8px;
      background-color: #f44336;
      color: white;
      border-radius: 10px;
      padding: 2px 6px;
      font-size: 12px;
      min-width: 20px;
      text-align: center;
    }
  }
}

.dropdown-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 9998;
  background: transparent;
}
</style>