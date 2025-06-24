// src/utils/formatters.js
import dayjs from 'dayjs'
import relativeTime from 'dayjs/plugin/relativeTime'
import localizedFormat from 'dayjs/plugin/localizedFormat'

dayjs.extend(relativeTime)
dayjs.extend(localizedFormat)

export const formatDate = (date) => {
  return dayjs(date).format('MMM DD, YYYY')
}

export const formatDateTime = (date) => {
  return dayjs(date).format('MMM DD, YYYY HH:mm')
}

export const formatTime = (date) => {
  return dayjs(date).format('HH:mm')
}

export const formatRelativeTime = (date) => {
  return dayjs(date).fromNow()
}

export const formatPrice = (price) => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD'
  }).format(price)
}

export const formatStatus = (status) => {
  const statusMap = {
    'PENDING': 'Pending',
    'PROCESSING': 'Processing',
    'SHIPPED': 'Shipped',
    'DELIVERED': 'Delivered',
    'CANCELLED': 'Cancelled'
  }
  return statusMap[status] || status
}

export const formatPaymentStatus = (status) => {
  const paymentStatusMap = {
    'PENDING': 'Pending',
    'COMPLETED': 'Completed',
    'FAILED': 'Failed',
    'REFUNDED': 'Refunded',
    'CANCELLED': 'Cancelled'
  }
  return paymentStatusMap[status] || status
}

export const truncateText = (text, maxLength = 100) => {
  if (!text) return ''
  return text.length > maxLength ? text.substring(0, maxLength) + '...' : text
}

// Additional utility formatters

export const formatCurrency = (amount, currency = 'USD') => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(amount)
}

export const formatNumber = (number) => {
  return new Intl.NumberFormat('en-US').format(number)
}

export const formatPercentage = (value, decimals = 0) => {
  return `${(value * 100).toFixed(decimals)}%`
}

export const formatFileSize = (bytes) => {
  if (bytes === 0) return '0 Bytes'
  
  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

export const formatPhoneNumber = (phone) => {
  if (!phone) return ''
  
  // Remove all non-numeric characters
  const cleaned = phone.replace(/\D/g, '')
  
  // Format as (XXX) XXX-XXXX for US numbers
  if (cleaned.length === 10) {
    return `(${cleaned.slice(0, 3)}) ${cleaned.slice(3, 6)}-${cleaned.slice(6)}`
  }
  
  // Return original if not 10 digits
  return phone
}

export const formatOrderStatus = (status) => {
  const statusConfig = {
    'PENDING': { label: 'Pending', color: 'orange' },
    'PROCESSING': { label: 'Processing', color: 'blue' },
    'SHIPPED': { label: 'Shipped', color: 'teal' },
    'DELIVERED': { label: 'Delivered', color: 'green' },
    'CANCELLED': { label: 'Cancelled', color: 'red' }
  }
  return statusConfig[status] || { label: status, color: 'grey' }
}

export const formatTimeAgo = (date) => {
  const now = dayjs()
  const targetDate = dayjs(date)
  const diffInSeconds = now.diff(targetDate, 'second')
  
  if (diffInSeconds < 60) return 'just now'
  if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)} minutes ago`
  if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)} hours ago`
  if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)} days ago`
  
  return formatDate(date)
}

export const formatDuration = (minutes) => {
  if (minutes < 60) return `${minutes} min`
  
  const hours = Math.floor(minutes / 60)
  const mins = minutes % 60
  
  if (mins === 0) return `${hours} hr`
  return `${hours} hr ${mins} min`
}

export const formatRating = (rating, maxRating = 5) => {
  return `${rating.toFixed(1)} / ${maxRating}`
}

export const formatAddress = (address) => {
  if (!address) return ''
  
  const parts = [
    address.street,
    address.city,
    address.state,
    address.zipCode,
    address.country
  ].filter(Boolean)
  
  return parts.join(', ')
}

export const formatName = (firstName, lastName) => {
  return [firstName, lastName].filter(Boolean).join(' ')
}

export const formatSlug = (text) => {
  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, '') // Remove special characters
    .replace(/\s+/g, '-') // Replace spaces with hyphens
    .replace(/--+/g, '-') // Replace multiple hyphens with single hyphen
    .trim()
}

export const formatErrorMessage = (error) => {
  if (typeof error === 'string') return error
  
  if (error.response?.data?.message) {
    return error.response.data.message
  }
  
  if (error.message) {
    return error.message
  }
  
  return 'An unexpected error occurred'
}

// Additional date/time formatters
export const formatDateShort = (date) => {
  return dayjs(date).format('MM/DD/YYYY')
}

export const formatDateLong = (date) => {
  return dayjs(date).format('MMMM DD, YYYY')
}

export const formatTimeRange = (startDate, endDate) => {
  const start = dayjs(startDate)
  const end = dayjs(endDate)
  
  if (start.isSame(end, 'day')) {
    return `${start.format('MMM DD, YYYY')} ${start.format('HH:mm')} - ${end.format('HH:mm')}`
  }
  
  return `${start.format('MMM DD, YYYY HH:mm')} - ${end.format('MMM DD, YYYY HH:mm')}`
}

export const formatAge = (birthDate) => {
  return dayjs().diff(dayjs(birthDate), 'year')
}

export const formatTimeOnly = (date) => {
  return dayjs(date).format('h:mm A')
}

export const formatDateTimeLocale = (date, locale = 'en') => {
  return dayjs(date).locale(locale).format('LLL')
}

// Export all formatters as a single object for convenience
export default {
  formatDate,
  formatDateTime,
  formatTime,
  formatRelativeTime,
  formatPrice,
  formatStatus,
  formatPaymentStatus,
  truncateText,
  formatCurrency,
  formatNumber,
  formatPercentage,
  formatFileSize,
  formatPhoneNumber,
  formatOrderStatus,
  formatTimeAgo,
  formatDuration,
  formatRating,
  formatAddress,
  formatName,
  formatSlug,
  formatErrorMessage,
  formatDateShort,
  formatDateLong,
  formatTimeRange,
  formatAge,
  formatTimeOnly,
  formatDateTimeLocale
}