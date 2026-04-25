import React, { useEffect, useState, useCallback } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { api, getImageUrl } from '../services/api';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { logoB64 } from '../logoB64';
import './HomePage.css';

const CATEGORIES = [
  { name: 'All', emoji: '🌸' },
  { name: 'Bouquets', emoji: '💐' },
  { name: 'Garlands', emoji: '🌼' },
  { name: 'Pooja Flowers', emoji: '🪷' },
  { name: 'Sacred Leaves', emoji: '🍃' },
  { name: 'Pooja Essentials', emoji: '🥥' },
];

// Product image
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

  return <span className="pcard-emoji">{product.imageEmoji || '🌸'}</span>;
}

// Product Card
function ProductCard({ product }) {
  const { addToCart } = useCart();
  const { isAdmin } = useAuth();
  const [qty, setQty] = useState(1);

  return (
    <div className="pcard">
      <ProductImage product={product} />

      <h3>{product.name}</h3>
      <p>₹{product.price}</p>

      {isAdmin ? (
        <Link to="/admin/products">Manage</Link>
      ) : (
        <button onClick={() => addToCart(product, qty)}>
          Add to Cart
        </button>
      )}
    </div>
  );
}

// Main Page
export default function HomePage() {
  const [searchParams] = useSearchParams();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  const { cartCount } = useCart();
  const { isAdmin, user } = useAuth();

  // ✅ FIX ADDED
  const isLoggedIn = !!localStorage.getItem("token");

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await api.getProducts();
      setProducts(data);
    } catch {
      console.error("API error");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <div>

      {/* Admin Banner */}
      {isAdmin && (
        <div>
          Admin Mode
          <Link to="/admin">Go to Admin</Link>
        </div>
      )}

      {/* Products */}
      {loading ? (
        <p>Loading...</p>
      ) : (
        <div>
          {products.map(p => (
            <ProductCard key={p.id} product={p} />
          ))}
        </div>
      )}

      {/* Cart */}
      {!isAdmin && cartCount > 0 && (
        <Link to="/cart">Cart ({cartCount})</Link>
      )}

      {/* ✅ FIXED LOGIN BANNER */}
      {isLoggedIn && !isAdmin && user && (
        <div style={{ background: 'green', color: '#fff', padding: 10 }}>
          👋 Welcome back, <strong>{user.name || user.email}</strong>
        </div>
      )}

    </div>
  );
}