import React, { useEffect, useState, useRef } from 'react';
import { Link } from 'react-router-dom';
import { adminApi } from '../../services/api';

const STATUSES = ['ALL','PENDING','CONFIRMED','PREPARING','OUT_FOR_DELIVERY','DELIVERED','CANCELLED'];

const STATUS_META = {
  PENDING:          { color:'badge-orange', label:'Pending',          icon:'⏳' },
  CONFIRMED:        { color:'badge-blue',   label:'Confirmed',        icon:'✅' },
  PREPARING:        { color:'badge-orange', label:'Preparing',        icon:'🌸' },
  OUT_FOR_DELIVERY: { color:'badge-blue',   label:'Out for Delivery', icon:'🛵' },
  DELIVERED:        { color:'badge-green',  label:'Delivered',        icon:'📦' },
  CANCELLED:        { color:'badge-red',    label:'Cancelled',        icon:'❌' },
};

const NEXT_STATUS = {
  PENDING:          'CONFIRMED',
  CONFIRMED:        'PREPARING',
  PREPARING:        'OUT_FOR_DELIVERY',
  OUT_FOR_DELIVERY: 'DELIVERED',
};

const NEXT_LABEL = {
  PENDING:          '✅ Confirm Order',
  CONFIRMED:        '🌸 Start Preparing',
  PREPARING:        '🛵 Mark Out for Delivery',
  OUT_FOR_DELIVERY: '📦 Mark as Delivered',
};

function StatusTimeline({ status }) {
  const steps     = ['PENDING','CONFIRMED','PREPARING','OUT_FOR_DELIVERY','DELIVERED'];
  const currIndex = steps.indexOf(status);

  if (status === 'CANCELLED') return (
    <div style={{ display:'flex', alignItems:'center', gap:8,
      fontSize:13, color:'#e63946', background:'#fdecea',
      borderRadius:8, padding:'10px 14px', marginBottom:14 }}>
      ❌ Order was cancelled
    </div>
  );

  return (
    <div style={{ display:'flex', alignItems:'center', padding:'10px 0 16px', overflowX:'auto' }}>
      {steps.map((s, i) => {
        const done   = i < currIndex;
        const active = i === currIndex;
        const meta   = STATUS_META[s];
        return (
          <React.Fragment key={s}>
            <div style={{ display:'flex', flexDirection:'column', alignItems:'center', minWidth:68 }}>
              <div style={{
                width:36, height:36, borderRadius:'50%', display:'flex', alignItems:'center',
                justifyContent:'center', fontSize:15, fontWeight:700, flexShrink:0,
                background: active ? 'var(--green-main)' : done ? '#27ae60' : '#e8ede8',
                color: (active || done) ? '#fff' : '#aaa',
                border: active ? '3px solid #145c33' : '2px solid transparent',
                boxShadow: active ? '0 0 0 4px rgba(39,174,96,.18)' : 'none',
                transition: 'all .3s',
              }}>
                {done ? '✓' : meta.icon}
              </div>
              <span style={{ fontSize:10, marginTop:4, fontWeight: active ? 700 : 500,
                textAlign:'center', lineHeight:1.2,
                color: active ? 'var(--green-main)' : done ? '#27ae60' : '#aaa' }}>
                {meta.label}
              </span>
            </div>
            {i < steps.length - 1 && (
              <div style={{ flex:1, height:3, minWidth:10,
                background: i < currIndex ? '#27ae60' : '#e0e8e0',
                borderRadius:2, margin:'0 2px', marginBottom:18, transition:'background .3s' }} />
            )}
          </React.Fragment>
        );
      })}
    </div>
  );
}

export default function AdminOrders() {
  const [allOrders, setAllOrders] = useState([]);
  const [loading,   setLoading]   = useState(true);
  const [error,     setError]     = useState(null);
  const [filter,    setFilter]    = useState('ALL');
  const [search,    setSearch]    = useState('');
  const [detail,    setDetail]    = useState(null);
  const [notes,     setNotes]     = useState('');
  const [updating,  setUpdating]  = useState(false);

  const timerRef = useRef(null);

  /* ── Fetch all orders ───────────────────────────────── */
  const fetchOrders = async (silent = false) => {
    if (!silent) setLoading(true);
    setError(null);
    try {
      const data = await adminApi.getOrders();
      const list = Array.isArray(data) ? data : [];
      list.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      setAllOrders(list);
    } catch (err) {
      const status = err?.response?.status;
      if (status === 401)      setError('Session expired — please log out and log back in.');
      else if (status === 403) setError('Access denied — your account needs ADMIN role.');
      else if (status === 404) setError('Orders endpoint not found — is the backend running on port 8080?');
      else setError(err?.response?.data?.error || err?.message || 'Could not load orders. Is the backend running?');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
    timerRef.current = setInterval(() => fetchOrders(true), 30000);
    return () => clearInterval(timerRef.current);
  }, []);

  /* ── Client-side filter + search ───────────────────── */
  const filtered = allOrders.filter(o => {
    const matchStatus = filter === 'ALL' || o.status === filter;
    const q = search.trim().toLowerCase();
    const matchSearch = !q
      || o.orderNumber?.toLowerCase().includes(q)
      || o.user?.name?.toLowerCase().includes(q)
      || o.user?.phone?.includes(q);
    return matchStatus && matchSearch;
  });

  /* ── Update status ──────────────────────────────────── */
  const advanceStatus = async (order) => {
    const next = NEXT_STATUS[order.status];
    if (!next) return;
    setUpdating(true);
    try {
      const updated = await adminApi.updateStatus(order.id, next, notes);
      setDetail(updated);
      fetchOrders(true);
    } catch (err) {
      alert('Status update failed: ' + (err?.response?.data?.error || err?.message || 'Unknown error'));
    }
    setUpdating(false);
  };

  const cancelOrder = async (order) => {
    if (!window.confirm(`Cancel order ${order.orderNumber}? This cannot be undone.`)) return;
    setUpdating(true);
    try {
      const updated = await adminApi.updateStatus(order.id, 'CANCELLED', notes);
      setDetail(updated);
      fetchOrders(true);
    } catch (err) {
      alert('Cancel failed: ' + (err?.response?.data?.error || err?.message || 'Unknown error'));
    }
    setUpdating(false);
  };

  /* ── ✅ FIXED openDetail: tries API first, falls back to local data ── */
  const openDetail = async (id) => {
    // First try to find it locally (instant, no network call)
    const local = allOrders.find(o => o.id === id);
    if (local) {
      setDetail(local);
      setNotes(local.adminNotes || '');
    }
    // Then fetch fresh data from API in background
    try {
      const fresh = await adminApi.getOrder(id);
      if (fresh) {
        setDetail(fresh);
        setNotes(fresh.adminNotes || '');
      }
    } catch (err) {
      // If local data was already set, silently ignore the error
      if (!local) {
        alert('Could not load order: ' + (err?.response?.data?.error || err?.message || ''));
      }
    }
  };

  /* ── Stats ──────────────────────────────────────────── */
  const countFor  = s => s === 'ALL' ? allOrders.length : allOrders.filter(o => o.status === s).length;
  const pending   = allOrders.filter(o => o.status === 'PENDING').length;
  const outForDel = allOrders.filter(o => o.status === 'OUT_FOR_DELIVERY').length;
  const todayDel  = allOrders.filter(o => {
    if (o.status !== 'DELIVERED') return false;
    const d = new Date(o.createdAt), now = new Date();
    return d.toDateString() === now.toDateString();
  }).length;
  const totalDel  = allOrders.filter(o => o.status === 'DELIVERED').length;

  const statusColor = s => STATUS_META[s]?.color || 'badge-gray';

  return (
    <div className="admin-wrap">
      <aside className="admin-sidebar">
        <div className="sidebar-brand">🌸 Admin</div>
        <nav>
          <Link to="/admin"          className="sb-link">📊 Dashboard</Link>
          <Link to="/admin/products" className="sb-link">🌸 Products</Link>
          <Link to="/admin/orders"   className="sb-link active">📦 Orders</Link>
          <Link to="/"               className="sb-link">🏠 View Shop</Link>
        </nav>
        <div style={{ padding:'0 12px 16px' }}>
          <button className="sb-logout"
            onClick={() => {
              localStorage.removeItem('fs_token');
              localStorage.removeItem('fs_user');
              window.location.href = '/login';
            }}>
            🚪 Logout
          </button>
        </div>
      </aside>

      <main className="admin-main">
        {/* Top bar */}
        <div className="admin-topbar">
          <h1>📦 Orders</h1>
          <div style={{ display:'flex', alignItems:'center', gap:10 }}>
            <span style={{ fontSize:13, color:'var(--text-light)' }}>
              {filtered.length} of {allOrders.length} orders
            </span>
            <button className="btn btn-secondary btn-sm"
              onClick={() => fetchOrders()} disabled={loading}>
              {loading ? '⏳ Loading…' : '🔄 Refresh'}
            </button>
          </div>
        </div>

        {/* Stats */}
        <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:12, padding:'16px 28px 0' }}>
          {[
            { label:'Pending',          val:pending,  color:'#f9c74f', icon:'⏳' },
            { label:'Out for Delivery', val:outForDel,color:'#4895ef', icon:'🛵' },
            { label:'Delivered Today',  val:todayDel, color:'#27ae60', icon:'📦' },
            { label:'Total Delivered',  val:totalDel, color:'#1a5c30', icon:'✅' },
          ].map(s => (
            <div key={s.label} style={{ background:'#fff', borderRadius:12, padding:'14px 16px',
              borderTop:`4px solid ${s.color}`, boxShadow:'0 2px 8px rgba(0,0,0,.06)' }}>
              <div style={{ fontSize:22 }}>{s.icon}</div>
              <div style={{ fontSize:26, fontWeight:700, fontFamily:"'Playfair Display',serif" }}>{s.val}</div>
              <div style={{ fontSize:11, color:'var(--text-light)', marginTop:2 }}>{s.label}</div>
            </div>
          ))}
        </div>

        {/* Search */}
        <div style={{ padding:'12px 28px 0' }}>
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="🔍 Search by order number, customer name or phone…"
            style={{ width:'100%', padding:'10px 14px', borderRadius:8,
              border:'1.5px solid #e0e8e0', fontSize:14, outline:'none', boxSizing:'border-box' }}
          />
        </div>

        {/* Filter tabs */}
        <div className="filter-tabs">
          {STATUSES.map(s => (
            <button key={s}
              className={`filter-tab ${filter === s ? 'active' : ''}`}
              onClick={() => setFilter(s)}>
              {STATUS_META[s]?.icon || '•'} {s.replace(/_/g,' ')}
              <span style={{ marginLeft:5, fontSize:11, borderRadius:999, padding:'1px 6px', fontWeight:700,
                background: filter===s ? 'rgba(255,255,255,.3)' : '#e8f5e9',
                color: filter===s ? '#fff' : '#1a5c30' }}>
                {countFor(s)}
              </span>
            </button>
          ))}
        </div>

        {/* Content */}
        {loading ? (
          <div style={{ display:'flex', flexDirection:'column', alignItems:'center', padding:'60px 0', gap:12 }}>
            <div className="spinner" />
            <span style={{ fontSize:14, color:'var(--text-light)' }}>Loading orders…</span>
          </div>
        ) : error ? (
          <div style={{ background:'#fff0f0', border:'1px solid #ffcccc', borderRadius:8,
            padding:'20px 24px', margin:'24px 28px', color:'#c0392b' }}>
            <div style={{ fontWeight:700, marginBottom:6 }}>⚠️ Could not load orders</div>
            <div style={{ fontSize:14, marginBottom:12 }}>{error}</div>
            <button className="btn btn-primary btn-sm" onClick={() => fetchOrders()}>
              🔄 Try Again
            </button>
          </div>
        ) : filtered.length === 0 ? (
          <div style={{ textAlign:'center', padding:'48px 28px', color:'var(--text-light)' }}>
            <div style={{ fontSize:40, marginBottom:12 }}>📭</div>
            <div style={{ fontWeight:600, marginBottom:6 }}>
              {allOrders.length === 0 ? 'No orders yet' : `No ${filter !== 'ALL' ? filter.replace(/_/g,' ') : ''} orders found`}
            </div>
            {search && (
              <button className="btn btn-secondary btn-sm" style={{ marginTop:8 }}
                onClick={() => setSearch('')}>Clear search</button>
            )}
          </div>
        ) : (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Order</th><th>Customer</th><th>Items</th>
                  <th>Total</th><th>Payment</th><th>Distance</th>
                  <th>Date & Time</th><th>Status</th><th>Action</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(o => (
                  <tr key={o.id} style={{ background: o.status==='PENDING' ? '#fffdf0' : '' }}>
                    <td style={{ fontWeight:600, fontSize:13 }}>{o.orderNumber}</td>
                    <td>
                      <div style={{ fontWeight:500 }}>{o.user?.name}</div>
                      <div style={{ fontSize:12, color:'var(--text-light)' }}>{o.user?.phone}</div>
                    </td>
                    <td>{o.items?.length || 0} item{o.items?.length !== 1 ? 's' : ''}</td>
                    <td style={{ fontWeight:700 }}>₹{o.totalAmount}</td>
                    <td>
                      <span style={{ fontSize:12, fontWeight:600,
                        color: o.paymentMethod==='ONLINE' ? '#6c3fff' : '#1a5c30' }}>
                        {o.paymentMethod==='ONLINE' ? '💳 Online' : '💵 COD'}
                      </span>
                    </td>
                    <td>{Number(o.deliveryDistanceKm || 0).toFixed(1)} km</td>
                    <td style={{ fontSize:12 }}>
                      <div>{new Date(o.createdAt).toLocaleDateString('en-IN')}</div>
                      <div style={{ color:'var(--text-light)' }}>
                        {new Date(o.createdAt).toLocaleTimeString('en-IN',{hour:'2-digit',minute:'2-digit'})}
                      </div>
                    </td>
                    <td>
                      <span className={`badge ${statusColor(o.status)}`}>
                        {STATUS_META[o.status]?.icon} {o.status.replace(/_/g,' ')}
                      </span>
                    </td>
                    <td>
                      <button className="btn btn-primary btn-sm" onClick={() => openDetail(o.id)}>
                        Manage →
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </main>

      {/* ── Order Detail Modal ── */}
      {detail && (
        <div className="modal-backdrop" onClick={() => setDetail(null)}>
          <div className="modal-box" style={{ maxWidth:600 }} onClick={e => e.stopPropagation()}>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:6 }}>
              <h2 style={{ fontSize:18 }}>{detail.orderNumber}</h2>
              <button onClick={() => setDetail(null)}
                style={{ background:'none', border:'none', fontSize:22, cursor:'pointer', color:'#888', lineHeight:1 }}>
                ✕
              </button>
            </div>

            <StatusTimeline status={detail.status} />

            <div style={{ background:'var(--green-pale)', borderRadius:'var(--radius)',
              padding:'12px 16px', marginBottom:14 }}>
              <div style={{ fontWeight:600, fontSize:15 }}>{detail.user?.name}</div>
              <div style={{ fontSize:13, color:'var(--text-mid)', marginTop:2 }}>📞 {detail.user?.phone}</div>
              <div style={{ fontSize:13, color:'var(--text-mid)', marginTop:4 }}>📍 {detail.deliveryAddress}</div>
              <div style={{ display:'flex', gap:16, marginTop:6, fontSize:13, flexWrap:'wrap' }}>
                <span>📏 {Number(detail.deliveryDistanceKm || 0).toFixed(1)} km away</span>
                <span style={{ fontWeight:600, color: detail.paymentMethod==='ONLINE'?'#6c3fff':'#1a5c30' }}>
                  {detail.paymentMethod==='ONLINE' ? '💳 Online Payment' : '💵 Cash on Delivery'}
                </span>
              </div>
            </div>

            <div style={{ marginBottom:12 }}>
              <div style={{ fontWeight:600, fontSize:12, color:'var(--text-light)', marginBottom:6, letterSpacing:.5 }}>
                ORDER ITEMS
              </div>
              {detail.items?.map((item, i) => (
                <div key={i} style={{ display:'flex', justifyContent:'space-between',
                  padding:'7px 0', borderBottom:'1px solid #f0f0f0', fontSize:14 }}>
                  <span>{item.productName} × {item.quantity} {item.unit}</span>
                  <span style={{ fontWeight:600 }}>₹{item.lineTotal}</span>
                </div>
              ))}
            </div>

            <div style={{ background:'#f9fdf9', borderRadius:8, padding:'12px 14px', marginBottom:14 }}>
              <div style={{ display:'flex', justifyContent:'space-between', fontSize:14, marginBottom:4 }}>
                <span>Subtotal</span><span>₹{detail.subtotal}</span>
              </div>
              <div style={{ display:'flex', justifyContent:'space-between', fontSize:14, marginBottom:6 }}>
                <span>Delivery</span>
                <span>{detail.deliveryCharge == 0 ? '🎉 FREE' : `₹${detail.deliveryCharge}`}</span>
              </div>
              <div style={{ display:'flex', justifyContent:'space-between', fontSize:18, fontWeight:700,
                borderTop:'1px solid #e0e0e0', paddingTop:8 }}>
                <span>Total</span><span>₹{detail.totalAmount}</span>
              </div>
            </div>

            {detail.status === 'DELIVERED' && (
              <div style={{ background:'#e9f7ef', border:'1.5px solid #27ae60', borderRadius:8,
                padding:'10px 14px', marginBottom:14, fontSize:14, color:'#1a5c30', fontWeight:600 }}>
                ✅ Delivery Successful!
                {detail.adminNotes && <div style={{ fontWeight:400, marginTop:4, fontSize:13 }}>{detail.adminNotes}</div>}
              </div>
            )}
            {detail.status === 'CANCELLED' && (
              <div style={{ background:'#fdecea', border:'1.5px solid #e74c3c', borderRadius:8,
                padding:'10px 14px', marginBottom:14, fontSize:14, color:'#922b21', fontWeight:600 }}>
                ❌ Order was cancelled.
                {detail.adminNotes && <div style={{ fontWeight:400, marginTop:4, fontSize:13 }}>{detail.adminNotes}</div>}
              </div>
            )}

            {detail.status !== 'DELIVERED' && detail.status !== 'CANCELLED' && (
              <div className="form-group" style={{ marginBottom:14 }}>
                <label>Admin Notes <span style={{ fontWeight:400, color:'var(--text-light)' }}>(optional)</span></label>
                <textarea value={notes} onChange={e => setNotes(e.target.value)}
                  placeholder="e.g. Called customer, out for delivery by 5pm…"
                  rows={2} style={{ resize:'vertical' }} />
              </div>
            )}

            <div style={{ display:'flex', gap:8, flexWrap:'wrap' }}>
              {NEXT_STATUS[detail.status] && (
                <button className="btn btn-primary" style={{ flex:1 }}
                  onClick={() => advanceStatus(detail)} disabled={updating}>
                  {updating ? '⏳ Updating…' : NEXT_LABEL[detail.status]}
                </button>
              )}
              {detail.status !== 'DELIVERED' && detail.status !== 'CANCELLED' && (
                <button className="btn btn-danger btn-sm" onClick={() => cancelOrder(detail)}>
                  ✕ Cancel
                </button>
              )}
              <button className="btn btn-secondary btn-sm" onClick={() => setDetail(null)}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}