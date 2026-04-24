import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { logoB64 } from '../logoB64';
import './Navbar.css';

export default function Navbar() {
  const { cartCount } = useCart();
  const { user, isLoggedIn, isAdmin, logout } = useAuth();
  const navigate = useNavigate();
  const loc = useLocation();
  const [menuOpen, setMenu] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const handleLogout = () => { logout(); navigate('/'); };
  const active = (path) => loc.pathname === path ? 'active' : '';

  return (
    <>
      <div className="nb-announce">
        🌸 Same-day delivery within 12 km &nbsp;·&nbsp; Free delivery for orders under 3 km &nbsp;·&nbsp; 💳 UPI &amp; Cash on Delivery accepted!
      </div>
      <nav className={`navbar${scrolled ? ' scrolled' : ''}`}>
        <div className="nb-inner">

          <Link to={isAdmin ? '/admin' : '/'} className="nb-brand" onClick={() => setMenu(false)}>
            <img src={logoB64} alt="BC Fresh n Fresh" className="nb-logo-img" />
          </Link>

          <div className={`nb-links ${menuOpen ? 'open' : ''}`}>
            {/* Customers see shop links */}
            {!isAdmin && (
              <>
                <Link to="/" className={active('/')} onClick={() => setMenu(false)}>Shop</Link>
                <Link to="/order/track" className={active('/order/track')} onClick={() => setMenu(false)}>Track Order</Link>
                {isLoggedIn && (
                  <Link to="/my-orders" className={active('/my-orders')} onClick={() => setMenu(false)}>My Orders</Link>
                )}
              </>
            )}
            {/* Admin sees admin links only */}
            {isAdmin && (
              <>
                <Link to="/admin"          className={`nb-admin ${active('/admin')}`}          onClick={() => setMenu(false)}>📊 Dashboard</Link>
                <Link to="/admin/products" className={`nb-admin ${active('/admin/products')}`} onClick={() => setMenu(false)}>🌸 Products</Link>
                <Link to="/admin/orders"   className={`nb-admin ${active('/admin/orders')}`}   onClick={() => setMenu(false)}>📦 Orders</Link>
                <Link to="/"               className="nb-admin"                                 onClick={() => setMenu(false)}>🏠 View Shop</Link>
              </>
            )}
          </div>

          <div className="nb-right">
            {/* Cart only for non-admin customers */}
            {!isAdmin && (
              <Link to="/cart" className="nb-cart" title="Cart">
                🛒
                {cartCount > 0 && <span className="cart-dot">{cartCount}</span>}
              </Link>
            )}

            {isLoggedIn ? (
              <div className="nb-user">
                <span className="nb-name">
                  {isAdmin ? '🔐' : '👤'} {user?.name?.split(' ')[0]}
                  {isAdmin && <span style={{ fontSize:11, background:'#e63946', color:'#fff', padding:'1px 6px', borderRadius:9, marginLeft:5, fontWeight:700 }}>ADMIN</span>}
                </span>
                <button className="btn btn-secondary btn-sm" onClick={handleLogout}>Logout</button>
              </div>
            ) : (
              <div className="nb-auth">
                <Link to="/login"    className="btn btn-secondary btn-sm">Login</Link>
                <Link to="/register" className="btn btn-primary btn-sm">Register</Link>
              </div>
            )}

            <button className="nb-hamburger" onClick={() => setMenu(o => !o)} aria-label="Menu">
              {menuOpen ? '✕' : '☰'}
            </button>
          </div>
        </div>
      </nav>
    </>
  );
}
