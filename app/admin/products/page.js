'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { supabase } from '../../lib/supabase'

export default function AdminProductsPage() {
  const router = useRouter()
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [deleting, setDeleting] = useState(null)
  const [toast, setToast] = useState(null)

  useEffect(() => { fetchProducts() }, [])

  async function fetchProducts() {
    setLoading(true)
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .order('created_at', { ascending: false })
    if (!error && data) setProducts(data)
    setLoading(false)
  }

  async function toggleStock(product) {
    const { error } = await supabase
      .from('products')
      .update({ in_stock: !product.in_stock })
      .eq('id', product.id)
    if (!error) {
      setProducts(prev => prev.map(p => p.id === product.id ? { ...p, in_stock: !p.in_stock } : p))
      showToast(`${product.name} marked as ${!product.in_stock ? 'In Stock' : 'Out of Stock'}`)
    }
  }

  async function deleteProduct(product) {
    if (!confirm(`Delete "${product.name}"? This cannot be undone.`)) return
    setDeleting(product.id)
    const { error } = await supabase.from('products').delete().eq('id', product.id)
    if (!error) {
      setProducts(prev => prev.filter(p => p.id !== product.id))
      showToast(`"${product.name}" deleted`)
    }
    setDeleting(null)
  }

  function showToast(msg) {
    setToast(msg)
    setTimeout(() => setToast(null), 3000)
  }

  const filtered = products.filter(p =>
    p.name?.toLowerCase().includes(search.toLowerCase()) ||
    p.category?.toLowerCase().includes(search.toLowerCase()) ||
    p.slug?.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div style={{ minHeight: '100vh', background: '#0a0a0a', color: '#e0e0e0', fontFamily: 'JetBrains Mono, monospace' }}>

      {/* Toast */}
      {toast && (
        <div style={{ position: 'fixed', bottom: '24px', right: '24px', background: '#01696f', color: '#fff', padding: '12px 20px', borderRadius: '8px', fontSize: '13px', zIndex: 9999, boxShadow: '0 4px 20px rgba(0,0,0,0.4)' }}>
          ✓ {toast}
        </div>
      )}

      {/* Header */}
      <div style={{ borderBottom: '1px solid #1e1e1e', padding: '20px 32px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <Link href="/admin" style={{ color: '#666', textDecoration: 'none', fontSize: '13px' }}>← Admin</Link>
          <span style={{ color: '#333' }}>/</span>
          <span style={{ fontSize: '14px', fontWeight: '600', color: '#e0e0e0' }}>Products</span>
        </div>
        <Link
          href="/admin/products/new"
          style={{ background: '#01696f', color: '#fff', padding: '8px 20px', borderRadius: '6px', textDecoration: 'none', fontSize: '13px', fontWeight: '600', letterSpacing: '0.05em' }}
        >
          + New Product
        </Link>
      </div>

      <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '32px' }}>

        {/* Stats row */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px', marginBottom: '32px' }}>
          {[
            { label: 'Total Products', value: products.length },
            { label: 'In Stock', value: products.filter(p => p.in_stock).length },
            { label: 'Out of Stock', value: products.filter(p => !p.in_stock).length },
            { label: 'Categories', value: [...new Set(products.map(p => p.category).filter(Boolean))].length },
          ].map(stat => (
            <div key={stat.label} style={{ background: '#111', border: '1px solid #1e1e1e', borderRadius: '10px', padding: '20px' }}>
              <div style={{ fontSize: '24px', fontWeight: '700', color: '#fff', marginBottom: '4px' }}>{stat.value}</div>
              <div style={{ fontSize: '11px', color: '#666', letterSpacing: '0.1em', textTransform: 'uppercase' }}>{stat.label}</div>
            </div>
          ))}
        </div>

        {/* Search */}
        <div style={{ marginBottom: '20px' }}>
          <input
            type="text"
            placeholder="Search by name, category, or slug..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            style={{ width: '100%', background: '#111', border: '1px solid #1e1e1e', borderRadius: '8px', padding: '10px 16px', color: '#e0e0e0', fontSize: '13px', outline: 'none', boxSizing: 'border-box' }}
          />
        </div>

        {/* Table */}
        {loading ? (
          <div style={{ textAlign: 'center', padding: '60px', color: '#555', fontSize: '13px', letterSpacing: '0.1em' }}>LOADING PRODUCTS...</div>
        ) : filtered.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '60px', color: '#555' }}>
            <div style={{ fontSize: '32px', marginBottom: '12px' }}>📦</div>
            <div style={{ fontSize: '14px', marginBottom: '8px', color: '#888' }}>No products found</div>
            <Link href="/admin/products/new" style={{ color: '#01696f', fontSize: '13px' }}>Add your first product →</Link>
          </div>
        ) : (
          <div style={{ background: '#111', border: '1px solid #1e1e1e', borderRadius: '10px', overflow: 'hidden' }}>
            {/* Table header */}
            <div style={{ display: 'grid', gridTemplateColumns: '60px 1fr 120px 100px 100px 80px 160px', padding: '12px 20px', borderBottom: '1px solid #1e1e1e', fontSize: '11px', color: '#555', letterSpacing: '0.1em', textTransform: 'uppercase' }}>
              <div>Img</div>
              <div>Product</div>
              <div>Category</div>
              <div>Price</div>
              <div>Stock Qty</div>
              <div>Status</div>
              <div style={{ textAlign: 'right' }}>Actions</div>
            </div>

            {/* Rows */}
            {filtered.map((product, i) => (
              <div
                key={product.id}
                style={{
                  display: 'grid',
                  gridTemplateColumns: '60px 1fr 120px 100px 100px 80px 160px',
                  padding: '14px 20px',
                  borderBottom: i < filtered.length - 1 ? '1px solid #1a1a1a' : 'none',
                  alignItems: 'center',
                  transition: 'background 0.15s'
                }}
                onMouseEnter={e => e.currentTarget.style.background = '#141414'}
                onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
              >
                {/* Image */}
                <div style={{ width: '44px', height: '44px', borderRadius: '6px', overflow: 'hidden', background: '#1e1e1e', flexShrink: 0 }}>
                  {product.image_url ? (
                    <img src={product.image_url} alt={product.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  ) : (
                    <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '18px' }}>👕</div>
                  )}
                </div>

                {/* Name + slug */}
                <div style={{ paddingLeft: '4px' }}>
                  <div style={{ fontSize: '13px', fontWeight: '600', color: '#fff', marginBottom: '3px' }}>{product.name}</div>
                  <div style={{ fontSize: '11px', color: '#555' }}>/product/{product.slug || product.id}</div>
                </div>

                {/* Category */}
                <div style={{ fontSize: '12px', color: '#888' }}>
                  {product.category ? (
                    <span style={{ background: '#1e1e1e', padding: '3px 8px', borderRadius: '20px', textTransform: 'capitalize' }}>{product.category}</span>
                  ) : '—'}
                </div>

                {/* Price */}
                <div>
                  <div style={{ fontSize: '13px', fontWeight: '600', color: '#fff' }}>${Number(product.price).toFixed(2)}</div>
                  {product.compare_price && (
                    <div style={{ fontSize: '11px', color: '#555', textDecoration: 'line-through' }}>${Number(product.compare_price).toFixed(2)}</div>
                  )}
                </div>

                {/* Stock qty */}
                <div style={{ fontSize: '13px', color: product.stock_qty > 10 ? '#6daa45' : product.stock_qty > 0 ? '#e8af34' : '#dd6974' }}>
                  {product.stock_qty}
                </div>

                {/* In stock toggle */}
                <div>
                  <button
                    onClick={() => toggleStock(product)}
                    style={{
                      background: product.in_stock ? '#1a2e1a' : '#2e1a1a',
                      color: product.in_stock ? '#6daa45' : '#dd6974',
                      border: `1px solid ${product.in_stock ? '#6daa45' : '#dd6974'}`,
                      borderRadius: '20px', padding: '3px 10px', fontSize: '11px',
                      cursor: 'pointer', fontWeight: '600', letterSpacing: '0.05em',
                      fontFamily: 'inherit'
                    }}
                  >
                    {product.in_stock ? 'Live' : 'Off'}
                  </button>
                </div>

                {/* Actions */}
                <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                  <Link
                    href={`/product/${product.slug || product.id}`}
                    target="_blank"
                    style={{ background: '#1e1e1e', color: '#888', border: '1px solid #2e2e2e', borderRadius: '6px', padding: '5px 10px', fontSize: '11px', textDecoration: 'none', cursor: 'pointer' }}
                  >
                    View
                  </Link>
                  <Link
                    href={`/admin/products/${product.id}/edit`}
                    style={{ background: '#1a2433', color: '#5591c7', border: '1px solid #5591c7', borderRadius: '6px', padding: '5px 10px', fontSize: '11px', textDecoration: 'none', cursor: 'pointer' }}
                  >
                    Edit
                  </Link>
                  <button
                    onClick={() => deleteProduct(product)}
                    disabled={deleting === product.id}
                    style={{ background: '#2e1a1a', color: '#dd6974', border: '1px solid #dd6974', borderRadius: '6px', padding: '5px 10px', fontSize: '11px', cursor: 'pointer', fontFamily: 'inherit' }}
                  >
                    {deleting === product.id ? '...' : 'Del'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
