import React, { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { api, getImageUrl } from '../services/api';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import './HomePage.css';

const CATEGORIES = [
  { name: 'All',              emoji: '🌸' },
  { name: 'Bouquets',         emoji: '💐' },
  { name: 'Garlands',         emoji: '🌼' },
  { name: 'Pooja Flowers',    emoji: '🪷' },
  { name: 'Sacred Leaves',    emoji: '🍃' },
  { name: 'Pooja Essentials', emoji: '🥥' },
  { name: 'Loose Flowers',    emoji: '🌺' },
];

/* ── Product Image ── */
function ProductImage({ product, className }) {
  const [imgErr, setImgErr] = useState(false);
  const src = getImageUrl(product.imageUrl);

  if (src && !imgErr) {
    return (
      <img
        src={src}
        alt={product.name}
        className={className || 'pcard-img'}
        onError={() => setImgErr(true)}
      />
    );
  }
  return <div className="pcard-emoji">{product.imageEmoji || '🌸'}</div>;
}

/* ── Product Detail Modal (popup) ── */
function ProductModal({ product, onClose }) {
  const { addToCart, cartItems } = useCart();
  const { isAdmin } = useAuth();
  const inCart = cartItems?.find(i => i.id === product.id);

  // Close on Escape key
  useEffect(() => {
    const handler = e => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onClose]);

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-box" onClick={e => e.stopPropagation()}>

        {/* Close button */}
        <button className="modal-close" onClick={onClose}>✕</button>

        {/* Image */}
        <div className="modal-img-wrap">
          <ProductImage product={product} className="modal-img" />
          {!product.available && (
            <div className="pcard-sold-out">Sold Out</div>
          )}
        </div>

        {/* Details */}
        <div className="modal-body">
          <div className="pcard-category">{product.category || 'Flowers'}</div>
          <h2 className="modal-name">{product.name}</h2>

          <div className="modal-price">
            ₹{product.price}
            <span className="pcard-unit"> / {product.unit || 'piece'}</span>
          </div>

          {/* Description */}
          {product.description && product.description.trim() !== '' && (
            <div className="modal-desc">
              <div className="modal-desc-label">About this product</div>
              <p>{product.description}</p>
            </div>
          )}

          {/* Action button */}
          <div className="modal-actions">
            {isAdmin ? (
              <Link to="/admin/products" className="pcard-btn pcard-btn-manage" style={{ padding:'12px 24px', fontSize:14 }}>
                Manage Product
              </Link>
            ) : product.available ? (
              <button
                className={`pcard-btn ${inCart ? 'pcard-btn-added' : 'pcard-btn-add'}`}
                style={{ padding:'12px 24px', fontSize:15, width:'100%' }}
                onClick={() => { addToCart(product, 1); onClose(); }}
              >
                {inCart ? `✓ Added (${inCart.quantity}) — Add More` : '🛒 Add to Cart'}
              </button>
            ) : (
              <span className="pcard-btn pcard-btn-disabled" style={{ padding:'12px 24px', fontSize:14, width:'100%', textAlign:'center' }}>
                Currently Unavailable
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ── Product Card ── */
function ProductCard({ product, onOpenModal }) {
  const { addToCart, cartItems } = useCart();
  const { isAdmin } = useAuth();
  const inCart = cartItems?.find(i => i.id === product.id);

  return (
    <div className="pcard">
      {/* Clicking image opens popup */}
      <div className="pcard-img-wrap" onClick={() => onOpenModal(product)} style={{ cursor:'pointer' }}>
        <ProductImage product={product} />
        {!product.available && (
          <div className="pcard-sold-out">Sold Out</div>
        )}
        {/* View detail hint */}
        <div className="pcard-view-hint">🔍 View</div>
      </div>

      <div className="pcard-body">
        <div className="pcard-category">{product.category || 'Flowers'}</div>

        {/* Clicking name also opens popup */}
        <h3
          className="pcard-name"
          onClick={() => onOpenModal(product)}
          style={{ cursor:'pointer' }}
        >
          {product.name}
        </h3>

        {/* Description preview — 2 lines max */}
        {product.description && product.description.trim() !== '' && (
          <p className="pcard-desc">{product.description}</p>
        )}

        <div className="pcard-footer">
          <span className="pcard-price">
            ₹{product.price}
            <span className="pcard-unit"> / {product.unit || 'piece'}</span>
          </span>
          {isAdmin ? (
            <Link to="/admin/products" className="pcard-btn pcard-btn-manage">Manage</Link>
          ) : product.available ? (
            <button
              className={`pcard-btn ${inCart ? 'pcard-btn-added' : 'pcard-btn-add'}`}
              onClick={() => addToCart(product, 1)}
            >
              {inCart ? `✓ ${inCart.quantity}` : '+ Add'}
            </button>
          ) : (
            <span className="pcard-btn pcard-btn-disabled">Unavailable</span>
          )}
        </div>
      </div>
    </div>
  );
}

/* ── Main Page ── */
export default function HomePage() {
  const [products,      setProducts]      = useState([]);
  const [loading,       setLoading]       = useState(true);
  const [category,      setCategory]      = useState('All');
  const [search,        setSearch]        = useState('');
  const [selectedProduct, setSelectedProduct] = useState(null);

  const { cartCount } = useCart();
  const { isAdmin }   = useAuth();

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await api.getProducts();
      if (Array.isArray(data))               setProducts(data);
      else if (Array.isArray(data?.content)) setProducts(data.content);
      else                                   setProducts([]);
    } catch (err) {
      console.error(err);
      setProducts([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  // Prevent background scroll when modal is open
  useEffect(() => {
    document.body.style.overflow = selectedProduct ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [selectedProduct]);

  const visible = products.filter(p => {
    const matchCat    = category === 'All' || p.category === category;
    const q           = search.trim().toLowerCase();
    const matchSearch = !q || p.name?.toLowerCase().includes(q);
    return matchCat && matchSearch;
  });

  return (
    <div className="hp-root">

      {/* Admin banner */}
      {isAdmin && (
        <div className="hp-admin-bar">
          🔑 Admin Mode — <Link to="/admin">Go to Dashboard →</Link>
        </div>
      )}

      {/* Hero */}
      <div className="hp-hero">
        <div className="hp-hero-text">
          <h1>Fresh Flowers,<br />Delivered Daily 🌸</h1>
          <p>Premium pooja flowers &amp; bouquets delivered to your door</p>
        </div>
      </div>

      {/* Search */}
      <div className="hp-search-wrap">
        <input
          className="hp-search"
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="🔍 Search flowers, garlands, essentials…"
        />
      </div>

      {/* Category tabs */}
      <div className="hp-cats">
        {CATEGORIES.map(c => (
          <button
            key={c.name}
            className={`hp-cat-btn ${category === c.name ? 'active' : ''}`}
            onClick={() => setCategory(c.name)}
          >
            {c.emoji} {c.name}
          </button>
        ))}
      </div>

      {/* Products grid */}
      <div className="hp-main">
        {loading ? (
          <div className="hp-loading">
            <div className="hp-spinner" />
            <span>Loading fresh flowers…</span>
          </div>
        ) : visible.length === 0 ? (
          <div className="hp-empty">
            <div style={{ fontSize: 48 }}>🌾</div>
            <p>{search ? `No results for "${search}"` : 'No products in this category yet.'}</p>
            {search && (
              <button className="hp-btn hp-btn-primary" onClick={() => setSearch('')}>Clear Search</button>
            )}
          </div>
        ) : (
          <div className="hp-grid">
            {visible.map(p => (
              <ProductCard
                key={p.id}
                product={p}
                onOpenModal={setSelectedProduct}
              />
            ))}
          </div>
        )}
      </div>

      {/* Floating cart button (mobile) */}
      {!isAdmin && cartCount > 0 && (
        <Link to="/cart" className="hp-float-cart">
          🛒 View Cart &nbsp;<strong>({cartCount})</strong>
        </Link>
      )}

      {/* Product Detail Modal */}
      {selectedProduct && (
        <ProductModal
          product={selectedProduct}
          onClose={() => setSelectedProduct(null)}
        />
      )}

    </div>
  );
}