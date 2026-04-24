// ──────────────────────────────────────────────────────
// TrackOrderPage.js
// ──────────────────────────────────────────────────────
import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { api } from '../services/api';

const STEPS = [
  { key:'PENDING',           icon:'📋', label:'Order Placed' },
  { key:'CONFIRMED',         icon:'✅', label:'Confirmed' },
  { key:'PREPARING',         icon:'🌸', label:'Preparing' },
  { key:'OUT_FOR_DELIVERY',  icon:'🚚', label:'On the Way' },
  { key:'DELIVERED',         icon:'🎉', label:'Delivered' },
];

export default function TrackOrderPage() {
  const [params]            = useSearchParams();
  const [input,  setInput]  = useState(params.get('no') || '');
  const [order,  setOrder]  = useState(null);
  const [loading,setLoad]   = useState(false);
  const [error,  setError]  = useState('');

  const track = async (no = input) => {
    if (!no.trim()) return;
    setLoad(true); setError(''); setOrder(null);
    try   { setOrder(await api.trackOrder(no.trim())); }
    catch { setError('Order not found. Check your order number.'); }
    finally { setLoad(false); }
  };

  useEffect(() => { if (params.get('no')) track(params.get('no')); }, []); // eslint-disable-line

  const stepIdx = order ? STEPS.findIndex(s => s.key === order.status) : -1;

  return (
    <div className="page-wrapper" style={{ maxWidth: 640, margin: '0 auto' }}>
      <h1 style={{ marginBottom: 24 }}>📦 Track Your Order</h1>

      <div className="card" style={{ padding: 24, marginBottom: 24 }}>
        <div className="form-group">
          <label>Order Number</label>
          <div style={{ display: 'flex', gap: 8 }}>
            <input value={input} onChange={e => setInput(e.target.value)}
              placeholder="e.g. ORD-20240315-001"
              onKeyDown={e => e.key === 'Enter' && track()} />
            <button className="btn btn-primary" onClick={() => track()} disabled={loading}>
              {loading ? '⏳' : '🔍 Track'}
            </button>
          </div>
        </div>
        {error && <div className="alert alert-error">{error}</div>}
      </div>

      {order && (
        <div className="card" style={{ padding: 24 }}>
          <div style={{ display:'flex', justifyContent:'space-between', marginBottom:20, flexWrap:'wrap', gap:10 }}>
            <div>
              <h2 style={{ fontSize:20 }}>{order.orderNumber}</h2>
              <p style={{ fontSize:13, color:'var(--text-light)' }}>
                {new Date(order.createdAt).toLocaleString('en-IN')}
              </p>
            </div>
            <span className={`badge ${order.status==='DELIVERED'?'badge-green':order.status==='CANCELLED'?'badge-red':'badge-orange'}`}>
              {order.status.replace(/_/g,' ')}
            </span>
          </div>

          {/* Progress bar */}
          {order.status !== 'CANCELLED' && (
            <div style={{ position:'relative', marginBottom:28 }}>
              <div style={{ display:'flex', justifyContent:'space-between', position:'relative' }}>
                <div style={{ position:'absolute',top:16,left:'5%',right:'5%',height:3,background:'#e0e0e8',borderRadius:99,zIndex:0 }} />
                <div style={{ position:'absolute',top:16,left:'5%',width:`${Math.max(0, stepIdx/(STEPS.length-1))*90}%`,height:3,background:'var(--green-main)',borderRadius:99,transition:'width .4s',zIndex:1 }} />
                {STEPS.map((s, i) => (
                  <div key={s.key} style={{ display:'flex',flexDirection:'column',alignItems:'center',gap:6,zIndex:2,flex:1 }}>
                    <div style={{ width:34,height:34,borderRadius:'50%',background:i<=stepIdx?'var(--green-main)':'#e0e0e8',color:'white',display:'flex',alignItems:'center',justifyContent:'center',fontSize:15,transition:'background .3s' }}>
                      {s.icon}
                    </div>
                    <span style={{ fontSize:11,color:i<=stepIdx?'var(--green-dark)':'var(--text-light)',fontWeight:i===stepIdx?700:400,textAlign:'center' }}>
                      {s.label}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Items */}
          {order.items?.map((item, i) => (
            <div key={i} style={{ display:'flex',justifyContent:'space-between',padding:'8px 0',borderBottom:'1px solid #f5f5f5',fontSize:14,color:'var(--text-mid)' }}>
              <span>{item.emoji} {item.productName} × {item.quantity} {item.unit}</span>
              <span>₹{item.lineTotal}</span>
            </div>
          ))}

          <div style={{ marginTop:16, display:'flex', justifyContent:'space-between', fontSize:18, fontWeight:700 }}>
            <span>Total</span><span>₹{order.totalAmount}</span>
          </div>
          <p style={{ fontSize:13,color:'var(--text-light)',marginTop:8 }}>📍 {order.deliveryAddress}</p>
        </div>
      )}
    </div>
  );
}
