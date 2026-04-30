import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { CartProvider } from './context/CartContext';

import Navbar   from './components/Navbar';
import Footer   from './components/Footer';
import HomePage from './pages/HomePage';
import CartPage from './pages/CartPage';
import CheckoutPage     from './pages/CheckoutPage';
import OrderConfirmPage from './pages/OrderConfirmPage';
import TrackOrderPage   from './pages/TrackOrderPage';
import MyOrdersPage     from './pages/MyOrdersPage';
import LoginPage        from './pages/LoginPage';
import RegisterPage     from './pages/RegisterPage';

import AdminDashboard from './pages/admin/AdminDashboard';
import AdminProducts  from './pages/admin/AdminProducts';
import AdminOrders    from './pages/admin/AdminOrders';

// Admin-only route guard
function AdminRoute({ children }) {
  const { isLoggedIn, isAdmin } = useAuth();
  if (!isLoggedIn) return <Navigate to="/login" />;
  if (!isAdmin)    return <Navigate to="/" />;
  return children;
}

// Customer-only route guard (admin is redirected to admin panel)
function CustomerRoute({ children }) {
  const { isLoggedIn, isAdmin } = useAuth();
  if (!isLoggedIn) return <Navigate to="/login" />;
  if (isAdmin)     return <Navigate to="/admin" />;
  return children;
}

// Private route (logged in, any role)
function PrivateRoute({ children }) {
  const { isLoggedIn } = useAuth();
  return isLoggedIn ? children : <Navigate to="/login" />;
}

function CustomerLayout({ children }) {
  return (
    <div style={{ display:'flex', flexDirection:'column', minHeight:'100vh' }}>
      <Navbar />
      <main style={{ flex:1 }}>{children}</main>
      <Footer />
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <CartProvider>
        <BrowserRouter>
          <Routes>
            {/* Public pages */}
            <Route path="/"            element={<CustomerLayout><HomePage /></CustomerLayout>} />
            <Route path="/order/track" element={<CustomerLayout><TrackOrderPage /></CustomerLayout>} />
            <Route path="/login"       element={<CustomerLayout><LoginPage /></CustomerLayout>} />
            <Route path="/register"    element={<CustomerLayout><RegisterPage /></CustomerLayout>} />

            {/* Customer-only pages (admin redirected away) */}
            <Route path="/cart"     element={<CustomerLayout><CustomerRoute><CartPage /></CustomerRoute></CustomerLayout>} />
            <Route path="/checkout" element={<CustomerLayout><CustomerRoute><CheckoutPage /></CustomerRoute></CustomerLayout>} />
            <Route path="/my-orders" element={<CustomerLayout><CustomerRoute><MyOrdersPage /></CustomerRoute></CustomerLayout>} />
            <Route path="/order/confirmation/:id" element={<CustomerLayout><PrivateRoute><OrderConfirmPage /></PrivateRoute></CustomerLayout>} />

            {/* Admin-only pages */}
            <Route path="/admin"          element={<AdminRoute><AdminDashboard /></AdminRoute>} />
            <Route path="/admin/products" element={<AdminRoute><AdminProducts /></AdminRoute>} />
            <Route path="/admin/orders"   element={<AdminRoute><AdminOrders /></AdminRoute>} />

            <Route path="*" element={<Navigate to="/" />} />
          </Routes>
        </BrowserRouter>
      </CartProvider>
    </AuthProvider>
  );
}