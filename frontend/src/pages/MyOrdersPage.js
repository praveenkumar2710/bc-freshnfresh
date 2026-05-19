import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../services/api';

const statusColor = s =>
  ({ DELIVERED:'badge-green', CANCELLED:'badge-red', PENDING:'badge-orange',
     CONFIRMED:'badge-blue', PREPARING:'badge-orange', OUT_FOR_DELIVERY:'badge-blue' }[s] || 'badge-gray');

export default function MyOrdersPage() {
  const [orders,      setOrders]      = useState([]);
  const [loading,     setLoading]     = useState(true);
  const [cancelling,  setCancelling]  = useState(null);
  const [error,       setError]       = useState('');
  const [successMsg,  setSuccessMsg]  = useState('');

  useEffect(() => {
    api.myOrders().then(setOrders).catch(() => {}).finally(() => setLoading(false));
  }, []);

  const handleCancel = async (orderId, orderNumber) => {
    const confirmed = window.confirm(
      `Cancel order ${orderNumber}?\n\nThis cannot be undone. Stock will be restored.`
    );
    if (!confirmed) return;

    setCancelling(orderId);
    setError(''); setSuccessMsg('');

    try {
      await api.cancelOrder(orderId);
      setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status: 'CANCELLED' } : o));
      setSuccessMsg(`Order ${orderNumber} cancelled successfully.`);
      setTimeout(() => setSuccessMsg(''), 4000);
    } catch (err) {
      setError(err.response?.data?.error || 'Could not cancel. Please try again.');
      setTimeout(() => setError(''), 4000);
    } finally {
      setCancelling(null);
    }
  };

  if (loading) return <div className="page-wrapper"><div className="spinner" /></div>;

  return (
    <div className="page-wrapper">
      <h1 style={{ marginBottom: 24 }}>📋 My Orders</h1>

      {successMsg && (
        <div style={{ background:'#d4edda', border:'1px solid #c3e6cb', borderRadius:10,
          padding:'12px 16px', marginBottom:16, color:'#155724', fontSize:14 }}>
          ✅ {successMsg}
        </div>
      )}
      {error && (
        <div style={{ background:'#f8d7da', border:'1px solid #f5c6cb', borderRadius:10,
          padding:'12px 16px', marginBottom:16, color:'#721c24', fontSize:14 }}>
          ⚠️ {error}
        </div>
      )}

      {orders.length === 0 ? (
        <div style={{ textAlign:'center', padding:'60px 20px', color:'var(--text-mid)' }}>
          <div style={{ fontSize:60 }}>📦</div>
          <h3 style={{ margin:'12px 0 8px' }}>No orders yet</h3>
          <p style={{ fontSize:14 }}>Your order history will appear here.</p>
          <Link to="/" className="btn btn-primary" style={{ marginTop:20 }}>🌸 Start Shopping</Link>
        </div>
      ) : (
        <div style={{ display:'flex', flexDirection:'column', gap:14 }}>
          {orders.map(o => (
            <div key={o.id} className="card" style={{
              padding:'18px 22px', display:'flex', alignItems:'center', gap:16, flexWrap:'wrap'
            }}>
              <div style={{ flex:1, minWidth:160 }}>
                <div style={{ fontWeight:700, fontSize:15, marginBottom:4 }}>{o.orderNumber}</div>
                <div style={{ fontSize:13, color:'var(--text-light)' }}>
                  {new Date(o.createdAt).toLocaleDateString('en-IN',
                    { day:'numeric', month:'short', year:'numeric' })}
                </div>
              </div>

              <div style={{ textAlign:'center' }}>
                <div style={{ fontSize:13, color:'var(--text-light)', marginBottom:3 }}>
                  {o.itemCount} item{o.itemCount > 1 ? 's' : ''}
                </div>
                <div style={{ fontWeight:700, fontSize:17 }}>₹{o.totalAmount}</div>
              </div>

              <span className={`badge ${statusColor(o.status)}`}>
                {o.status.replace(/_/g,' ')}
              </span>

              <div style={{ display:'flex', gap:8 }}>
                <Link to={`/order/track?no=${o.orderNumber}`} className="btn btn-secondary btn-sm">
                  View →
                </Link>

                {o.status === 'PENDING' && (
                  <button
                    className="btn btn-sm"
                    style={{ background:'#fff0f0', color:'#c0392b',
                      border:'1px solid #f5c6cb', borderRadius:8,
                      padding:'6px 14px', fontSize:13,
                      cursor: cancelling === o.id ? 'not-allowed' : 'pointer',
                      opacity: cancelling === o.id ? 0.7 : 1 }}
                    onClick={() => handleCancel(o.id, o.orderNumber)}
                    disabled={cancelling === o.id}
                  >
                    {cancelling === o.id ? '⏳ Cancelling…' : '✕ Cancel'}
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}