import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../services/api';

const statusColor = s =>
  ({ DELIVERED:'badge-green', CANCELLED:'badge-red', PENDING:'badge-orange',
     CONFIRMED:'badge-blue', PREPARING:'badge-orange', OUT_FOR_DELIVERY:'badge-blue' }[s] || 'badge-gray');

export default function MyOrdersPage() {
  const [orders,  setOrders]  = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.myOrders().then(setOrders).catch(() => {}).finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="page-wrapper"><div className="spinner" /></div>;

  return (
    <div className="page-wrapper">
      <h1 style={{ marginBottom: 24 }}>📋 My Orders</h1>

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
            <div key={o.id} className="card" style={{ padding:'18px 22px', display:'flex', alignItems:'center', gap:16, flexWrap:'wrap' }}>
              <div style={{ flex:1, minWidth:160 }}>
                <div style={{ fontWeight:700, fontSize:15, marginBottom:4 }}>{o.orderNumber}</div>
                <div style={{ fontSize:13, color:'var(--text-light)' }}>
                  {new Date(o.createdAt).toLocaleDateString('en-IN', { day:'numeric', month:'short', year:'numeric' })}
                </div>
              </div>
              <div style={{ textAlign:'center' }}>
                <div style={{ fontSize:13, color:'var(--text-light)', marginBottom:3 }}>{o.itemCount} item{o.itemCount>1?'s':''}</div>
                <div style={{ fontWeight:700, fontSize:17 }}>₹{o.totalAmount}</div>
              </div>
              <span className={`badge ${statusColor(o.status)}`}>{o.status.replace(/_/g,' ')}</span>
              <Link to={`/order/track?no=${o.orderNumber}`} className="btn btn-secondary btn-sm">
                View →
              </Link>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
