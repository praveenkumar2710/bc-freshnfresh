import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';

export default function RatingWidget() {
  const { user } = useAuth();
  const [overall,    setOverall]    = useState(null);
  const [showPopup,  setShowPopup]  = useState(false);
  const [myRating,   setMyRating]   = useState(0);
  const [myComment,  setMyComment]  = useState('');
  const [hover,      setHover]      = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [submitted,  setSubmitted]  = useState(false);
  const [msg,        setMsg]        = useState('');

  useEffect(() => { loadOverall(); }, []);
  useEffect(() => { if (user) loadMyRating(); }, [user]);

  const loadOverall = async () => {
    try {
      const data = await api.getAppRating();
      setOverall(data);
    } catch { }
  };

  const loadMyRating = async () => {
    try {
      const data = await api.getMyAppRating();
      if (data.hasRating) {
        setMyRating(data.rating);
        setMyComment(data.comment || '');
        setSubmitted(true);
      }
    } catch { }
  };

  const submit = async () => {
    if (!myRating) { setMsg('Please select stars'); return; }
    setSubmitting(true);
    try {
      await api.submitAppRating(myRating, myComment);
      setSubmitted(true);
      setMsg('🌸 Thank you for your feedback!');
      loadOverall();
      setTimeout(() => { setShowPopup(false); setMsg(''); }, 2000);
    } catch {
      setMsg('Failed to submit. Please try again.');
    }
    setSubmitting(false);
  };

  const stars = (filled, size = 16) =>
    [1, 2, 3, 4, 5].map(s => (
      <span key={s} style={{ color: s <= filled ? '#f59e0b' : '#d1d5db', fontSize: size }}>★</span>
    ));

  return (
    <>
      {/* Floating Rating Button */}
      <div
        onClick={() => setShowPopup(true)}
        style={{
          position: 'fixed',
          bottom: 80,
          right: 20,
          background: '#1a8c4e',
          color: '#fff',
          borderRadius: 50,
          padding: '10px 16px',
          cursor: 'pointer',
          boxShadow: '0 4px 16px rgba(0,0,0,0.18)',
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          zIndex: 900,
          fontSize: 13,
          fontWeight: 600,
          userSelect: 'none'
        }}
      >
        <span style={{ fontSize: 18 }}>⭐</span>
        {overall && overall.totalRatings > 0 ? (
          <span>{overall.averageRating} ({overall.totalRatings})</span>
        ) : (
          <span>Rate Us</span>
        )}
      </div>

      {/* Popup */}
      {showPopup && (
        <div
          onClick={() => setShowPopup(false)}
          style={{
            position: 'fixed', inset: 0,
            background: 'rgba(0,0,0,0.45)',
            zIndex: 1000,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            padding: 20
          }}
        >
          <div
            onClick={e => e.stopPropagation()}
            style={{
              background: '#fff',
              borderRadius: 20,
              padding: 28,
              maxWidth: 380,
              width: '100%',
              boxShadow: '0 20px 60px rgba(0,0,0,0.15)'
            }}
          >
            {/* Header */}
            <div style={{ textAlign: 'center', marginBottom: 20 }}>
              <div style={{ fontSize: 40 }}>🌸</div>
              <h2 style={{ margin: '8px 0 4px', fontSize: 20, color: '#1a8c4e' }}>
                BC Fresh n Fresh
              </h2>
              <p style={{ color: '#888', fontSize: 13, margin: 0 }}>
                How was your experience?
              </p>
            </div>

            {/* Overall Stats */}
            {overall && overall.totalRatings > 0 && (
              <div style={{
                background: '#f8fdf8', borderRadius: 12,
                padding: '12px 16px', marginBottom: 20
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div style={{ fontSize: 36, fontWeight: 700, color: '#1a8c4e' }}>
                    {overall.averageRating}
                  </div>
                  <div>
                    <div style={{ display: 'flex' }}>{stars(Math.round(overall.averageRating), 20)}</div>
                    <div style={{ fontSize: 12, color: '#888', marginTop: 2 }}>
                      {overall.totalRatings} rating{overall.totalRatings !== 1 ? 's' : ''}
                    </div>
                  </div>
                  {/* Breakdown bars */}
                  <div style={{ flex: 1, marginLeft: 8 }}>
                    {overall.breakdown && [5,4,3,2,1].map(s => (
                      <div key={s} style={{ display:'flex', alignItems:'center', gap:4, marginBottom:2 }}>
                        <span style={{ fontSize:10, color:'#888', width:6 }}>{s}</span>
                        <div style={{ flex:1, background:'#e5e7eb', borderRadius:4, height:6 }}>
                          <div style={{
                            width: overall.totalRatings > 0
                              ? `${(overall.breakdown[s] / overall.totalRatings) * 100}%`
                              : '0%',
                            background:'#f59e0b', borderRadius:4, height:'100%'
                          }} />
                        </div>
                        <span style={{ fontSize:10, color:'#888', width:12 }}>
                          {overall.breakdown[s] || 0}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Rate Form */}
            {user ? (
              <div>
                <div style={{ fontSize: 13, fontWeight: 600, color: '#333', marginBottom: 8 }}>
                  {submitted ? 'Update Your Rating' : 'Your Rating'}
                </div>
                <div style={{ display: 'flex', gap: 6, marginBottom: 12 }}>
                  {[1,2,3,4,5].map(s => (
                    <span
                      key={s}
                      onClick={() => setMyRating(s)}
                      onMouseEnter={() => setHover(s)}
                      onMouseLeave={() => setHover(0)}
                      style={{
                        fontSize: 36,
                        cursor: 'pointer',
                        color: s <= (hover || myRating) ? '#f59e0b' : '#d1d5db',
                        transition: 'color .15s'
                      }}
                    >★</span>
                  ))}
                </div>
                <textarea
                  value={myComment}
                  onChange={e => setMyComment(e.target.value)}
                  placeholder="Tell us about your experience... (optional)"
                  rows={3}
                  style={{
                    width: '100%', padding: '10px 12px',
                    border: '1.5px solid #e5e7eb', borderRadius: 10,
                    fontSize: 13, fontFamily: 'inherit',
                    resize: 'vertical', boxSizing: 'border-box',
                    marginBottom: 12
                  }}
                />
                {msg && (
                  <div style={{
                    fontSize: 13, marginBottom: 10,
                    color: msg.startsWith('🌸') ? '#1a8c4e' : '#e74c3c'
                  }}>{msg}</div>
                )}
                <button
                  onClick={submit}
                  disabled={submitting}
                  style={{
                    width: '100%', background: '#1a8c4e', color: '#fff',
                    border: 'none', borderRadius: 10, padding: '12px',
                    fontSize: 15, fontWeight: 600, cursor: 'pointer'
                  }}
                >
                  {submitting ? '⏳ Submitting…' : submitted ? '✅ Update Rating' : '⭐ Submit Rating'}
                </button>
              </div>
            ) : (
              <div style={{ textAlign: 'center', padding: '12px 0' }}>
                <p style={{ color: '#888', fontSize: 14 }}>
                  Please <a href="/login" style={{ color: '#1a8c4e', fontWeight: 600 }}>login</a> to rate us
                </p>
              </div>
            )}

            {/* Recent Reviews */}
            {overall && overall.recentReviews && overall.recentReviews.length > 0 && (
              <div style={{ marginTop: 16, borderTop: '1px solid #eee', paddingTop: 14 }}>
                <div style={{ fontSize: 12, fontWeight: 600, color: '#888', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  Recent Feedback
                </div>
                {overall.recentReviews.map((r, i) => (
                  <div key={i} style={{ marginBottom: 8 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <span style={{ fontSize: 12, fontWeight: 600, color: '#333' }}>{r.name}</span>
                      <span style={{ color: '#f59e0b', fontSize: 12 }}>{'★'.repeat(r.rating)}</span>
                    </div>
                    {r.comment && <p style={{ fontSize: 12, color: '#666', margin: '2px 0 0', lineHeight: 1.4 }}>{r.comment}</p>}
                  </div>
                ))}
              </div>
            )}

            <button
              onClick={() => setShowPopup(false)}
              style={{
                marginTop: 14, width: '100%', background: 'transparent',
                border: '1px solid #e5e7eb', borderRadius: 10, padding: '10px',
                fontSize: 13, color: '#888', cursor: 'pointer'
              }}
            >
              Close
            </button>
          </div>
        </div>
      )}
    </>
  );
}