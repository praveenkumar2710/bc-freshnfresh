import axios from 'axios';

// ✅ Backend base URL (include /api)
export const API_BASE_URL = "https://bc-freshnfresh.onrender.com";
const BASE = `${API_BASE_URL}/api`;

// ✅ Axios instance
const apiClient = axios.create({
  baseURL: BASE,
});

// ✅ Attach JWT token
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

  // 🔐 Auth
  register: (data) => apiClient.post('/auth/register', data).then(r => r.data),
  login:    (data) => apiClient.post('/auth/login', data).then(r => r.data),
  getMe:    ()     => apiClient.get('/auth/me').then(r => r.data),
  updateProfile: (data) => apiClient.put('/auth/profile', data).then(r => r.data),

  // 🌸 Products
  getProducts: (search) =>
    apiClient.get('/products', { params: search ? { search } : {} }).then(r => r.data),

  getProductsByCategory: (cat) =>
    apiClient.get('/products', { params: { category: cat } }).then(r => r.data),

  getCategories: () =>
    apiClient.get('/products/categories').then(r => r.data),

  getProduct: (id) =>
    apiClient.get(`/products/${id}`).then(r => r.data),

  // 🚚 Delivery
  checkDelivery: (lat, lon, subtotal = 0) =>
    apiClient.get('/delivery/check', { params: { lat, lon, subtotal } }).then(r => r.data),

  getShopLocation: () =>
    apiClient.get('/delivery/shop-location').then(r => r.data),

  getZones: () =>
    apiClient.get('/delivery/zones').then(r => r.data),

  // 📦 Orders
  placeOrder: (data) =>
    apiClient.post('/orders', data).then(r => r.data),

  myOrders: () =>
    apiClient.get('/orders/my').then(r => r.data),

  getOrder: (id) =>
    apiClient.get(`/orders/${id}`).then(r => r.data),

  trackOrder: (no) =>
    apiClient.get(`/orders/track/${no}`).then(r => r.data),

  // 💳 Payment
  createRazorpayOrder: (orderId) =>
    apiClient.post('/payment/create-order', { orderId }).then(r => r.data),

  verifyPayment: (data) =>
    apiClient.post('/payment/verify', data).then(r => r.data),
};

/* ================= ADMIN API ================= */

export const adminApi = {

  getDashboard: () =>
    apiClient.get('/admin/dashboard').then(r => r.data),

  getAllProducts: () =>
    apiClient.get('/admin/products').then(r => r.data),

  addProductMultipart: (formData) =>
    apiClient.post('/admin/products', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    }).then(r => r.data),

  updateProductMultipart: (id, formData) =>
    apiClient.put(`/admin/products/${id}`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    }).then(r => r.data),

  deleteProduct: (id) =>
    apiClient.delete(`/admin/products/${id}`).then(r => r.data),

  getOrders: () =>
    apiClient.get('/admin/orders').then(r => r.data),

  updateStatus: (id, status, notes) =>
    apiClient.patch(`/admin/orders/${id}/status`, { status, notes }).then(r => r.data),
};