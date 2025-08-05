const crypto = require('crypto');
const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');
const path = require('path');
const fs = require('fs').promises;


const generateRandomString = (length = 32) => {
  return crypto.randomBytes(length).toString('hex');
};

const generateRandomNumber = (min, max) => {
  return Math.floor(Math.random() * (max - min + 1)) + min;
};

const generateUniqueId = () => {
  return uuidv4();
};

const generateOrderNumber = () => {
  const timestamp = Date.now().toString();
  const random = Math.random().toString(36).substring(2, 8).toUpperCase();
  return `ORD-${timestamp}-${random}`;
};

const generateSKU = (prefix = 'PROD') => {
  const timestamp = Date.now().toString().slice(-6);
  const random = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `${prefix}-${timestamp}-${random}`;
};

const hashPassword = async (password, saltRounds = 12) => {
  return await bcrypt.hash(password, saltRounds);
};

const comparePassword = async (password, hashedPassword) => {
  return await bcrypt.compare(password, hashedPassword);
};

const formatCurrency = (amount, currency = 'USD', locale = 'en-US') => {
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency: currency
  }).format(amount);
};

const formatDate = (date, format = 'YYYY-MM-DD') => {
  const d = new Date(date);
  
  switch (format) {
    case 'YYYY-MM-DD':
      return d.toISOString().split('T')[0];
    case 'MM/DD/YYYY':
      return d.toLocaleDateString('en-US');
    case 'DD/MM/YYYY':
      return d.toLocaleDateString('en-GB');
    case 'YYYY-MM-DD HH:mm:ss':
      return d.toISOString().replace('T', ' ').split('.')[0];
    default:
      return d.toISOString();
  }
};

const calculateAge = (birthDate) => {
  const today = new Date();
  const birth = new Date(birthDate);
  let age = today.getFullYear() - birth.getFullYear();
  const monthDiff = today.getMonth() - birth.getMonth();
  
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
    age--;
  }
  
  return age;
};

const isValidEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

const isValidPhone = (phone) => {
  const phoneRegex = /^\+?[\d\s\-\(\)]+$/;
  return phoneRegex.test(phone);
};

const isValidUrl = (url) => {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
};

const sanitizeString = (str) => {
  if (!str) return '';
  return str
    .replace(/<[^>]*>/g, '') // Remove HTML tags
    .replace(/[^\w\s\-.,!?]/g, '') // Remove special characters
    .trim();
};

const truncateString = (str, maxLength = 100, suffix = '...') => {
  if (!str || str.length <= maxLength) return str;
  return str.substring(0, maxLength - suffix.length) + suffix;
};

const slugify = (str) => {
  if (!str) return '';
  return str
    .toLowerCase()
    .replace(/[^\w\s-]/g, '') // Remove special characters
    .replace(/[\s_-]+/g, '-') // Replace spaces and underscores with hyphens
    .replace(/^-+|-+$/g, ''); // Remove leading/trailing hyphens
};

const capitalize = (str) => {
  if (!str) return '';
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
};

const toTitleCase = (str) => {
  if (!str) return '';
  return str.replace(/\w\S*/g, (txt) => 
    txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase()
  );
};

const generatePagination = (page, limit, total) => {
  const totalPages = Math.ceil(total / limit);
  const hasNextPage = page < totalPages;
  const hasPrevPage = page > 1;
  
  return {
    currentPage: page,
    totalPages,
    totalItems: total,
    itemsPerPage: limit,
    hasNextPage,
    hasPrevPage,
    nextPage: hasNextPage ? page + 1 : null,
    prevPage: hasPrevPage ? page - 1 : null
  };
};

const calculatePercentage = (value, total) => {
  if (total === 0) return 0;
  return Math.round((value / total) * 100);
};

const calculateDiscountPercentage = (originalPrice, discountedPrice) => {
  if (originalPrice === 0) return 0;
  return Math.round(((originalPrice - discountedPrice) / originalPrice) * 100);
};

const calculateTax = (amount, taxRate) => {
  return Math.round((amount * taxRate) * 100) / 100;
};

const calculateShippingCost = (weight, baseRate = 5, perKgRate = 2) => {
  return Math.round((baseRate + (weight * perKgRate)) * 100) / 100;
};

const generateFileName = (originalName, prefix = '') => {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 8);
  const extension = path.extname(originalName);
  const name = path.basename(originalName, extension);
  const sanitizedName = slugify(name);
  
  return `${prefix}${sanitizedName}-${timestamp}-${random}${extension}`;
};

const getFileExtension = (filename) => {
  return path.extname(filename).toLowerCase();
};

const isImageFile = (filename) => {
  const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.bmp'];
  return imageExtensions.includes(getFileExtension(filename));
};

const isDocumentFile = (filename) => {
  const documentExtensions = ['.pdf', '.doc', '.docx', '.txt', '.rtf'];
  return documentExtensions.includes(getFileExtension(filename));
};

const isExcelFile = (filename) => {
  const excelExtensions = ['.xls', '.xlsx', '.csv'];
  return excelExtensions.includes(getFileExtension(filename));
};

const formatFileSize = (bytes) => {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

const ensureDirectoryExists = async (dirPath) => {
  try {
    await fs.access(dirPath);
  } catch {
    await fs.mkdir(dirPath, { recursive: true });
  }
};

const deleteFileIfExists = async (filePath) => {
  try {
    await fs.access(filePath);
    await fs.unlink(filePath);
    return true;
  } catch {
    return false;
  }
};

const getClientIP = (req) => {
  return req.ip || 
         req.connection.remoteAddress || 
         req.socket.remoteAddress || 
         req.connection.socket?.remoteAddress ||
         req.headers['x-forwarded-for']?.split(',')[0] ||
         req.headers['x-real-ip'] ||
         'unknown';
};

/**
 * Get user agent info
 */
const getUserAgentInfo = (userAgent) => {
  if (!userAgent) return { browser: 'Unknown', os: 'Unknown', device: 'Unknown' };
  
  // Simple user agent parsing (for production, consider using a library like ua-parser-js)
  const ua = userAgent.toLowerCase();
  
  let browser = 'Unknown';
  let os = 'Unknown';
  let device = 'Unknown';
  
  // Browser detection
  if (ua.includes('chrome')) browser = 'Chrome';
  else if (ua.includes('firefox')) browser = 'Firefox';
  else if (ua.includes('safari')) browser = 'Safari';
  else if (ua.includes('edge')) browser = 'Edge';
  else if (ua.includes('opera')) browser = 'Opera';
  
  // OS detection
  if (ua.includes('windows')) os = 'Windows';
  else if (ua.includes('mac')) os = 'macOS';
  else if (ua.includes('linux')) os = 'Linux';
  else if (ua.includes('android')) os = 'Android';
  else if (ua.includes('ios')) os = 'iOS';
  
  // Device detection
  if (ua.includes('mobile')) device = 'Mobile';
  else if (ua.includes('tablet')) device = 'Tablet';
  else device = 'Desktop';
  
  return { browser, os, device };
};

/**
 * Generate search query for database
 */
const generateSearchQuery = (searchTerm, fields) => {
  if (!searchTerm || !fields.length) return {};
  
  const { Op } = require('sequelize');
  const conditions = fields.map(field => ({
    [field]: {
      [Op.iLike]: `%${searchTerm}%`
    }
  }));
  
  return {
    [Op.or]: conditions
  };
};

/**
 * Sort array by multiple criteria
 */
const sortByMultiple = (array, sortCriteria) => {
  return array.sort((a, b) => {
    for (const criteria of sortCriteria) {
      const { field, order = 'asc' } = criteria;
      const aValue = a[field];
      const bValue = b[field];
      
      if (aValue < bValue) return order === 'asc' ? -1 : 1;
      if (aValue > bValue) return order === 'asc' ? 1 : -1;
    }
    return 0;
  });
};

/**
 * Group array by key
 */
const groupBy = (array, key) => {
  return array.reduce((groups, item) => {
    const group = item[key];
    groups[group] = groups[group] || [];
    groups[group].push(item);
    return groups;
  }, {});
};

/**
 * Count occurrences in array
 */
const countOccurrences = (array, value) => {
  return array.filter(item => item === value).length;
};

/**
 * Remove duplicates from array
 */
const removeDuplicates = (array, key = null) => {
  if (key) {
    const seen = new Set();
    return array.filter(item => {
      const value = item[key];
      if (seen.has(value)) {
        return false;
      }
      seen.add(value);
      return true;
    });
  }
  return [...new Set(array)];
};

/**
 * Deep clone object
 */
const deepClone = (obj) => {
  if (obj === null || typeof obj !== 'object') return obj;
  if (obj instanceof Date) return new Date(obj.getTime());
  if (obj instanceof Array) return obj.map(item => deepClone(item));
  if (typeof obj === 'object') {
    const clonedObj = {};
    for (const key in obj) {
      if (obj.hasOwnProperty(key)) {
        clonedObj[key] = deepClone(obj[key]);
      }
    }
    return clonedObj;
  }
};

/**
 * Merge objects deeply
 */
const deepMerge = (target, source) => {
  const result = deepClone(target);
  
  for (const key in source) {
    if (source.hasOwnProperty(key)) {
      if (source[key] && typeof source[key] === 'object' && !Array.isArray(source[key])) {
        result[key] = deepMerge(result[key] || {}, source[key]);
      } else {
        result[key] = source[key];
      }
    }
  }
  
  return result;
};

/**
 * Generate random color
 */
const generateRandomColor = () => {
  return '#' + Math.floor(Math.random() * 16777215).toString(16);
};

/**
 * Convert hex to RGB
 */
const hexToRgb = (hex) => {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result ? {
    r: parseInt(result[1], 16),
    g: parseInt(result[2], 16),
    b: parseInt(result[3], 16)
  } : null;
};

/**
 * Convert RGB to hex
 */
const rgbToHex = (r, g, b) => {
  return '#' + [r, g, b].map(x => {
    const hex = x.toString(16);
    return hex.length === 1 ? '0' + hex : hex;
  }).join('');
};

/**
 * Sleep function
 */
const sleep = (ms) => {
  return new Promise(resolve => setTimeout(resolve, ms));
};

/**
 * Retry function with exponential backoff
 */
const retry = async (fn, maxRetries = 3, delay = 1000) => {
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await fn();
    } catch (error) {
      if (i === maxRetries - 1) throw error;
      await sleep(delay * Math.pow(2, i));
    }
  }
};

/**
 * Debounce function
 */
const debounce = (func, wait) => {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
};

/**
 * Throttle function
 */
const throttle = (func, limit) => {
  let inThrottle;
  return function() {
    const args = arguments;
    const context = this;
    if (!inThrottle) {
      func.apply(context, args);
      inThrottle = true;
      setTimeout(() => inThrottle = false, limit);
    }
  };
};

module.exports = {
  generateRandomString,
  generateRandomNumber,
  generateUniqueId,
  generateOrderNumber,
  generateSKU,
  hashPassword,
  comparePassword,
  formatCurrency,
  formatDate,
  calculateAge,
  isValidEmail,
  isValidPhone,
  isValidUrl,
  sanitizeString,
  truncateString,
  slugify,
  capitalize,
  toTitleCase,
  generatePagination,
  calculatePercentage,
  calculateDiscountPercentage,
  calculateTax,
  calculateShippingCost,
  generateFileName,
  getFileExtension,
  isImageFile,
  isDocumentFile,
  isExcelFile,
  formatFileSize,
  ensureDirectoryExists,
  deleteFileIfExists,
  getClientIP,
  getUserAgentInfo,
  generateSearchQuery,
  sortByMultiple,
  groupBy,
  countOccurrences,
  removeDuplicates,
  deepClone,
  deepMerge,
  generateRandomColor,
  hexToRgb,
  rgbToHex,
  sleep,
  retry,
  debounce,
  throttle
};
