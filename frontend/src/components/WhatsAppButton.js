import React, { useState } from 'react';

const PHONE    = '918688538680'; // your number with country code
const MESSAGE  = encodeURIComponent(
  'Hello BC Fresh n Fresh! 🌸\nI would like to place an order / have a query.'
);
const WA_URL   = `https://wa.me/${PHONE}?text=${MESSAGE}`;

export default function WhatsAppButton() {
  const [hovered, setHovered] = useState(false);

  return (
    <a
      href={WA_URL}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Chat on WhatsApp"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        position:        'fixed',
        bottom:          24,
        left:            24,
        zIndex:          999,
        display:         'flex',
        alignItems:      'center',
        gap:             10,
        background:      '#25D366',
        color:           '#fff',
        borderRadius:    50,
        padding:         hovered ? '12px 20px 12px 14px' : '12px 14px',
        boxShadow:       '0 4px 20px rgba(37,211,102,0.45)',
        textDecoration:  'none',
        fontWeight:      600,
        fontSize:        14,
        transition:      'all 0.25s ease',
        overflow:        'hidden',
        whiteSpace:      'nowrap',
      }}
    >
      {/* WhatsApp SVG Icon */}
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 32 32"
        width="26"
        height="26"
        fill="#fff"
        style={{ flexShrink: 0 }}
      >
        <path d="M16 .5C7.44.5.5 7.44.5 16c0 2.82.74 5.46 2.02 7.76L.5 31.5l8-2.02A15.5 15.5 0 0016 31.5c8.56 0 15.5-6.94 15.5-15.5S24.56.5 16 .5zm0 28.34a12.8 12.8 0 01-6.53-1.79l-.47-.28-4.75 1.2 1.23-4.62-.31-.49A12.84 12.84 0 1116 28.84zm7.07-9.6c-.39-.19-2.29-1.13-2.64-1.26-.35-.13-.61-.19-.87.19s-1 1.26-1.22 1.52-.45.29-.84.1a10.5 10.5 0 01-3.1-1.91 11.6 11.6 0 01-2.15-2.67c-.22-.39-.02-.6.17-.79.17-.17.39-.45.58-.67.19-.22.26-.39.39-.65.13-.26.06-.48-.03-.67-.1-.19-.87-2.1-1.19-2.87-.31-.75-.63-.65-.87-.66h-.74c-.26 0-.67.1-1.02.48s-1.34 1.31-1.34 3.2 1.37 3.71 1.56 3.97c.19.26 2.7 4.12 6.54 5.78.91.39 1.63.63 2.18.8.92.29 1.75.25 2.41.15.74-.11 2.29-.94 2.61-1.84.32-.9.32-1.68.22-1.84-.09-.16-.35-.26-.74-.45z"/>
      </svg>

      {/* Label — only show on hover */}
      <span style={{
        maxWidth:   hovered ? 140 : 0,
        opacity:    hovered ? 1 : 0,
        transition: 'all 0.25s ease',
        overflow:   'hidden',
      }}>
        Chat with us
      </span>
    </a>
  );
}