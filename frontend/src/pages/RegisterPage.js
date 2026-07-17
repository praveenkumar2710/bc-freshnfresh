import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';

export default function RegisterPage() {
  const { isLoggedIn }        = useAuth();
  const navigate              = useNavigate();
  const [form, setForm]       = useState({ name:'', email:'', password:'', phone:'', address:'' });
  const [error, setError]     = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  // Already logged in → redirect away
  if (isLoggedIn) { navigate('/'); return null; }

  const ch = e => setForm(f => ({ ...f, [e.target.name]: e.target.value }));

  const submit = async (e) => {
    e.preventDefault();
    setError(''); setLoading(true);

    if (!form.email.trim() || !form.password.trim()) {
      setError('Email and password are required.');
      setLoading(false); return;
    }

    try {
      await api.register(form);

      // ✅ Show success message — user must login manually
      setSuccess(true);

    } catch (err) {
      const msg = err.response?.data?.error || 'Registration failed. Please try again.';

      if (msg.toLowerCase().includes('already') || msg.toLowerCase().includes('registered')) {
        setError(
          <span>
            ⚠️ This email is already registered.{' '}
            <Link to="/login" style={{ color:'var(--green-main)', fontWeight:700 }}>
              Login here →
            </Link>
          </span>
        );
      } else {
        setError(msg);
      }
    }
    setLoading(false);
  };

  // ── Success Screen ────────────────────────────────────────
  if (success) {
    return (
      <div className="page-wrapper" style={{ maxWidth:460, margin:'40px auto' }}>
        <div className="card" style={{ padding:40, textAlign:'center' }}>
          <div style={{ fontSize:56, marginBottom:12 }}>🎉</div>
          <h2 style={{ color:'#1a8c4e', margin:'0 0 8px' }}>Account Created!</h2>
          <p style={{ color:'var(--text-mid)', fontSize:14, margin:'0 0 8px' }}>
            Welcome to <strong>BC Fresh n Fresh</strong>!
          </p>
          <p style={{ color:'var(--text-light)', fontSize:13, margin:'0 0 28px' }}>
            Your account has been created successfully.<br />
            Please login to start ordering fresh flowers.
          </p>
          <Link to="/login" className="btn btn-primary btn-lg btn-full">
            🔑 Login Now →
          </Link>
          <p style={{ color:'var(--text-light)', fontSize:12, marginTop:14 }}>
            Registered as: <strong>{form.email}</strong>
          </p>
        </div>
      </div>
    );
  }

  // ── Register Form ─────────────────────────────────────────
  return (
    <div className="page-wrapper" style={{ maxWidth:460, margin:'40px auto' }}>
      <div className="card" style={{ padding:32 }}>
        <h1 style={{ textAlign:'center', marginBottom:8 }}>🌸 Create Account</h1>
        <p style={{ textAlign:'center', color:'var(--text-light)', marginBottom:24, fontSize:14 }}>
          Register to order fresh flowers delivered to you
        </p>

        {error && (
          <div className="alert alert-error">{error}</div>
        )}

        <form onSubmit={submit}>
          <div className="form-group">
            <label>Full Name *</label>
            <input name="name" value={form.name} onChange={ch}
              placeholder="Your full name" required />
          </div>
          <div className="form-group">
            <label>Email *</label>
            <input name="email" type="email" value={form.email} onChange={ch}
              placeholder="your@email.com" required />
          </div>
          <div className="form-group">
            <label>Password *
              <small style={{ color:'var(--text-light)', fontWeight:400 }}> (min 6 characters)</small>
            </label>
            <input name="password" type="password" value={form.password} onChange={ch}
              placeholder="Create a password" required minLength={6} />
          </div>
          <div className="form-group">
            <label>Mobile Number</label>
            <input name="phone" value={form.phone} onChange={ch}
              placeholder="10-digit mobile" maxLength={10} inputMode="numeric" />
          </div>
          <div className="form-group">
            <label>Address
              <small style={{ color:'var(--text-light)', fontWeight:400 }}> (optional)</small>
            </label>
            <textarea name="address" value={form.address} onChange={ch}
              placeholder="House no, street, area…" rows={2} style={{ resize:'vertical' }} />
          </div>

          <button type="submit" className="btn btn-primary btn-lg btn-full" disabled={loading}>
            {loading ? '⏳ Creating account…' : '✅ Create Account'}
          </button>
        </form>

        <p style={{ textAlign:'center', marginTop:18, fontSize:14, color:'var(--text-mid)' }}>
          Already have an account?{' '}
          <Link to="/login" style={{ color:'var(--green-main)', fontWeight:600 }}>Login here</Link>
        </p>
      </div>
    </div>
  );
}