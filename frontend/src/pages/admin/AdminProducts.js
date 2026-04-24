import React, { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { adminApi, getImageUrl } from '../../services/api';

const CATEGORIES = ['Bouquets','Garlands','Pooja Flowers','Sacred Leaves','Pooja Essentials','Loose Flowers'];
const UNITS = ['250gm','500gm','1kg','bunch','piece','packet','pair','dozen','set','50gm','100gm'];

// ✅ FIX 1: unit default changed from '250gm' to 'piece' to match @NotBlank on unit field
const emptyForm = {
  name: '', price: '', stock: '', unit: 'piece',
  description: '', available: true, category: 'Pooja Flowers'
};



function ProductImage({ product, size = 56 }) {
  // ✅ FIX 2: imageUrl from backend is a path like /uploads/products/xxx.jpg
  // Must prefix with backend base URL to display correctly
  const imgSrc = getImageUrl(product.imageUrl);

  if (imgSrc) {
    return (
      <div style={{ position: 'relative', width: size, height: size }}>
        <img
          src={imgSrc}
          alt={product.name}
          style={{ width: size, height: size, objectFit: 'cover', borderRadius: 8, border: '1px solid #e0e0e8' }}
          onError={e => {
            e.target.style.display = 'none';
            e.target.nextSibling.style.display = 'flex';
          }}
        />
        <div style={{
          width: size, height: size, borderRadius: 8, background: '#f0f8f0',
          display: 'none', alignItems: 'center', justifyContent: 'center',
          fontSize: size * 0.5, border: '1px solid #e0e0e8', position: 'absolute', top: 0, left: 0
        }}>
          {product.imageEmoji || '🌸'}
        </div>
      </div>
    );
  }
  return (
    <div style={{
      width: size, height: size, borderRadius: 8, background: '#f0f8f0',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontSize: size * 0.5, border: '1px solid #e0e0e8'
    }}>
      {product.imageEmoji || '🌸'}
    </div>
  );
}

export default function AdminProducts() {
  const [products,    setProducts]    = useState([]);
  const [loading,     setLoading]     = useState(true);
  const [error,       setError]       = useState(null);
  const [modal,       setModal]       = useState(false);
  const [form,        setForm]        = useState(emptyForm);
  const [imageFile,   setImageFile]   = useState(null);
  const [imagePreview,setImagePreview]= useState('');
  const [editId,      setEditId]      = useState(null);
  const [priceModal,  setPriceModal]  = useState(null);
  const [newPrice,    setNewPrice]    = useState('');
  const [stockModal,  setStockModal]  = useState(null);
  const [newStock,    setNewStock]    = useState('');
  const [saving,      setSaving]      = useState(false);
  const [msg,         setMsg]         = useState('');
  const fileRef = useRef();

  const load = () => {
    setLoading(true); setError(null);
    adminApi.getAllProducts()
      .then(data => setProducts(Array.isArray(data) ? data : []))
      .catch(err => setError(err?.response?.data?.error || 'Failed to load products'))
      .finally(() => setLoading(false));
  };
  useEffect(load, []);

  const ch = e => {
    const val = e.target.type === 'checkbox' ? e.target.checked : e.target.value;
    setForm(f => ({ ...f, [e.target.name]: val }));
  };

  // ✅ FIX 3: Store real File object for multipart upload, not base64
  const handleImageFile = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) { setMsg('Image must be under 2MB'); return; }
    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
    setMsg('');
  };

  const openAdd = () => {
    setForm(emptyForm); setEditId(null);
    setImageFile(null); setImagePreview('');
    setMsg(''); setModal(true);
  };

  const openEdit = (p) => {
    setForm({
      name: p.name, price: p.price, stock: p.stock,
      unit: p.unit || 'piece',
      description: p.description || '',
      available: p.available,
      category: p.category || 'Pooja Flowers'
    });
    setImageFile(null);
    const existingImg = getImageUrl(p.imageUrl) || '';
    setImagePreview(existingImg);
    setEditId(p.id); setMsg(''); setModal(true);
  };

  // ✅ FIX 4: Send as FormData (multipart) so image + fields all go together
  const saveProduct = async () => {
    if (!form.name.trim()) return setMsg('Flower name is required');
    if (!form.price)       return setMsg('Price is required');
    if (!form.stock)       return setMsg('Stock quantity is required');
    setSaving(true); setMsg('');
    try {
      const formData = new FormData();
      formData.append('name',        form.name.trim());
      formData.append('price',       parseFloat(form.price));
      formData.append('stock',       parseInt(form.stock));
      formData.append('unit',        form.unit);
      formData.append('category',    form.category);
      formData.append('description', form.description || '');
      formData.append('available',   form.available);
      if (imageFile) formData.append('file', imageFile);

      if (editId) await adminApi.updateProductMultipart(editId, formData);
      else        await adminApi.addProductMultipart(formData);

      setModal(false); load();
    } catch (e) {
      setMsg(e?.response?.data?.error || 'Save failed. Try again.');
    }
    setSaving(false);
  };

  const updateDailyPrice = async () => {
    if (!newPrice || isNaN(parseFloat(newPrice))) return;
    try {
      await adminApi.updatePrice(priceModal.id, parseFloat(newPrice));
      setPriceModal(null); setNewPrice(''); load();
    } catch { alert('Price update failed'); }
  };

  const updateStock = async () => {
    if (!newStock || isNaN(parseInt(newStock))) return;
    try {
      await adminApi.updateStock(stockModal.id, parseInt(newStock));
      setStockModal(null); setNewStock(''); load();
    } catch { alert('Stock update failed'); }
  };

  const toggle = async (id) => {
    await adminApi.toggleProduct(id).catch(() => {});
    load();
  };

  const del = async (id, name) => {
    if (!window.confirm(`Delete "${name}"? This cannot be undone.`)) return;
    await adminApi.deleteProduct(id).catch(() => {});
    load();
  };

  return (
    <div className="admin-wrap">
      <aside className="admin-sidebar">
        <div className="sidebar-brand">🌸 Admin</div>
        <nav>
          <Link to="/admin"          className="sb-link">📊 Dashboard</Link>
          <Link to="/admin/products" className="sb-link active">🌸 Products</Link>
          <Link to="/admin/orders"   className="sb-link">📦 Orders</Link>
        </nav>
      </aside>

      <main className="admin-main">
        <div className="admin-topbar">
          <h1>🌸 Products</h1>
          <div style={{ display:'flex', gap:10 }}>
            <button className="btn btn-secondary btn-sm" onClick={load} disabled={loading}>🔄 Refresh</button>
            <button className="btn btn-primary" onClick={openAdd}>＋ Add Flower</button>
          </div>
        </div>

        <div style={{ padding:'12px 28px 0' }}>
          <div className="alert alert-info">
            💡 <strong>Tip:</strong> Upload a real photo when adding/editing a product. Use <strong>₹ Price</strong> for quick daily price update.
          </div>
        </div>

        {loading ? (
          <div className="spinner" style={{ margin:'40px auto' }} />
        ) : error ? (
          <div style={{ margin:'24px 28px', background:'#fff0f0', border:'1px solid #ffcccc', borderRadius:8, padding:'16px 20px', color:'#c0392b' }}>
            ⚠️ {error}
            <button className="btn btn-primary btn-sm" style={{ marginLeft:16 }} onClick={load}>Retry</button>
          </div>
        ) : products.length === 0 ? (
          <div style={{ margin:'40px 28px', textAlign:'center', color:'#888', fontSize:16 }}>
            No products yet. Click <strong>＋ Add Flower</strong> to add your first product.
          </div>
        ) : (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Photo</th><th>Flower</th><th>Category</th>
                  <th>Price</th><th>Stock</th><th>Unit</th>
                  <th>Status</th><th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {products.map(p => (
                  <tr key={p.id}>
                    <td><ProductImage product={p} size={48} /></td>
                    <td>
                      <div style={{ fontWeight:600 }}>{p.name}</div>
                      {p.description && (
                        <div style={{ fontSize:11, color:'var(--text-light)', maxWidth:180, whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>
                          {p.description}
                        </div>
                      )}
                    </td>
                    <td>
                      <span style={{ fontSize:12, background:'#f0f8f0', padding:'3px 8px', borderRadius:8, fontWeight:600, color:'#1a5c30' }}>
                        {p.category || '—'}
                      </span>
                    </td>
                    <td style={{ fontWeight:700, color:'var(--green-main)', fontSize:15 }}>₹{p.price}</td>
                    <td>
                      <span className={`badge ${p.stock > 10 ? 'badge-green' : p.stock > 0 ? 'badge-orange' : 'badge-red'}`}>
                        {p.stock} left
                      </span>
                    </td>
                    <td style={{ fontSize:13, color:'var(--text-mid)' }}>per {p.unit}</td>
                    <td>
                      <span className={`badge ${p.available ? 'badge-green' : 'badge-gray'}`}>
                        {p.available ? 'Active' : 'Hidden'}
                      </span>
                    </td>
                    <td>
                      <div style={{ display:'flex', gap:5, flexWrap:'wrap' }}>
                        <button className="btn btn-primary btn-sm"
                          onClick={() => { setPriceModal(p); setNewPrice(String(p.price)); }}>
                          ₹ Price
                        </button>
                        <button className="btn btn-secondary btn-sm"
                          onClick={() => { setStockModal(p); setNewStock(String(p.stock)); }}>
                          📦 Stock
                        </button>
                        <button className="btn btn-secondary btn-sm" onClick={() => openEdit(p)}>✏ Edit</button>
                        <button className="btn btn-secondary btn-sm" onClick={() => toggle(p.id)}>
                          {p.available ? '🙈 Hide' : '👁 Show'}
                        </button>
                        <button className="btn btn-danger btn-sm" onClick={() => del(p.id, p.name)}>🗑</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </main>

      {/* ── Add / Edit Modal ── */}
      {modal && (
        <div className="modal-backdrop" onClick={() => setModal(false)}>
          <div className="modal-box" style={{ maxWidth:540 }} onClick={e => e.stopPropagation()}>
            <h2 style={{ marginBottom:18 }}>{editId ? '✏ Edit Flower' : '＋ Add New Flower'}</h2>
            {msg && <div className="alert alert-error" style={{ marginBottom:12 }}>{msg}</div>}

            {/* Image Upload */}
            <div className="form-group">
              <label>Product Photo</label>
              <div style={{ display:'flex', alignItems:'center', gap:14, marginBottom:6 }}>
                <div style={{
                  width:80, height:80, borderRadius:10, border:'2px dashed #c8e6c9',
                  overflow:'hidden', display:'flex', alignItems:'center', justifyContent:'center',
                  background:'#f9fbf9', flexShrink:0, fontSize:32
                }}>
                  {imagePreview
                    ? <img src={imagePreview} alt="preview" style={{ width:'100%', height:'100%', objectFit:'cover' }} />
                    : '📷'}
                </div>
                <div style={{ flex:1 }}>
                  <button type="button" className="btn btn-secondary btn-sm"
                    onClick={() => fileRef.current.click()}>
                    📁 Choose Photo
                  </button>
                  <input
                    ref={fileRef} type="file" accept="image/jpeg,image/png,image/webp"
                    style={{ display:'none' }} onChange={handleImageFile}
                  />
                  <p style={{ fontSize:12, color:'var(--text-light)', marginTop:6 }}>
                    JPG, PNG, WebP — max 2MB
                  </p>
                  {imagePreview && (
                    <button type="button" className="btn btn-danger btn-sm" style={{ marginTop:4 }}
                      onClick={() => { setImagePreview(''); setImageFile(null); if(fileRef.current) fileRef.current.value=''; }}>
                      ✕ Remove photo
                    </button>
                  )}
                </div>
              </div>
            </div>

            <div className="form-group">
              <label>Flower Name *</label>
              <input name="name" value={form.name} onChange={ch} placeholder="e.g. Rose Petals – 250gm" />
            </div>

            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
              <div className="form-group">
                <label>Price (₹) *</label>
                <input name="price" type="number" value={form.price} onChange={ch} placeholder="58" min="0.01" step="0.01" />
              </div>
              <div className="form-group">
                <label>Stock (qty) *</label>
                <input name="stock" type="number" value={form.stock} onChange={ch} placeholder="150" min="0" />
              </div>
            </div>

            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
              <div className="form-group">
                <label>Unit (sold per…)</label>
                <select name="unit" value={form.unit} onChange={ch}>
                  {UNITS.map(u => <option key={u} value={u}>{u}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label>Category</label>
                <select name="category" value={form.category} onChange={ch}>
                  {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
            </div>

            <div className="form-group">
              <label>Description</label>
              <textarea name="description" value={form.description} onChange={ch}
                rows={2} style={{ resize:'vertical' }}
                placeholder="e.g. Fresh rose petals for daily puja, 250gm packet" />
            </div>

            <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:16 }}>
              <input type="checkbox" name="available" id="avail" checked={form.available} onChange={ch} />
              <label htmlFor="avail" style={{ marginBottom:0, cursor:'pointer' }}>Visible to customers</label>
            </div>

            <div style={{ display:'flex', gap:10, justifyContent:'flex-end' }}>
              <button className="btn btn-secondary" onClick={() => { setModal(false); setMsg(''); }}>Cancel</button>
              <button className="btn btn-primary" onClick={saveProduct} disabled={saving}>
                {saving ? '⏳ Saving…' : '✅ Save Flower'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Quick Price Update Modal ── */}
      {priceModal && (
        <div className="modal-backdrop" onClick={() => setPriceModal(null)}>
          <div className="modal-box" style={{ maxWidth:360 }} onClick={e => e.stopPropagation()}>
            <h2>₹ Update Today's Price</h2>
            <div style={{ display:'flex', alignItems:'center', gap:12, background:'#f0f8f0', borderRadius:8, padding:'12px 14px', marginBottom:16 }}>
              <ProductImage product={priceModal} size={44} />
              <div>
                <div style={{ fontWeight:600 }}>{priceModal.name}</div>
                <div style={{ fontSize:13, color:'var(--text-mid)' }}>Current: ₹{priceModal.price} per {priceModal.unit}</div>
              </div>
            </div>
            <div className="form-group">
              <label>New Price (₹) per {priceModal.unit}</label>
              <input type="number" value={newPrice} onChange={e => setNewPrice(e.target.value)}
                min="0.01" step="0.01" placeholder="Enter new price" autoFocus />
            </div>
            <div style={{ display:'flex', gap:10, justifyContent:'flex-end' }}>
              <button className="btn btn-secondary" onClick={() => setPriceModal(null)}>Cancel</button>
              <button className="btn btn-primary" onClick={updateDailyPrice}>✅ Update Price</button>
            </div>
          </div>
        </div>
      )}

      {/* ── Quick Stock Update Modal ── */}
      {stockModal && (
        <div className="modal-backdrop" onClick={() => setStockModal(null)}>
          <div className="modal-box" style={{ maxWidth:360 }} onClick={e => e.stopPropagation()}>
            <h2>📦 Update Stock</h2>
            <div style={{ display:'flex', alignItems:'center', gap:12, background:'#f0f8f0', borderRadius:8, padding:'12px 14px', marginBottom:16 }}>
              <ProductImage product={stockModal} size={44} />
              <div>
                <div style={{ fontWeight:600 }}>{stockModal.name}</div>
                <div style={{ fontSize:13, color:'var(--text-mid)' }}>Current stock: {stockModal.stock}</div>
              </div>
            </div>
            <div className="form-group">
              <label>New Stock Quantity</label>
              <input type="number" value={newStock} onChange={e => setNewStock(e.target.value)}
                min="0" placeholder="Enter new stock count" autoFocus />
            </div>
            <div style={{ display:'flex', gap:10, justifyContent:'flex-end' }}>
              <button className="btn btn-secondary" onClick={() => setStockModal(null)}>Cancel</button>
              <button className="btn btn-primary" onClick={updateStock}>✅ Update Stock</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}