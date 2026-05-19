import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';

export default function LoginPage() {
  const { login, isLoggedIn } = useAuth();
  const navigate              = useNavigate();
  const [form, setForm]       = useState({ email:'', password:'' });
  const [error, setError]     = useState('');
  const [loading, setLoading] = useState(false);
  const [slowMsg, setSlowMsg] = useState('');

  // Already logged in → redirect away
  if (isLoggedIn) { navigate('/'); return null; }

  const ch = e => setForm(f => ({ ...f, [e.target.name]: e.target.value }));

  const submit = async (e) => {
    e.preventDefault();
    setError(''); setLoading(true); setSlowMsg('');

    // After 4 seconds show friendly cold-start message
    const slowTimer = setTimeout(() => {
      setSlowMsg('⏳ Server is waking up, please wait a moment…');
    }, 4000);

    // After 15 seconds show longer wait message
    const verySlowTimer = setTimeout(() => {
      setSlowMsg('🌸 Almost there! Server takes up to 60 seconds on first load. Thank you for your patience!');
    }, 15000);

    try {
      const res = await api.login(form);
      clearTimeout(slowTimer);
      clearTimeout(verySlowTimer);
      login({ id: res.id, name: res.name, email: res.email, role: res.role }, res.token);
      navigate(res.role === 'ADMIN' ? '/admin' : '/');
    } catch (err) {
      clearTimeout(slowTimer);
      clearTimeout(verySlowTimer);
      setError(err.response?.data?.error || 'Login failed. Check your email and password.');
    }
    setLoading(false);
    setSlowMsg('');
  };

  return (
    <div className="page-wrapper" style={{ maxWidth:420, margin:'40px auto' }}>
      <div className="card" style={{ padding:32 }}>
        <h1 style={{ textAlign:'center', marginBottom:8 }}>🌸 Welcome Back</h1>
        <p style={{ textAlign:'center', color:'var(--text-light)', marginBottom:24, fontSize:14 }}>
          Login to place and track orders
        </p>

        {error && <div className="alert alert-error">⚠️ {error}</div>}

        {/* Cold start message */}
        {slowMsg && (
          <div style={{
            background: '#fff8e1',
            border: '1px solid #ffe082',
            borderRadius: 10,
            padding: '12px 16px',
            marginBottom: 16,
            fontSize: 13,
            color: '#7c6000',
            textAlign: 'center',
            lineHeight: 1.5
          }}>
            {slowMsg}
          </div>
        )}

        <form onSubmit={submit}>
          <div className="form-group">
            <label>EMAIL</label>
            <input name="email" type="email" value={form.email}
              onChange={ch} placeholder="your@email.com" required />
          </div>
          <div className="form-group">
            <label>PASSWORD</label>
            <input name="password" type="password" value={form.password}
              onChange={ch} placeholder="Your password" required />
          </div>
          <button type="submit" className="btn btn-primary btn-lg btn-full" disabled={loading}>
            {loading ? '⏳ Logging in…' : '🔑 Login'}
          </button>
        </form>

        <p style={{ textAlign:'center', marginTop:18, fontSize:14, color:'var(--text-mid)' }}>
          Don't have an account?{' '}
          <Link to="/register" style={{ color:'var(--green-main)', fontWeight:600 }}>Register here</Link>
        </p>
      </div>
    </div>
  );
}