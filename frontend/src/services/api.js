import axios from 'axios';

const BASE = '/api';

// ✅ FIX: Use this to prefix image URLs from backend
// e.g. product.imageUrl = '/uploads/products/xxx.jpg'
// → full URL = 'http://localhost:8080/uploads/products/xxx.jpg'
export const BACKEND_URL = 'http://localhost:8080';

// Helper to get the full image URL from a relative path
export function getImageUrl(imageUrl) {
  if (!imageUrl) return null;
  if (imageUrl.startsWith('http')) return imageUrl;   // already absolute
  return `${BACKEND_URL}${imageUrl}`;                 // prefix backend origin
}

// Attach JWT token to every request if present
axios.interceptors.request.use(cfg => {
  const token = localStorage.getItem('fs_token');
  if (token) cfg.headers.Authorization = `Bearer ${token}`;
  return cfg;
});

// Global response interceptor — handle 401 (token expired) gracefully
axios.interceptors.response.use(
  res => res,
  err => {
    if (err?.response?.status === 401) {
      const url = err?.config?.url || '';
      if (!url.includes('/auth/login') && !url.includes('/auth/register')) {
        localStorage.removeItem('fs_token');
        localStorage.removeItem('fs_user');
        if (!window.location.pathname.includes('/login')) {
          window.location.href = '/login';
        }
      }
    }
    return Promise.reject(err);
  }
);

/* ══════════════════════════════════════════════════════
   PUBLIC API
══════════════════════════════════════════════════════ */
export const api = {

  /* Auth */
  register: (data)        => axios.post(`${BASE}/auth/register`, data).then(r => r.data),
  login:    (data)        => axios.post(`${BASE}/auth/login`,    data).then(r => r.data),
  getMe:    ()            => axios.get(`${BASE}/auth/me`).then(r => r.data),
  updateProfile: (data)   => axios.put(`${BASE}/auth/profile`,  data).then(r => r.data),

  /* Products */
  getProducts:  (search)  => axios.get(`${BASE}/products`,  { params: search ? { search } : {} }).then(r => r.data),
  getProductsByCategory: (cat) => axios.get(`${BASE}/products`, { params: { category: cat } }).then(r => r.data),
  getCategories: ()       => axios.get(`${BASE}/products/categories`).then(r => r.data),
  getProduct:   (id)      => axios.get(`${BASE}/products/${id}`).then(r => r.data),

  /* Delivery */
  checkDelivery: (lat, lon, subtotal = 0) =>
    axios.get(`${BASE}/delivery/check`, { params: { lat, lon, subtotal } }).then(r => r.data),
  getShopLocation: ()     => axios.get(`${BASE}/delivery/shop-location`).then(r => r.data),
  getZones:        ()     => axios.get(`${BASE}/delivery/zones`).then(r => r.data),

  /* Orders */
  placeOrder:  (data)     => axios.post(`${BASE}/orders`,            data).then(r => r.data),
  myOrders:    ()         => axios.get(`${BASE}/orders/my`).then(r => r.data),
  getOrder:    (id)       => axios.get(`${BASE}/orders/${id}`).then(r => r.data),
  trackOrder:  (no)       => axios.get(`${BASE}/orders/track/${no}`).then(r => r.data),

  /* Razorpay Payment */
  createRazorpayOrder: (orderId) =>
    axios.post(`${BASE}/payment/create-order`, { orderId }).then(r => r.data),
  verifyPayment: (data) =>
    axios.post(`${BASE}/payment/verify`, data).then(r => r.data),
};

/* ══════════════════════════════════════════════════════
   ADMIN API  (JWT with role ADMIN)
══════════════════════════════════════════════════════ */
export const adminApi = {

  getDashboard:   ()         => axios.get(`${BASE}/admin/dashboard`).then(r => r.data),

  /* Products */
  getAllProducts:  ()         => axios.get(`${BASE}/admin/products`).then(r => r.data),

  // ✅ Multipart methods — send image + fields together as FormData
  addProductMultipart: (formData) =>
    axios.post(`${BASE}/admin/products`, formData,
      { headers: { 'Content-Type': 'multipart/form-data' } }).then(r => r.data),

  updateProductMultipart: (id, formData) =>
    axios.put(`${BASE}/admin/products/${id}`, formData,
      { headers: { 'Content-Type': 'multipart/form-data' } }).then(r => r.data),

  // Legacy JSON methods (kept for compatibility)
  addProduct:      (d)        => axios.post(`${BASE}/admin/products`,         d).then(r => r.data),
  updateProduct:   (id, d)    => axios.put(`${BASE}/admin/products/${id}`,    d).then(r => r.data),

  updatePrice:     (id, price)=> axios.patch(`${BASE}/admin/products/${id}/price`, { price }).then(r => r.data),
  updateStock:     (id, stock)=> axios.patch(`${BASE}/admin/products/${id}/stock`, { stock }).then(r => r.data),
  toggleProduct:   (id)       => axios.patch(`${BASE}/admin/products/${id}/toggle`, {}).then(r => r.data),
  deleteProduct:   (id)       => axios.delete(`${BASE}/admin/products/${id}`).then(r => r.data),
  uploadProductImage: (id, formData) =>
    axios.post(`${BASE}/admin/products/${id}/image`, formData,
      { headers: { 'Content-Type': 'multipart/form-data' } }).then(r => r.data),

  /* Orders */
  getOrders:       ()         => axios.get(`${BASE}/admin/orders`).then(r => r.data),
  getTodayOrders:  ()         => axios.get(`${BASE}/admin/orders/today`).then(r => r.data),
  getOrder:        (id)       => axios.get(`${BASE}/admin/orders/${id}`).then(r => r.data),
  updateStatus:    (id, status, notes) =>
    axios.patch(`${BASE}/admin/orders/${id}/status`, { status, notes }).then(r => r.data),
};