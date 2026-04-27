import axios from 'axios';

export const API_BASE_URL = "https://bc-freshnfresh.onrender.com";

// ✅ Create axios instance
const apiClient = axios.create({
  baseURL: API_BASE_URL,
});

// ✅ Attach token to every request
apiClient.interceptors.request.use(config => {
  const token = localStorage.getItem('fs_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// ✅ Handle 401 globally
apiClient.interceptors.response.use(
  res => res,
  err => {
    if (err?.response?.status === 401) {
      const url = err?.config?.url || '';
      if (!url.includes('/auth/login') && !url.includes('/auth/register')) {
        localStorage.removeItem('fs_token');
        localStorage.removeItem('fs_user');
        window.location.href = '/login';
      }
    }
    return Promise.reject(err);
  }
);

// ✅ Image helper
export function getImageUrl(imageUrl) {
  if (!imageUrl) return null;
  if (imageUrl.startsWith('http')) return imageUrl;
  return `${API_BASE_URL}${imageUrl}`;
}

/* ================= PUBLIC API ================= */

export const api = {

  // Auth
  register: (data) => apiClient.post('/api/auth/register', data).then(r => r.data),
  login:    (data) => apiClient.post('/api/auth/login', data).then(r => r.data),
  getMe:    ()     => apiClient.get('/api/auth/me').then(r => r.data),
  updateProfile: (data) => apiClient.put('/api/auth/profile', data).then(r => r.data),

  // Products
  getProducts: (search) =>
    apiClient.get('/api/products', { params: search ? { search } : {} }).then(r => r.data),

  getProductsByCategory: (cat) =>
    apiClient.get('/api/products', { params: { category: cat } }).then(r => r.data),

  getCategories: () =>
    apiClient.get('/api/products/categories').then(r => r.data),

  getProduct: (id) =>
    apiClient.get(`/api/products/${id}`).then(r => r.data),

  // Delivery
  checkDelivery: (lat, lon, subtotal = 0) =>
    apiClient.get('/api/delivery/check', { params: { lat, lon, subtotal } }).then(r => r.data),

  getShopLocation: () =>
    apiClient.get('/api/delivery/shop-location').then(r => r.data),

  getZones: () =>
    apiClient.get('/api/delivery/zones').then(r => r.data),

  // Orders
  placeOrder: (data) =>
    apiClient.post('/api/orders', data).then(r => r.data),

  myOrders: () =>
    apiClient.get('/api/orders/my').then(r => r.data),

  getOrder: (id) =>
    apiClient.get(`/api/orders/${id}`).then(r => r.data),

  trackOrder: (no) =>
    apiClient.get(`/api/orders/track/${no}`).then(r => r.data),

  // Payment
  createRazorpayOrder: (orderId) =>
    apiClient.post('/api/payment/create-order', { orderId }).then(r => r.data),

  verifyPayment: (data) =>
    apiClient.post('/api/payment/verify', data).then(r => r.data),
};

/* ================= ADMIN API ================= */

export const adminApi = {

  getDashboard: () =>
    apiClient.get('/api/admin/dashboard').then(r => r.data),

  getAllProducts: () =>
    apiClient.get('/api/admin/products').then(r => r.data),

  addProductMultipart: (formData) =>
    apiClient.post('/api/admin/products', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    }).then(r => r.data),

  updateProductMultipart: (id, formData) =>
    apiClient.put(`/api/admin/products/${id}`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    }).then(r => r.data),

  deleteProduct: (id) =>
    apiClient.delete(`/api/admin/products/${id}`).then(r => r.data),

  getOrders: () =>
    apiClient.get('/api/admin/orders').then(r => r.data),

  updateStatus: (id, status, notes) =>
    apiClient.patch(`/api/admin/orders/${id}/status`, { status, notes }).then(r => r.data),
};