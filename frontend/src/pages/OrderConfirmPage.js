import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { api } from '../services/api';
import './OrderConfirmPage.css';

export default function OrderConfirmPage() {
  const { id }             = useParams();
  const [order, setOrder]  = useState(null);
  const [loading, setLoad] = useState(true);

  useEffect(() => {
    api.getOrder(id).then(setOrder).catch(() => {}).finally(() => setLoad(false));
  }, [id]);

  if (loading) return <div className="page-wrapper"><div className="spinner" /></div>;
  if (!order)  return <div className="page-wrapper"><div className="alert alert-error">Order not found.</div></div>;

  return (
    <div className="page-wrapper">
      <div className="confirm-wrap">
        <div className="confirm-icon">🎉</div>
        <h1>Order Placed!</h1>
        <p className="confirm-sub">Thank you, {order.customerName}! Your flowers are being prepared.</p>

        <div className="order-num-box">
          <span>Your Order Number</span>
          <strong>{order.orderNumber}</strong>
          <small>Save this to track your order</small>
        </div>

        {/* Items */}
        <div className="confirm-section">
          <h3>🌸 Items</h3>
          {order.items.map((item, i) => (
            <div key={i} className="conf-row">
              <span>{item.emoji} {item.productName} × {item.quantity} {item.unit}</span>
              <span>₹{item.lineTotal}</span>
            </div>
          ))}
        </div>

        {/* Bill */}
        <div className="confirm-section">
          <h3>💰 Bill</h3>
          <div className="conf-row"><span>Subtotal</span><span>₹{order.subtotal}</span></div>
          <div className="conf-row">
            <span>Delivery ({Number(order.deliveryDistanceKm).toFixed(1)} km)</span>
            <span>{order.deliveryCharge == 0 ? '🎉 FREE' : `₹${order.deliveryCharge}`}</span>
          </div>
          <hr className="divider" />
          <div className="conf-row conf-total">
            <span>{order.paymentMethod === 'ONLINE' ? '📱 Pay via UPI' : '💵 Pay on delivery'}</span>
            <strong>₹{order.totalAmount}</strong>
          </div>
        </div>

        {/* Address */}
        <div className="confirm-section">
          <h3>📍 Deliver to</h3>
          <p style={{ fontSize: 14, color: 'var(--text-mid)' }}>{order.deliveryAddress}</p>
        </div>

        <div className="confirm-actions">
          <Link to={`/order/track?no=${order.orderNumber}`} className="btn btn-secondary">
            📦 Track Order
          </Link>
          <Link to="/my-orders" className="btn btn-secondary">📋 My Orders</Link>
          <Link to="/" className="btn btn-primary">🌸 Shop More</Link>
        </div>

        <div style={{ background:'#f0fff8', border:'1.5px solid #b2dfcc', borderRadius:12, padding:'14px 18px', marginTop:20, fontSize:13, color:'#1a5c30', textAlign:'center' }}>
          🌸 We'll call you before delivery to confirm timing.<br />
          <strong>Questions?</strong> WhatsApp us on the number provided at checkout.
          
        </div>
        {/* Order again banner */}
<div style={{
  background: '#1a5c30', color: '#fff', borderRadius: 12,
  padding: '18px 20px', marginTop: 16, textAlign: 'center'
}}>
  <div style={{ fontSize: 20, marginBottom: 6 }}>🌸 Thank you, {order.customerName}!</div>
  <p style={{ margin: '0 0 12px', fontSize: 13, color: '#c8e6c9' }}>
    Loved your flowers? Order again anytime — same-day delivery within 12 km.
  </p>
  <Link to="/" className="btn btn-warm" style={{ display: 'inline-block' }}>
    🛒 Order Again
  </Link>
</div>
      </div>
    </div>
  );
}
