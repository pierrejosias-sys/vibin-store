'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter, useParams } from 'next/navigation'
import { supabase } from '../../../../lib/supabase'

const CATEGORIES = ['tops', 'bottoms', 'accessories', 'outerwear', 'footwear', 'headwear']
const ALL_SIZES = ['XS', 'S', 'M', 'L', 'XL', 'XXL']

function slugify(str) {
  return str.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
}

export default function EditProductPage() {
  const router = useRouter()
  const params = useParams()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(null)
  const [form, setForm] = useState(null)

  useEffect(() => { fetchProduct() }, [params.id])

  async function fetchProduct() {
    const { data } = await supabase.from('products').select('*').eq('id', params.id).single()
    if (data) {
      setForm({
        ...data,
        price: String(data.price),
        compare_price: data.compare_price ? String(data.compare_price) : '',
        stock_qty: String(data.stock_qty ?? 0),
        sizes: data.sizes || ALL_SIZES,
        tags: data.tags || [],
        image_url: data.image_url || '',
      })
    }
    setLoading(false)
  }

  function handleChange(field, value) {
    setForm(prev => ({ ...prev, [field]: value }))
  }

  function toggleSize(size) {
    setForm(prev => ({
      ...prev,
      sizes: prev.sizes.includes(size) ? prev.sizes.filter(s => s !== size) : [...prev.sizes, size]
    }))
  }

  function toggleTag(tag) {
    setForm(prev => ({
      ...prev,
      tags: prev.tags.includes(tag) ? prev.tags.filter(t => t !== tag) : [...prev.tags, tag]
    }))
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setError(null)
    if (!form.name || !form.slug || !form.price) { setError('Name, slug, and price are required.'); return }
    setSaving(true)
    const payload = {
      name: form.name.trim(),
      slug: form.slug.trim(),
      description: form.description?.trim() || null,
      price: parseFloat(form.price),
      compare_price: form.compare_price ? parseFloat(form.compare_price) : null,
      category: form.category || null,
      color: form.color || null,
      image_url: form.image_url?.trim() || null,
      stock_qty: parseInt(form.stock_qty) || 0,
      in_stock: form.in_stock,
      is_featured: form.is_featured,
      tags: form.tags,
      sizes: form.sizes,
    }
    const { error: err } = await supabase.from('products').update(payload).eq('id', params.id)
    if (err) { setError(err.message); setSaving(false); return }
    router.push('/admin/products')
  }

  const inputStyle = {
    width: '100%', background: '#111', border: '1px solid #1e1e1e', borderRadius: '8px',
    padding: '10px 14px', color: '#e0e0e0', fontSize: '13px', outline: 'none',
    fontFamily: 'JetBrains Mono, monospace', boxSizing: 'border-box'
  }
  const labelStyle = { fontSize: '11px', color: '#666', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: '6px', display: 'block' }

  if (loading) return <div style={{ minHeight: '100vh', background: '#0a0a0a', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#555', fontFamily: 'JetBrains Mono, monospace', fontSize: '13px', letterSpacing: '0.1em' }}>LOADING...</div>
  if (!form) return <div style={{ minHeight: '100vh', background: '#0a0a0a', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#dd6974', fontFamily: 'JetBrains Mono, monospace' }}>Product not found. <Link href="/admin/products" style={{ color: '#01696f', marginLeft: '8px' }}>← Back</Link></div>

  return (
    <div style={{ minHeight: '100vh', background: '#0a0a0a', color: '#e0e0e0', fontFamily: 'JetBrains Mono, monospace' }}>
      <div style={{ borderBottom: '1px solid #1e1e1e', padding: '20px 32px', display: 'flex', alignItems: 'center', gap: '16px' }}>
        <Link href="/admin/products" style={{ color: '#666', textDecoration: 'none', fontSize: '13px' }}>← Products</Link>
        <span style={{ color: '#333' }}>/</span>
        <span style={{ fontSize: '14px', fontWeight: '600' }}>Edit: {form.name}</span>
      </div>

      <div style={{ maxWidth: '760px', margin: '0 auto', padding: '40px 32px' }}>
        <form onSubmit={handleSubmit}>
          {error && <div style={{ background: '#2e1a1a', border: '1px solid #dd6974', color: '#dd6974', borderRadius: '8px', padding: '12px 16px', fontSize: '13px', marginBottom: '24px' }}>⚠ {error}</div>}

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '20px' }}>
            <div>
              <label style={labelStyle}>Product Name *</label>
              <input style={inputStyle} value={form.name} onChange={e => handleChange('name', e.target.value)} required />
            </div>
            <div>
              <label style={labelStyle}>Slug *</label>
              <input style={inputStyle} value={form.slug} onChange={e => handleChange('slug', e.target.value)} required />
              <div style={{ fontSize: '11px', color: '#555', marginTop: '4px' }}>/product/{form.slug}</div>
            </div>
          </div>

          <div style={{ marginBottom: '20px' }}>
            <label style={labelStyle}>Description</label>
            <textarea style={{ ...inputStyle, minHeight: '100px', resize: 'vertical', lineHeight: '1.6' }} value={form.description || ''} onChange={e => handleChange('description', e.target.value)} />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '20px' }}>
            <div>
              <label style={labelStyle}>Price *</label>
              <input style={inputStyle} type="number" step="0.01" min="0" value={form.price} onChange={e => handleChange('price', e.target.value)} required />
            </div>
            <div>
              <label style={labelStyle}>Compare Price</label>
              <input style={inputStyle} type="number" step="0.01" min="0" value={form.compare_price} onChange={e => handleChange('compare_price', e.target.value)} />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '20px' }}>
            <div>
              <label style={labelStyle}>Category</label>
              <select style={{ ...inputStyle, cursor: 'pointer' }} value={form.category || ''} onChange={e => handleChange('category', e.target.value)}>
                <option value="">Select category...</option>
                {CATEGORIES.map(c => <option key={c} value={c}>{c.charAt(0).toUpperCase() + c.slice(1)}</option>)}
              </select>
            </div>
            <div>
              <label style={labelStyle}>Primary Color</label>
              <input style={inputStyle} value={form.color || ''} onChange={e => handleChange('color', e.target.value)} placeholder="Black" />
            </div>
          </div>

          <div style={{ marginBottom: '20px' }}>
            <label style={labelStyle}>Image URL</label>
            <input style={inputStyle} value={form.image_url} onChange={e => handleChange('image_url', e.target.value)} placeholder="https://..." />
            {form.image_url && (
              <div style={{ marginTop: '10px', width: '100px', height: '100px', borderRadius: '8px', overflow: 'hidden', border: '1px solid #1e1e1e' }}>
                <img src={form.image_url} alt="Preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} onError={e => e.target.style.display = 'none'} />
              </div>
            )}
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '20px' }}>
            <div>
              <label style={labelStyle}>Stock Quantity</label>
              <input style={inputStyle} type="number" min="0" value={form.stock_qty} onChange={e => handleChange('stock_qty', e.target.value)} />
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', paddingTop: '20px' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer', fontSize: '13px' }}>
                <input type="checkbox" checked={form.in_stock} onChange={e => handleChange('in_stock', e.target.checked)} style={{ accentColor: '#01696f', width: '16px', height: '16px' }} />
                In Stock (visible in shop)
              </label>
              <label style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer', fontSize: '13px' }}>
                <input type="checkbox" checked={form.is_featured || false} onChange={e => handleChange('is_featured', e.target.checked)} style={{ accentColor: '#01696f', width: '16px', height: '16px' }} />
                Featured Product
              </label>
            </div>
          </div>

          <div style={{ marginBottom: '20px' }}>
            <label style={labelStyle}>Available Sizes</label>
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
              {ALL_SIZES.map(size => (
                <button key={size} type="button" onClick={() => toggleSize(size)}
                  style={{ padding: '6px 16px', borderRadius: '6px', fontSize: '12px', fontWeight: '600', cursor: 'pointer', fontFamily: 'inherit', background: form.sizes?.includes(size) ? '#01696f' : '#1e1e1e', color: form.sizes?.includes(size) ? '#fff' : '#666', border: `1px solid ${form.sizes?.includes(size) ? '#01696f' : '#2e2e2e'}` }}
                >{size}</button>
              ))}
            </div>
          </div>

          <div style={{ marginBottom: '32px' }}>
            <label style={labelStyle}>Tags</label>
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
              {['new', 'sale', 'bestseller', 'limited', 'coming-soon'].map(tag => (
                <button key={tag} type="button" onClick={() => toggleTag(tag)}
                  style={{ padding: '5px 14px', borderRadius: '20px', fontSize: '11px', fontWeight: '600', cursor: 'pointer', fontFamily: 'inherit', letterSpacing: '0.05em', background: form.tags?.includes(tag) ? '#1a2433' : '#1e1e1e', color: form.tags?.includes(tag) ? '#5591c7' : '#555', border: `1px solid ${form.tags?.includes(tag) ? '#5591c7' : '#2e2e2e'}` }}
                >{tag}</button>
              ))}
            </div>
          </div>

          <div style={{ display: 'flex', gap: '12px' }}>
            <button type="submit" disabled={saving}
              style={{ background: '#01696f', color: '#fff', border: 'none', borderRadius: '8px', padding: '12px 32px', fontSize: '13px', fontWeight: '700', letterSpacing: '0.1em', cursor: 'pointer', fontFamily: 'inherit' }}
            >{saving ? 'SAVING...' : 'SAVE CHANGES'}</button>
            <Link href="/admin/products" style={{ background: '#1e1e1e', color: '#888', border: '1px solid #2e2e2e', borderRadius: '8px', padding: '12px 24px', fontSize: '13px', textDecoration: 'none', display: 'flex', alignItems: 'center' }}>Cancel</Link>
          </div>
        </form>
      </div>
    </div>
  )
}
