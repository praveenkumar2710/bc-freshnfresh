import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import './CartPage.css';

export default function CartPage() {
  const { cart, removeFromCart, updateQuantity, subtotal, clearCart } = useCart();
  const navigate = useNavigate();

  if (cart.length === 0) return (
    <div className="page-wrapper">
      <div className="empty-cart">
        <div style={{ fontSize: 80 }}>🛒</div>
        <h2>Your cart is empty</h2>
        <p>Add some beautiful flowers to get started!</p>
        <Link to="/" className="btn btn-primary btn-lg" style={{ marginTop: 20 }}>
          🌸 Browse Flowers
        </Link>
      </div>
    </div>
  );

  return (
    <div className="page-wrapper">
      <div className="cart-header">
        <h1>🛒 Your Cart</h1>
        <button className="btn btn-secondary btn-sm" onClick={clearCart}>🗑 Clear All</button>
      </div>

      <div className="cart-layout">
        {/* Items list */}
        <div className="cart-items">
          {cart.map(item => (
            <div key={item.productId} className="cart-row card">
              <div className="ci-emoji">{item.imageEmoji}</div>
              <div className="ci-info">
                <h3>{item.productName}</h3>
                <p>₹{item.price} / {item.unit}</p>
              </div>
              <div className="ci-controls">
                <div className="qty-ctrl">
                  <button onClick={() => updateQuantity(item.productId, item.quantity - 1)}>−</button>
                  <span>{item.quantity}</span>
                  <button onClick={() => updateQuantity(item.productId, item.quantity + 1)}>+</button>
                </div>
                <div className="ci-total">₹{(item.price * item.quantity).toFixed(0)}</div>
              </div>
              <button className="ci-remove" onClick={() => removeFromCart(item.productId)}>✕</button>
            </div>
          ))}
        </div>

        {/* Order summary */}
        <div className="cart-summary card">
          <h2>Order Summary</h2>
          <hr className="divider" />
          {cart.map(item => (
            <div key={item.productId} className="sum-row">
              <span>{item.productName} × {item.quantity}</span>
              <span>₹{(item.price * item.quantity).toFixed(0)}</span>
            </div>
          ))}
          <hr className="divider" />
          <div className="sum-row sum-total">
            <span>Subtotal</span>
            <span>₹{subtotal.toFixed(0)}</span>
          </div>
          <p className="sum-note">🚚 Delivery charge calculated at checkout</p>
          <button
            className="btn btn-primary btn-lg btn-full"
            style={{ marginTop: 12 }}
            onClick={() => navigate('/checkout')}
          >
            Proceed to Checkout →
          </button>
          <Link to="/" className="btn btn-secondary btn-full" style={{ marginTop: 8 }}>
            ← Continue Shopping
          </Link>
        </div>
      </div>
    </div>
  );
}
