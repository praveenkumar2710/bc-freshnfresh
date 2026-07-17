import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';

export default function LoginPage() {
  const { login, isLoggedIn, isAdmin } = useAuth();
  const navigate              = useNavigate();
  const location              = useLocation();

  // Success message from register page
  const successMsg = location.state?.message || '';

  const [form, setForm]       = useState({ email: '', password: '' });
  const [error, setError]     = useState('');
  const [loading, setLoading] = useState(false);
  const [slowMsg, setSlowMsg] = useState('');

  if (isLoggedIn) { navigate(isAdmin ? '/admin' : '/'); return null; }

  const ch = e => setForm(f => ({ ...f, [e.target.name]: e.target.value }));

  const submit = async (e) => {
    e.preventDefault();
    setError(''); setLoading(true); setSlowMsg('');

    const slowTimer = setTimeout(() => {
      setSlowMsg('⏳ Server is waking up, please wait a moment…');
    }, 4000);

    const verySlowTimer = setTimeout(() => {
      setSlowMsg('🌸 Almost there! Server takes up to 60 seconds on first load. Thank you for your patience!');
    }, 15000);

    try {
      const res = await api.login(form);
      clearTimeout(slowTimer);
      clearTimeout(verySlowTimer);
      login(
        { id: res.id, name: res.name, email: res.email, role: res.role },
        res.token
      );
      navigate(res.role === 'ADMIN' ? '/admin' : '/');
    } catch (err) {
      clearTimeout(slowTimer);
      clearTimeout(verySlowTimer);
      setError(err.response?.data?.error || 'Invalid email or password. Please try again.');
    }

    setLoading(false);
    setSlowMsg('');
  };

  return (
    <div className="page-wrapper" style={{ maxWidth: 420, margin: '40px auto' }}>
      <div className="card" style={{ padding: 32 }}>

        <div style={{ textAlign: 'center', marginBottom: 24 }}>
          <div style={{ fontSize: 36 }}>🌸</div>
          <h1 style={{ margin: '8px 0 4px', fontSize: 22 }}>Welcome Back</h1>
          <p style={{ color: 'var(--text-light)', fontSize: 14, margin: 0 }}>
            Login to place and track orders
          </p>
        </div>

        {/* Success message from registration */}
        {successMsg && (
          <div style={{
            background: '#d4edda', border: '1px solid #c3e6cb',
            borderRadius: 10, padding: '12px 16px', marginBottom: 16,
            color: '#155724', fontSize: 14
          }}>
            {successMsg}
          </div>
        )}

        {error && (
          <div className="alert alert-error" style={{ marginBottom: 16 }}>
            ⚠️ {error}
          </div>
        )}

        {slowMsg && (
          <div style={{
            background: '#fff8e1', border: '1px solid #ffe082',
            borderRadius: 10, padding: '12px 16px', marginBottom: 16,
            fontSize: 13, color: '#7c6000', textAlign: 'center', lineHeight: 1.5
          }}>
            {slowMsg}
          </div>
        )}

        <form onSubmit={submit}>
          <div className="form-group">
            <label>Email Address</label>
            <input
              name="email" type="email" value={form.email}
              onChange={ch} placeholder="your@email.com" required
            />
          </div>
          <div className="form-group" style={{ marginBottom: 20 }}>
            <label>Password</label>
            <input
              name="password" type="password" value={form.password}
              onChange={ch} placeholder="Your password" required
            />
          </div>
          <button
            type="submit"
            className="btn btn-primary btn-lg btn-full"
            disabled={loading}
          >
            {loading ? '⏳ Logging in…' : '🔑 Login'}
          </button>
        </form>

        <p style={{ textAlign: 'center', marginTop: 18, fontSize: 14, color: 'var(--text-mid)' }}>
          Don't have an account?{' '}
          <Link to="/register" style={{ color: 'var(--green-main)', fontWeight: 600 }}>
            Register here
          </Link>
        </p>

      </div>
    </div>
  );
}