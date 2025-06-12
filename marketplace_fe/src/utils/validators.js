// src/utils/validators.js
export const validators = {
  email: (value) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    return emailRegex.test(value) || 'Invalid email address'
  },

  required: (value) => {
    return !!value || 'This field is required'
  },

  minLength: (min) => (value) => {
    return (value && value.length >= min) || `Minimum ${min} characters required`
  },

  maxLength: (max) => (value) => {
    return (value && value.length <= max) || `Maximum ${max} characters allowed`
  },

  numeric: (value) => {
    return /^\d+$/.test(value) || 'Only numbers allowed'
  },

  price: (value) => {
    return /^\d+(\.\d{1,2})?$/.test(value) || 'Invalid price format'
  },

  phoneNumber: (value) => {
    const phoneRegex = /^[\d\s\-\+\(\)]+$/
    return phoneRegex.test(value) || 'Invalid phone number'
  },

  password: (value) => {
    return (value && value.length >= 6) || 'Password must be at least 6 characters'
  },

  confirmPassword: (password) => (value) => {
    return value === password || 'Passwords do not match'
  }
}