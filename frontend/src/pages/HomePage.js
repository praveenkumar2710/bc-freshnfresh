import React, { useEffect, useState, useCallback } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { api, getImageUrl } from '../services/api';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { logoB64 } from '../logoB64';
import './HomePage.css';

const CATEGORIES = [
  { name: 'All',              emoji: '🌸' },
  { name: 'Bouquets',         emoji: '💐' },
  { name: 'Garlands',         emoji: '🌼' },
  { name: 'Pooja Flowers',    emoji: '🪷' },
  { name: 'Sacred Leaves',    emoji: '🍃' },
  { name: 'Pooja Essentials', emoji: '🥥' },
];

const POPULAR_SEARCHES = [
  { label: 'Jasmine Gajra',   emoji: '⚪' }, { label: 'Pooja Flowers', emoji: '🌸' },
  { label: 'Rose Bouquet',    emoji: '🌹' }, { label: 'Flower Bookay', emoji: '💐' },
  { label: 'Wedding Garland', emoji: '💒' }, { label: 'Jasmine Garland', emoji: '🤍' },
  { label: 'Lotus',           emoji: '🪷' }, { label: 'Marigold',      emoji: '🟡' },
  { label: 'Banana Leaves',   emoji: '🍌' }, { label: 'Betel Leaves',  emoji: '🍃' },
  { label: 'Loose Tulsi',     emoji: '🌿' }, { label: 'Chrysanthemum', emoji: '🌼' },
  { label: 'Neem Leaves',     emoji: '🌿' }, { label: 'Coconut Flower', emoji: '🌴' },
  { label: 'Mango Leaves',    emoji: '🍃' }, { label: 'Paneer Rose',   emoji: '🌸' },
  { label: 'Pink Lotus',      emoji: '🪷' }, { label: 'Bridal Flowers', emoji: '👰' },
];

// Product image — shows real photo if available, else emoji fallback
function ProductImage({ product }) {
  const [imgErr, setImgErr] = useState(false);
  if (getImageUrl(product.imageUrl) && !imgErr) {
    return (
      <img
        src={getImageUrl(product.imageUrl)}
        alt={product.name}
        className="pcard-img"
        onError={() => setImgErr(true)}
      />
    );
  }
  return (
    <span className="pcard-emoji">{product.imageEmoji || '🌸'}</span>
  );
}

function ProductCard({ product }) {
  const { addToCart } = useCart();
  const { isAdmin } = useAuth();
  const [qty, setQty] = useState(1);
  const [flash, setFlash] = useState(false);

  const handleAdd = () => {
    addToCart(product, qty);
    setFlash(true);
    setTimeout(() => setFlash(false), 1400);
  };

  return (
    <div className="pcard">
      <div className="pcard-img-wrap">
        <ProductImage product={product} />
        {product.category && <span className="pcard-cat-tag">{product.category}</span>}
      </div>
      <div className="pcard-body">
        <div className="pcard-name">{product.name}</div>
        {product.description && <p className="pcard-desc">{product.description}</p>}

        {/* Price is hidden until checkout (GPS will calculate delivery) */}
        <div className="pcard-price-row">
          <span className="price-val">₹{product.price}</span>
          <span className="price-unit">per {product.unit}</span>
        </div>
        <div className="pcard-delivery-note">
          🚚 Delivery charge at checkout
        </div>

        {product.stock > 10
          ? <span className="badge badge-green">✓ In Stock</span>
          : product.stock > 0
          ? <span className="badge badge-orange">Only {product.stock} left</span>
          : <span className="badge badge-red">Out of Stock</span>}
      </div>

      {/* Admin cannot buy — show manage link instead */}
      {isAdmin ? (
        <div className="pcard-actions">
          <Link to="/admin/products" className="btn btn-secondary btn-full" style={{ fontSize:13 }}>
            ⚙ Manage in Admin
          </Link>
        </div>
      ) : product.stock > 0 ? (
        <div className="pcard-actions">
          <div className="qty-ctrl">
            <button onClick={() => setQty(q => Math.max(1, q - 1))}>−</button>
            <span>{qty}</span>
            <button onClick={() => setQty(q => q + 1)}>+</button>
          </div>
          <button className={`btn btn-primary btn-full ${flash ? 'flash' : ''}`} onClick={handleAdd}>
            {flash ? '✓ Added!' : '🛒 Add to Cart'}
          </button>
        </div>
      ) : null}
    </div>
  );
}

export default function HomePage() {
  const [searchParams] = useSearchParams();
  const [products,  setProducts]  = useState([]);
  const [loading,   setLoading]   = useState(true);
  const [search,    setSearch]    = useState(searchParams.get('search') || '');
  const [activeTab, setActiveTab] = useState(searchParams.get('category') || 'All');
  const [error,     setError]     = useState('');
  const { cartCount } = useCart();
  const { isAdmin } = useAuth();

  const load = useCallback(async (q = '', cat = 'All') => {
    setLoading(true); setError('');
    try {
      let data;
      if (q) data = await api.getProducts(q);
      else if (cat !== 'All') data = await api.getProductsByCategory(cat);
      else data = await api.getProducts();
      setProducts(data);
    } catch {
      setError('Cannot connect to server. Make sure Spring Boot is running on port 8080.');
    } finally { setLoading(false); }
  }, []);

  useEffect(() => {
    const q = searchParams.get('search') || '';
    const cat = searchParams.get('category') || 'All';
    setSearch(q); setActiveTab(cat); load(q, cat);
  // eslint-disable-next-line
  }, []);

  const handleSearch = q => { setSearch(q); setActiveTab('All'); load(q, 'All'); };
  const handleTab    = cat => { setActiveTab(cat); setSearch(''); load('', cat); };
  const handlePopular = label => {
    setSearch(label); setActiveTab('All'); load(label, 'All');
    document.querySelector('.products-grid')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  return (
    <div className="page-wrapper">

      {/* Admin banner — visible only when logged in as admin */}
      {isAdmin && (
        <div style={{
          background:'#1a5c30', color:'#fff', padding:'10px 20px',
          display:'flex', alignItems:'center', justifyContent:'space-between',
          fontSize:14, flexWrap:'wrap', gap:8
        }}>
          <span>🔐 You are viewing as <strong>Admin</strong>. Customers see this page differently.</span>
          <Link to="/admin" className="btn btn-secondary btn-sm" style={{ color:'#1a5c30' }}>
            Go to Admin Panel →
          </Link>
        </div>
      )}

      {/* ── Hero ── */}
      <div className="hero">
        <div className="hero-content">
          <div className="hero-pill">
            <span className="hero-pill-dot" />
            Farm Fresh · Delivered Today
          </div>
          <h1>Nature's Best<br /><span className="accent">Blooms</span>, At Your Door</h1>
          <p className="hero-sub">
            Hand-picked flowers sourced fresh every morning. Same-day delivery within 12 km.
            Cash on delivery &amp; UPI accepted.
          </p>
          <div className="hero-actions">
            <button className="btn btn-warm btn-lg"
              onClick={() => document.querySelector('.cat-tabs')?.scrollIntoView({ behavior: 'smooth' })}>
              🌸 Shop Flowers
            </button>
            <Link to="/order/track" className="btn btn-secondary btn-lg">📦 Track Order</Link>
          </div>
        </div>
        <div className="hero-logo-wrap">
          <img src={logoB64} alt="BC Fresh n Fresh" className="hero-logo-img" />
        </div>
      </div>

      {/* ── Trust strip ── */}
      <div className="trust-strip">
        <div className="trust-chip"><span className="trust-chip-icon">⚡</span> Same-Day Delivery</div>
        <div className="trust-chip"><span className="trust-chip-icon">🌿</span> Farm Fresh Daily</div>
        <div className="trust-chip"><span className="trust-chip-icon">💵</span> Cash on Delivery</div>
        <div className="trust-chip"><span className="trust-chip-icon">📱</span> UPI / Online Pay</div>
        <div className="trust-chip"><span className="trust-chip-icon">📍</span> Delivers Within 12 km</div>
        <div className="trust-chip"><span className="trust-chip-icon">⭐</span> 500+ Happy Customers</div>
      </div>

      {/* ── Delivery note banner ── */}
      <div style={{
        background:'#f0f8f0', borderBottom:'1px solid #c8e6c9',
        padding:'10px 20px', textAlign:'center', fontSize:13, color:'#1a5c30', fontWeight:500
      }}>
        📍 Prices shown are per unit. <strong>Delivery charges</strong> are calculated at checkout based on your GPS location.
      </div>

      {/* ── Search ── */}
      <div className="search-wrap">
        <div className="search-bar">
          <span style={{ fontSize:18, marginRight:6, opacity:.5 }}>🔍</span>
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleSearch(search)}
            placeholder="Search flowers… Rose, Jasmine, Marigold, Lotus…"
          />
          {search && (
            <button className="search-clear" onClick={() => { setSearch(''); load('', activeTab); }}>✕</button>
          )}
          <button className="btn btn-primary btn-sm" style={{ borderRadius:'var(--r-full)' }}
            onClick={() => handleSearch(search)}>
            Search
          </button>
        </div>
      </div>

      {/* ── Category Tabs ── */}
      <div className="cat-tabs">
        {CATEGORIES.map(c => (
          <button key={c.name}
            className={`cat-tab ${activeTab === c.name ? 'active' : ''}`}
            onClick={() => handleTab(c.name)}>
            <span className="cat-tab-emoji">{c.emoji}</span>
            <span className="cat-tab-label">{c.name}</span>
          </button>
        ))}
      </div>

      {error && <div className="alert alert-error">{error}</div>}

      {loading ? (
        <div className="spinner" />
      ) : products.length === 0 ? (
        <div className="empty">
          <span className="empty-icon">🌿</span>
          <h3>No flowers found</h3>
          <p>Try a different search or browse all varieties.</p>
          <button className="btn btn-primary" style={{ marginTop:16 }}
            onClick={() => { setSearch(''); setActiveTab('All'); load(); }}>
            View All Flowers
          </button>
        </div>
      ) : (
        <>
          <div className="section-hd">
            <h2>
              {activeTab === 'All'
                ? <>Fresh <em>Today</em></>
                : <>{CATEGORIES.find(c => c.name === activeTab)?.emoji} {activeTab}</>}
            </h2>
            <span className="section-count">
              {products.length} {products.length === 1 ? 'variety' : 'varieties'}
            </span>
          </div>
          <div className="products-grid">
            {products.map(p => <ProductCard key={p.id} product={p} />)}
          </div>
        </>
      )}

      {/* ── Popular Searches ── */}
      <div className="popular-section">
        <div className="popular-title">
          <span>POPULAR</span> <span className="popular-accent">SEARCHES</span>
        </div>
        <div className="popular-grid">
          {POPULAR_SEARCHES.map(ps => (
            <button key={ps.label} className="popular-chip" onClick={() => handlePopular(ps.label)}>
              <span className="popular-chip-emoji">{ps.emoji}</span>
              {ps.label}
            </button>
          ))}
        </div>
      </div>

      {!isAdmin && cartCount > 0 && (
        <Link to="/cart" className="fab-cart">
          🛒 View Cart ({cartCount})
        </Link>
      )}
    </div>
  );
}