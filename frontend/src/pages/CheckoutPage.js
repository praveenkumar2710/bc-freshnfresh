import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { api }     from '../services/api';
import './CheckoutPage.css';

function normalizeDelivery(raw, subtotal) {
  const deliveryCharge = Number(raw.deliveryCharge ?? raw.charge ?? 0);
  const minOrder       = Number(raw.minOrder ?? 0);
  const meetsMinOrder  = minOrder === 0 || Number(subtotal) >= minOrder;
  return { ...raw, deliveryCharge, minOrder, meetsMinOrder };
}

export default function CheckoutPage() {
  const { cart, subtotal, clearCart } = useCart();
  const { user, isLoggedIn }          = useAuth();
  const navigate                      = useNavigate();

  const [form, setForm]           = useState({ name:'', phone:'', address:'' });
  const [delivery, setDelivery]   = useState(null);
  const [loc, setLoc]             = useState(null);
  const [locMsg, setLocMsg]       = useState('');
  const [locLoad, setLocLoad]     = useState(false);
  const [placing, setPlacing]     = useState(false);
  const [error, setError]         = useState('');
  const [step, setStep]           = useState(1);

  useEffect(() => { if (cart.length === 0) navigate('/cart'); }, [cart, navigate]);

  useEffect(() => {
    if (user) setForm({ name: user.name||'', phone: user.phone||'', address: user.address||'' });
  }, [user]);

  const ch = e => setForm(f => ({ ...f, [e.target.name]: e.target.value }));

  /* ── GPS ─────────────────────────────────────────────── */
  const detectGPS = useCallback(() => {
    setLocLoad(true); setLocMsg(''); setDelivery(null);
    if (!navigator.geolocation) {
      setLocMsg('GPS not supported on this device.');
      setLocLoad(false); return;
    }
    navigator.geolocation.getCurrentPosition(
      async pos => {
        const { latitude: lat, longitude: lon } = pos.coords;
        setLoc({ lat, lon });
        try {
          const raw  = await api.checkDelivery(lat, lon, subtotal);
          const info = normalizeDelivery(raw, subtotal);
          setDelivery(info);
          if (info.canDeliver) setStep(3);
        } catch { setLocMsg('Cannot reach server. Please try again.'); }
        setLocLoad(false);
      },
      err => {
        const msgs = {
          1: 'Location access denied. Please allow location and try again.',
          2: 'Location unavailable. Please try again.',
          3: 'Location timed out. Try again.'
        };
        setLocMsg(msgs[err.code] || 'Location error. Please try again.');
        setLocLoad(false);
      },
      { timeout: 10000 }
    );
  }, [subtotal]);

  /* ── Validation ─────────────────────────────────────── */
  const validate = () => {
    if (!form.name.trim())   { setError('Please enter your name'); return false; }
    if (!/^[6-9]\d{9}$/.test(form.phone.trim())) {
      setError('Please enter a valid 10-digit mobile number'); return false; }
    if (!form.address.trim()) { setError('Please enter your delivery address'); return false; }
    if (!loc)                 { setError('Please detect your location first'); return false; }
    if (!delivery?.canDeliver){ setError('Sorry, delivery not available to your area'); return false; }
    if (!delivery?.meetsMinOrder) {
      const need = Math.max(0, (delivery.minOrder || 0) - subtotal);
      setError(`Minimum order ₹${delivery.minOrder} required. Add ₹${need.toFixed(0)} more.`);
      return false;
    }
    if (!isLoggedIn) { navigate('/login'); return false; }
    setError(''); return true;
  };

  /* ── Place Order (COD only) ─────────────────────────── */
  const placeOrder = async () => {
    if (!validate()) return;
    setPlacing(true);
    try {
      const res = await api.placeOrder({
        address: form.address.trim(),
        customerName: form.name.trim(),
        customerPhone: form.phone.trim(),
        customerLat: loc.lat,
        customerLon: loc.lon,
        paymentMethod: 'COD',
        items: cart.map(i => ({ productId: Number(i.productId), quantity: i.quantity }))
      });
      if (res.success) { clearCart(); navigate(`/order/confirmation/${res.orderId}`); }
      else setError(res.error || 'Order failed. Please try again.');
    } catch (e) {
      setError(e.response?.data?.error || 'Order failed. Please try again.');
    }
    setPlacing(false);
  };

  /* ── Derived values ─────────────────────────────────── */
  const deliveryCharge = delivery?.deliveryCharge ?? null;
  const total          = deliveryCharge !== null ? subtotal + deliveryCharge : subtotal;
  const locationReady  = !!delivery && delivery.canDeliver === true && delivery.meetsMinOrder === true;
  const canPlaceOrder  = locationReady && step >= 3;

  const getHint = () => {
    if (step < 2)  return { color:'var(--text-light)', msg:'↑ Fill in your details first' };
    if (!delivery) return { color:'var(--text-light)', msg:'↑ Detect your location to continue' };
    if (!delivery.canDeliver) return { color:'#e63946', msg:'❌ Delivery not available to your area' };
    if (!delivery.meetsMinOrder) {
      const need = Math.max(0, (delivery.minOrder||0) - subtotal);
      return { color:'#e63946', msg:`⚠ Add ₹${need.toFixed(0)} more to reach minimum order of ₹${delivery.minOrder}` };
    }
    if (step < 3) return { color:'var(--text-light)', msg:'↑ Review your order above' };
    return null;
  };
  const hint = getHint();

  return (
    <div className="page-wrapper">
      <div className="co-header">
        <h1>Checkout</h1>
        <p>Complete your details and place your order</p>
      </div>

      {/* Steps */}
      <div className="co-steps">
        {[{n:1,label:'Your Details'},{n:2,label:'Delivery'},{n:3,label:'Confirm'}].map((s,idx) => (
          <React.Fragment key={s.n}>
            <div className={`co-step ${step >= s.n ? 'active' : ''}`}
              onClick={() => step > s.n && setStep(s.n)}
              style={{ cursor: step > s.n ? 'pointer' : 'default' }}>
              <div className="co-step-num">{step > s.n ? '✓' : s.n}</div>
              {s.label}
            </div>
            {idx < 2 && <div className={`co-step-line ${step > s.n ? 'done' : ''}`} />}
          </React.Fragment>
        ))}\
      </div>

      {!isLoggedIn && (
        <div className="alert alert-info" style={{ marginBottom:20 }}>
          💡 <a href="/login" style={{ fontWeight:700, color:'var(--green-dark)' }}>Login</a> or{' '}
          <a href="/register" style={{ fontWeight:700, color:'var(--green-dark)' }}>Register</a> before placing your order
        </div>
      )}

      <div className="co-layout">
        <div className="co-left">

          {/* Step 1 — Details */}
          <div className="co-card">
            <div className="co-card-header">
              <div className={`co-card-icon ${step >= 1 ? 'active' : ''}`}>1</div>
              <h2>Your Details</h2>
            </div>
            <div className="co-card-body">
              <div className="form-group">
                <label>Full Name *</label>
                <input name="name" value={form.name} onChange={ch} placeholder="Your full name" />
              </div>
              <div className="form-group">
                <label>Mobile Number *</label>
                <input name="phone" value={form.phone} onChange={ch}
                  placeholder="10-digit mobile" maxLength={10} inputMode="numeric" />
              </div>
              <div className="form-group" style={{ marginBottom:0 }}>
                <label>Delivery Address *</label>
                <textarea name="address" value={form.address} onChange={ch}
                  placeholder="House no, street, area, landmark…" rows={3} style={{ resize:'vertical' }} />
              </div>
              <button className="btn btn-primary btn-sm" style={{ marginTop:12 }}
                onClick={() => {
                  if (!form.name.trim()) { setError('Please enter your name'); return; }
                  if (!/^[6-9]\d{9}$/.test(form.phone.trim())) { setError('Enter valid 10-digit mobile number'); return; }
                  if (!form.address.trim()) { setError('Please enter delivery address'); return; }
                  setError(''); setStep(2);
                }}>
                Continue to Location →
              </button>
            </div>
          </div>

          {/* Step 2 — GPS */}
          <div className={`co-card ${step < 2 ? 'co-card-disabled' : ''}`}>
            <div className="co-card-header">
              <div className={`co-card-icon ${step >= 2 ? 'active' : ''}`}>2</div>
              <h2>Delivery Location</h2>
            </div>
            {step >= 2 && (
              <div className="co-card-body">
                <p className="co-hint">
                  📦 We deliver within <strong>12 km</strong>. Share your GPS to calculate delivery charge.
                </p>
                <div className="loc-actions">
                  <button className="btn btn-primary" onClick={detectGPS} disabled={locLoad}>
                    {locLoad ? '⏳ Detecting…' : '📡 Detect My GPS Location'}
                  </button>
                </div>
                {locMsg && <div className="alert alert-error" style={{ marginTop:14 }}>{locMsg}</div>}
                {delivery && (
                  <div className={`delivery-box ${delivery.canDeliver ? (delivery.meetsMinOrder ? 'can-deliver':'min-warn') : 'no-deliver'}`}>
                    <span className="d-icon">
                      {delivery.canDeliver ? (delivery.meetsMinOrder ? '✅':'⚠️') : '❌'}
                    </span>
                    <div>
                      <strong>{delivery.canDeliver ? delivery.message : 'Outside delivery zone'}</strong>
                      {delivery.canDeliver && (
                        <p>Distance: <strong>{Number(delivery.distanceKm).toFixed(1)} km</strong> · Zone: <strong>{delivery.zone}</strong></p>
                      )}
                      {!delivery.canDeliver && <p>{delivery.message}</p>}
                      {delivery.canDeliver && !delivery.meetsMinOrder && (
                        <p className="min-alert">⚠ Minimum order ₹{delivery.minOrder} needed for this zone</p>
                      )}
                      <span className={`charge-highlight ${deliveryCharge===0 ? 'free':''}`}>
                        {deliveryCharge===0 ? '🎉 Free Delivery!' : `🚚 Delivery Charge: ₹${deliveryCharge}`}
                      </span>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Step 3 — Confirm */}
          <div className={`co-card ${step < 3 ? 'co-card-disabled' : ''}`}>
            <div className="co-card-header">
              <div className={`co-card-icon ${step >= 3 ? 'active' : ''}`}>3</div>
              <h2>Confirm Order</h2>
            </div>
            {step >= 3 && (
              <div className="co-card-body">
                <div className="payment-options">
                  <div className="pay-option selected">
                    <div className="pay-icon">💵</div>
                    <div className="pay-info">
                      <strong>Cash on Delivery</strong>
                      <span>Pay cash when your order arrives at your door</span>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

        </div>

        {/* ── Right Summary ── */}
        <div className="co-summary">
          <div className="co-summary-header"><h2>🧾 Order Summary</h2></div>
          <div className="co-summary-body">

            <div className="sum-items">
              {cart.map(i => (
                <div key={i.productId} className="sum-item">
                  <span className="sum-item-name">{i.productName} × {i.quantity}</span>
                  <span className="sum-item-price">₹{(i.price * i.quantity).toFixed(0)}</span>
                </div>
              ))}
            </div>

            <hr className="sum-divider" />

            <div className="sum-row">
              <span>Subtotal</span>
              <strong>₹{subtotal.toFixed(0)}</strong>
            </div>
            <div className="sum-row">
              <span>Delivery Charge</span>
              {deliveryCharge === null
                ? <span className="delivery-pending">📍 Detect location</span>
                : deliveryCharge === 0
                ? <span className="delivery-free">🎉 FREE</span>
                : <span className="delivery-amount">₹{deliveryCharge}</span>}
            </div>
            <div className="sum-total-row">
              <span className="sum-total-label">Total</span>
              <span className="sum-total-amount">₹{total.toFixed(0)}</span>
            </div>

            <div className="cod-badge">💵 Cash on Delivery</div>

            {error && (
              <div className="alert alert-error" style={{ marginBottom:12 }}>⚠️ {error}</div>
            )}

            <button
              className="btn btn-primary btn-lg btn-full place-order-btn"
              onClick={placeOrder}
              disabled={placing || !canPlaceOrder}
            >
              {placing ? '⏳ Processing…' : `✅ Place Order — ₹${total.toFixed(0)}`}
            </button>

            {hint && (
              <p style={{ fontSize:12, color: hint.color, textAlign:'center', marginTop:8 }}>
                {hint.msg}
              </p>
            )}

            <p style={{ fontSize:12, color:'var(--text-light)', textAlign:'center', marginTop:10 }}>
              🔒 Secure checkout · Same-day delivery within 12 km
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}