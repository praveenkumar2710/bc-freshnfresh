import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { adminApi } from '../../services/api';
import { useAuth }  from '../../context/AuthContext';
import './Admin.css';

export default function AdminDashboard() {
  const { logout } = useAuth();
  const navigate   = useNavigate();
  const [stats, setStats] = useState(null);
  const [today, setToday] = useState([]);
  const [error, setError] = useState(null);

  useEffect(() => {
    setError(null);
    adminApi.getDashboard()
      .then(setStats)
      .catch(err => {
        const status = err?.response?.status;
        if (status === 401 || status === 403) {
          setError('Access denied. Please log in as admin.');
        } else {
          setError('Could not load dashboard. Is the backend running?');
        }
      });
    adminApi.getTodayOrders()
      .then(data => setToday(Array.isArray(data) ? data : []))
      .catch(() => setToday([]));
  }, []);

  const statusColor = s => ({ DELIVERED:'badge-green', CANCELLED:'badge-red',
    PENDING:'badge-orange', CONFIRMED:'badge-blue',
    PREPARING:'badge-orange', OUT_FOR_DELIVERY:'badge-blue' }[s] || 'badge-gray');

  return (
    <div className="admin-wrap">
      {/* Sidebar */}
      <aside className="admin-sidebar">
        <div className="sidebar-brand">🌸 Admin</div>
        <nav>
          <Link to="/admin"          className="sb-link active">📊 Dashboard</Link>
          <Link to="/admin/products" className="sb-link">🌸 Products</Link>
          <Link to="/admin/orders"   className="sb-link">📦 Orders</Link>
          <Link to="/"               className="sb-link">🏠 View Shop</Link>
        </nav>
        <button className="sb-logout" onClick={() => { logout(); navigate('/login'); }}>
          🚪 Logout
        </button>
      </aside>

      {/* Main */}
      <main className="admin-main">
        <div className="admin-topbar">
          <h1>Dashboard</h1>
          <span style={{ fontSize:13, color:'var(--text-light)' }}>
            {new Date().toLocaleDateString('en-IN', { weekday:'long', day:'numeric', month:'long' })}
          </span>
        </div>

        {error && (
          <div style={{ background:'#fff0f0', border:'1px solid #ffcccc', borderRadius:8,
            padding:'16px 20px', marginBottom:20, color:'#c0392b', fontSize:14 }}>
            ⚠️ {error}
          </div>
        )}

        {/* Stats cards */}
        {stats && (
          <div className="stat-grid">
            <div className="stat-card">
              <div className="stat-icon">🌸</div>
              <div className="stat-num">{stats.totalProducts}</div>
              <div className="stat-label">Products Available</div>
            </div>
            <div className="stat-card warn">
              <div className="stat-icon">⏳</div>
              <div className="stat-num">{stats.pendingOrders}</div>
              <div className="stat-label">Pending Orders</div>
            </div>
            <div className="stat-card green">
              <div className="stat-icon">📦</div>
              <div className="stat-num">{stats.totalOrders}</div>
              <div className="stat-label">Total Orders</div>
            </div>
            <div className="stat-card blue">
              <div className="stat-icon">📅</div>
              <div className="stat-num">{stats.todayOrders}</div>
              <div className="stat-label">Today's Orders</div>
            </div>
            <div className="stat-card warn">
              <div className="stat-icon">⚠️</div>
              <div className="stat-num">{stats.lowStockProducts}</div>
              <div className="stat-label">Low Stock</div>
            </div>
          </div>
        )}

        {/* Today's orders */}
        <div style={{ marginTop:28 }}>
          <h2 style={{ fontSize:16, fontWeight:600, marginBottom:14 }}>
            📅 Today's Orders ({today.length})
          </h2>
          {today.length === 0 ? (
            <p style={{ color:'var(--text-light)', fontSize:14 }}>No orders today yet.</p>
          ) : (
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Order</th><th>Customer</th><th>Total</th><th>Status</th><th>Time</th>
                  </tr>
                </thead>
                <tbody>
                  {today.map(o => (
                    <tr key={o.id}>
                      <td style={{ fontWeight:600, fontSize:13 }}>{o.orderNumber}</td>
                      <td>{o.user?.name}</td>
                      <td style={{ fontWeight:700 }}>₹{o.totalAmount}</td>
                      <td>
                        <span className={`badge ${statusColor(o.status)}`}>
                          {o.status.replace(/_/g,' ')}
                        </span>
                      </td>
                      <td style={{ fontSize:12 }}>
                        {new Date(o.createdAt).toLocaleTimeString('en-IN', { hour:'2-digit', minute:'2-digit' })}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
