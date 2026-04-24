import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';

export default function LoginPage() {
  const { login, isLoggedIn } = useAuth();
  const navigate              = useNavigate();
  const [form, setForm]       = useState({ email:'', password:'' });
  const [error, setError]     = useState('');
  const [loading, setLoading] = useState(false);

  // Already logged in → redirect away
  if (isLoggedIn) { navigate('/'); return null; }

  const ch = e => setForm(f => ({ ...f, [e.target.name]: e.target.value }));

  const submit = async (e) => {
    e.preventDefault();
    setError(''); setLoading(true);
    try {
      const res = await api.login(form);
      login({ id: res.id, name: res.name, email: res.email, role: res.role }, res.token);
      navigate(res.role === 'ADMIN' ? '/admin' : '/');
    } catch (err) {
      setError(err.response?.data?.error || 'Login failed. Check your email and password.');
    }
    setLoading(false);
  };

  return (
    <div className="page-wrapper" style={{ maxWidth:420, margin:'40px auto' }}>
      <div className="card" style={{ padding:32 }}>
        <h1 style={{ textAlign:'center', marginBottom:8 }}>🌸 Welcome Back</h1>
        <p style={{ textAlign:'center', color:'var(--text-light)', marginBottom:24, fontSize:14 }}>
          Login to place and track orders
        </p>

        {error && <div className="alert alert-error">⚠️ {error}</div>}

        <form onSubmit={submit}>
          <div className="form-group">
            <label>Email</label>
            <input name="email" type="email" value={form.email}
              onChange={ch} placeholder="your@email.com" required />
          </div>
          <div className="form-group">
            <label>Password</label>
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