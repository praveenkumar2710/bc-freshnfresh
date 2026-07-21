import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { logoB64 } from '../logoB64';
import './Footer.css';

export default function Footer() {
  const navigate = useNavigate();

  const goSearch = (term) => {
    navigate(`/?search=${encodeURIComponent(term)}`);
    window.scrollTo(0, 0);
  };

  const goCat = (cat) => {
    navigate(`/?category=${encodeURIComponent(cat)}`);
    window.scrollTo(0, 0);
  };

  return (
    <footer className="footer">
      <div className="footer-top">

        {/* Brand */}
        <div className="footer-brand">
          <div className="footer-brand-logo">
            <img src={logoB64} alt="BC Fresh n Fresh" className="footer-logo-img" />
          </div>
          <p className="footer-desc">
            Hyderabad's trusted online flower shop — hand-picked fresh blooms delivered same day within 12 km. Cash &amp; UPI accepted.
          </p>
          <div className="footer-contact-list">
            <span>📍 Hyderabad, Telangana</span>
            <a href="mailto:bcfreshnfresh@gmail.com">✉️ bcfreshnfresh@gmail.com</a>
          </div>
          <div className="footer-social">
            
            <a href="https://wa.me/918688538680" target="_blank" rel="noopener noreferrer" aria-label="WhatsApp" className="social-btn">💬</a>
          </div>

          {/* Decoration Services Card */}
          <div style={{
            background: '#f0fdf4',
            border: '1px solid #bbf7d0',
            borderRadius: 10,
            padding: '12px 16px',
            marginTop: 16
          }}>
            <p style={{ fontSize: 13, fontWeight: 600, color: '#1a8c4e', margin: '0 0 4px' }}>
              🎊 Flower Decorations Available!
            </p>
            <p style={{ fontSize: 12, color: '#555', margin: '0 0 8px' }}>
              Weddings, Pooja, Events & more — contact us!
            </p>
            <a
              href="https://wa.me/918688538680?text=Hello%20BC%20Fresh%20n%20Fresh!%20I%20am%20interested%20in%20flower%20decoration%20services."
              target="_blank"
              rel="noopener noreferrer"
              style={{
                background: '#25D366',
                color: '#fff',
                padding: '6px 16px',
                borderRadius: 20,
                textDecoration: 'none',
                fontSize: 12,
                fontWeight: 600,
                display: 'inline-block'
              }}
            >
              💬 WhatsApp Us
            </a>
          </div>
        </div>

        {/* Pooja Flowers */}
        <div className="footer-col">
          <h4>POOJA FLOWERS</h4>
          <ul>
            <li><button onClick={() => goCat('Pooja Flowers')}>Loose Flowers</button></li>
            <li><button onClick={() => goSearch('Rose Garland')}>Rose Garland</button></li>
            <li><button onClick={() => goSearch('Pink Lotus')}>Pink Lotus</button></li>
            <li><button onClick={() => goSearch('Banana Leaves')}>Banana Leaves</button></li>
            <li><button onClick={() => goSearch('Tulsi')}>Loose Tulsi</button></li>
            <li><button onClick={() => goSearch('Marigold')}>Marigold</button></li>
            <li><button onClick={() => goSearch('Durva Grass')}>Dhurva Grass</button></li>
            <li><button onClick={() => goSearch('Lotus')}>Pink Lotus</button></li>
          </ul>
        </div>

        {/* Wedding Flowers */}
        <div className="footer-col">
          <h4>WEDDING FLOWERS</h4>
          <ul>
            <li><button onClick={() => goSearch('Wedding Garland')}>Wedding Garland</button></li>
            <li><button onClick={() => goSearch('Jasmine Garland')}>Jasmine Garland</button></li>
            <li><button onClick={() => goCat('Bouquets')}>Bridal Bouquets</button></li>
            <li><button onClick={() => goSearch('Gajra')}>Jasmine Gajra</button></li>
            <li><button onClick={() => goSearch('Muggu Jade')}>Gypse Muggu Jade</button></li>
            <li><button onClick={() => goSearch('Pink Lotus Garland')}>Pink Lotus Garland</button></li>
          </ul>
        </div>

        {/* Bouquets + Account */}
        <div className="footer-col">
          <h4>BRIDAL &amp; BOUQUETS</h4>
          <ul>
            <li><button onClick={() => goCat('Bouquets')}>All Bouquets</button></li>
            <li><button onClick={() => goSearch('Rose Bouquet')}>Rose Bouquet</button></li>
            <li><button onClick={() => goSearch('Flower Bookay')}>Flower Bookay</button></li>
            <li><button onClick={() => goSearch('Gajra')}>Bridal Gajra</button></li>
          </ul>
          <h4 style={{ marginTop: 20 }}>ACCOUNT</h4>
          <ul>
            <li><Link to="/my-orders">My Orders</Link></li>
            <li><Link to="/login">Login</Link></li>
            <li><Link to="/register">Register</Link></li>
            <li><Link to="/order/track">Track Order</Link></li>
          </ul>
        </div>

        {/* Site Menu */}
        <div className="footer-col">
          <h4>SITE MENU</h4>
          <ul>
            <li><Link to="/cart">Cart</Link></li>
            <li><Link to="/checkout">Checkout</Link></li>
            <li><Link to="/order/track">Track Order</Link></li>
          </ul>
          <h4 style={{ marginTop: 20 }}>TERMS &amp; POLICY</h4>
          <ul>
            <li><a href="#!">Terms and Conditions</a></li>
            <li><a href="#!">Privacy Policy</a></li>
            <li><a href="#!">Refund Policy</a></li>
            <li><a href="#!">FAQs</a></li>
          </ul>
        </div>

      </div>

      <div className="footer-bottom">
        <div className="footer-bottom-inner">
          <span className="footer-copy">© {new Date().getFullYear()} BC Fresh n' Fresh. All rights reserved.</span>
          <span className="footer-love">Made with <span>♥</span> in Hyderabad</span>
        </div>
      </div>
    </footer>
  );
}