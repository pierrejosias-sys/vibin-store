'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { createBrowserClient } from '@supabase/ssr'

const supabase = createBrowserClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
)

const STATUS_FLOW = ['pending', 'paid', 'shipped', 'delivered', 'cancelled']
const STATUS_COLORS = {
  pending:   { bg: '#1a1a00', border: '#3a3a00', text: '#d4a017' },
  paid:      { bg: '#001a0a', border: '#003a15', text: '#22c55e' },
  shipped:   { bg: '#001020', border: '#003060', text: '#60a5fa' },
  delivered: { bg: '#0a1a00', border: '#1a3a00', text: '#86efac' },
  cancelled: { bg: '#1a0000', border: '#3a0000', text: '#f87171' },
}

export default function AdminOrders() {
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [expandedId, setExpandedId] = useState(null)
  const [trackingInputs, setTrackingInputs] = useState({})
  const [saving, setSaving] = useState({})
  const [toast, setToast] = useState(null)

  useEffect(() => { fetchOrders() }, [])

  async function fetchOrders() {
    setLoading(true)
    const { data, error } = await supabase
      .from('orders')
      .select('*')
      .order('created_at', { ascending: false })
    if (!error) setOrders(data || [])
    setLoading(false)
  }

  function showToast(msg, type = 'success') {
    setToast({ msg, type })
    setTimeout(() => setToast(null), 3000)
  }

  async function updateStatus(orderId, newStatus) {
    setSaving(s => ({ ...s, [orderId]: true }))
    const { error } = await supabase
      .from('orders')
      .update({ status: newStatus })
      .eq('id', orderId)
    if (!error) {
      setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status: newStatus } : o))
      showToast(`Order updated to ${newStatus}`)
    } else {
      showToast('Failed to update status', 'error')
    }
    setSaving(s => ({ ...s, [orderId]: false }))
  }

  async function saveTracking(orderId) {
    const tracking = trackingInputs[orderId] || ''
    if (!tracking.trim()) return
    setSaving(s => ({ ...s, [`track_${orderId}`]: true }))
    const { error } = await supabase
      .from('orders')
      .update({ tracking_number: tracking, status: 'shipped' })
      .eq('id', orderId)
    if (!error) {
      setOrders(prev => prev.map(o => o.id === orderId ? { ...o, tracking_number: tracking, status: 'shipped' } : o))
      showToast('Tracking saved — order marked shipped')
    } else {
      showToast('Failed to save tracking', 'error')
    }
    setSaving(s => ({ ...s, [`track_${orderId}`]: false }))
  }

  const filtered = orders.filter(o => {
    const matchStatus = statusFilter === 'all' || o.status === statusFilter
    const matchSearch = !search ||
      o.customer_email?.toLowerCase().includes(search.toLowerCase()) ||
      String(o.id).includes(search) ||
      o.order_number?.toLowerCase().includes(search.toLowerCase())
    return matchStatus && matchSearch
  })

  const stats = {
    total: orders.length,
    paid: orders.filter(o => o.status === 'paid').length,
    shipped: orders.filter(o => o.status === 'shipped').length,
    revenue: orders.filter(o => ['paid','shipped','delivered'].includes(o.status)).reduce((s, o) => s + (o.total || 0), 0),
  }

  const s = {
    page: { background: '#0a0a0a', minHeight: '100vh', color: '#f0ede6', fontFamily: 'Manrope, sans-serif' },
    mono: { fontFamily: 'JetBrains Mono, monospace' },
    anton: { fontFamily: 'Anton, sans-serif' },
    input: { background: '#111', border: '1px solid #2a2a2a', borderRadius: '6px', color: '#f0ede6', padding: '10px 14px', fontSize: '14px', fontFamily: 'Manrope, sans-serif', outline: 'none' },
    btn: (color = '#e05c2e') => ({ background: color, border: 'none', borderRadius: '4px', color: '#fff', padding: '8px 16px', fontSize: '12px', fontFamily: 'JetBrains Mono, monospace', letterSpacing: '.05em', textTransform: 'uppercase', cursor: 'pointer', fontWeight: 'bold' }),
  }

  return (
    <div style={s.page}>
      {/* Toast */}
      {toast && (
        <div style={{ position: 'fixed', top: '20px', right: '20px', zIndex: 9999, background: toast.type === 'error' ? '#3a0000' : '#003a15', border: `1px solid ${toast.type === 'error' ? '#f87171' : '#22c55e'}`, borderRadius: '8px', padding: '14px 20px', color: toast.type === 'error' ? '#f87171' : '#22c55e', ...s.mono, fontSize: '13px' }}>
          {toast.type === 'error' ? '✗' : '✓'} {toast.msg}
        </div>
      )}

      {/* Header */}
      <header style={{ padding: '20px 40px', borderBottom: '1px solid #1e1e1e', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
          <Link href="/admin" style={{ ...s.anton, fontSize: '28px', color: '#f0ede6', textDecoration: 'none' }}>VIBIN</Link>
          <span style={{ ...s.mono, fontSize: '11px', color: '#555', letterSpacing: '.15em', textTransform: 'uppercase' }}>/ Orders</span>
        </div>
        <button onClick={fetchOrders} style={s.btn('#333')}>↻ Refresh</button>
      </header>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: '1px', background: '#1e1e1e', borderBottom: '1px solid #1e1e1e' }}>
        {[
          { label: 'Total Orders', value: stats.total },
          { label: 'Awaiting Shipment', value: stats.paid },
          { label: 'Shipped', value: stats.shipped },
          { label: 'Revenue', value: `$${stats.revenue.toFixed(2)}` },
        ].map((stat, i) => (
          <div key={i} style={{ background: '#111', padding: '24px 30px' }}>
            <div style={{ ...s.mono, fontSize: '10px', color: '#555', letterSpacing: '.15em', textTransform: 'uppercase', marginBottom: '8px' }}>{stat.label}</div>
            <div style={{ ...s.anton, fontSize: '28px' }}>{stat.value}</div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div style={{ padding: '20px 40px', borderBottom: '1px solid #1e1e1e', display: 'flex', gap: '12px', flexWrap: 'wrap', alignItems: 'center' }}>
        <input
          placeholder="Search by email, order ID…"
          value={search}
          onChange={e => setSearch(e.target.value)}
          style={{ ...s.input, width: '280px' }}
        />
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          {['all', ...STATUS_FLOW].map(st => (
            <button key={st} onClick={() => setStatusFilter(st)} style={{
              ...s.btn(statusFilter === st ? '#e05c2e' : '#1a1a1a'),
              border: `1px solid ${statusFilter === st ? '#e05c2e' : '#2a2a2a'}`,
            }}>{st}</button>
          ))}
        </div>
      </div>

      {/* Orders */}
      <div style={{ padding: '30px 40px' }}>
        {loading ? (
          <div style={{ textAlign: 'center', padding: '60px', ...s.mono, color: '#555', fontSize: '13px', letterSpacing: '.1em' }}>Loading orders...</div>
        ) : filtered.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '60px', color: '#555' }}>
            <div style={{ fontSize: '40px', marginBottom: '16px' }}>📦</div>
            <p style={{ ...s.mono, fontSize: '13px', letterSpacing: '.1em' }}>No orders found.</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {filtered.map(order => {
              const sc = STATUS_COLORS[order.status] || STATUS_COLORS.pending
              const isExpanded = expandedId === order.id
              const items = Array.isArray(order.items) ? order.items : []
              return (
                <div key={order.id} style={{ background: '#111', border: '1px solid #1e1e1e', borderRadius: '10px', overflow: 'hidden' }}>
                  {/* Row */}
                  <div
                    onClick={() => setExpandedId(isExpanded ? null : order.id)}
                    style={{ padding: '16px 20px', display: 'grid', gridTemplateColumns: '1fr 2fr 1fr 1fr 1fr auto', gap: '16px', alignItems: 'center', cursor: 'pointer' }}
                  >
                    <div style={{ ...s.mono, fontSize: '12px', color: '#888' }}>#{String(order.id).slice(-6).toUpperCase()}</div>
                    <div>
                      <div style={{ fontSize: '14px', marginBottom: '2px' }}>{order.customer_email}</div>
                      {order.ambassador_code && <div style={{ ...s.mono, fontSize: '10px', color: '#e05c2e' }}>ref: {order.ambassador_code}</div>}
                    </div>
                    <div style={{ fontSize: '14px' }}>${(order.total || 0).toFixed(2)}</div>
                    <div style={{ ...s.mono, fontSize: '11px', color: '#555' }}>{new Date(order.created_at).toLocaleDateString()}</div>
                    <div>
                      <span style={{ display: 'inline-block', padding: '4px 10px', borderRadius: '100px', fontSize: '11px', ...s.mono, letterSpacing: '.08em', textTransform: 'uppercase', background: sc.bg, border: `1px solid ${sc.border}`, color: sc.text }}>
                        {order.status}
                      </span>
                    </div>
                    <div style={{ ...s.mono, fontSize: '18px', color: '#555', userSelect: 'none' }}>{isExpanded ? '▲' : '▼'}</div>
                  </div>

                  {/* Expanded detail */}
                  {isExpanded && (
                    <div style={{ borderTop: '1px solid #1e1e1e', padding: '20px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
                      {/* Items */}
                      <div>
                        <p style={{ ...s.mono, fontSize: '10px', color: '#555', letterSpacing: '.15em', textTransform: 'uppercase', marginBottom: '12px' }}>Items</p>
                        {items.length === 0 ? <p style={{ color: '#555', fontSize: '13px' }}>No item data</p> : items.map((item, i) => (
                          <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid #1a1a1a', fontSize: '14px' }}>
                            <span>{item.name} {item.color && `· ${item.color}`} {item.size && `/ ${item.size}`} × {item.qty}</span>
                            <span style={{ color: '#888' }}>${((item.price || 0) * (item.qty || 1)).toFixed(2)}</span>
                          </div>
                        ))}
                      </div>

                      {/* Controls */}
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                        {/* Status change */}
                        <div>
                          <p style={{ ...s.mono, fontSize: '10px', color: '#555', letterSpacing: '.15em', textTransform: 'uppercase', marginBottom: '10px' }}>Update Status</p>
                          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                            {STATUS_FLOW.filter(st => st !== order.status).map(st => (
                              <button
                                key={st}
                                onClick={() => updateStatus(order.id, st)}
                                disabled={saving[order.id]}
                                style={s.btn(STATUS_COLORS[st]?.text === '#22c55e' ? '#003a15' : STATUS_COLORS[st]?.bg || '#1a1a1a')}
                              >
                                → {st}
                              </button>
                            ))}
                          </div>
                        </div>

                        {/* Tracking */}
                        <div>
                          <p style={{ ...s.mono, fontSize: '10px', color: '#555', letterSpacing: '.15em', textTransform: 'uppercase', marginBottom: '10px' }}>Tracking Number</p>
                          {order.tracking_number && (
                            <p style={{ ...s.mono, fontSize: '12px', color: '#60a5fa', marginBottom: '8px' }}>Current: {order.tracking_number}</p>
                          )}
                          <div style={{ display: 'flex', gap: '8px' }}>
                            <input
                              placeholder="Enter tracking #"
                              value={trackingInputs[order.id] || ''}
                              onChange={e => setTrackingInputs(prev => ({ ...prev, [order.id]: e.target.value }))}
                              style={{ ...s.input, flex: 1, fontSize: '13px', padding: '8px 12px' }}
                            />
                            <button
                              onClick={() => saveTracking(order.id)}
                              disabled={saving[`track_${order.id}`]}
                              style={s.btn()}
                            >
                              {saving[`track_${order.id}`] ? '...' : 'Save'}
                            </button>
                          </div>
                        </div>

                        {/* Commission info */}
                        {order.ambassador_code && (
                          <div style={{ background: '#0d0d0d', border: '1px solid #2a1a00', borderRadius: '6px', padding: '12px' }}>
                            <p style={{ ...s.mono, fontSize: '10px', color: '#e05c2e', letterSpacing: '.15em', textTransform: 'uppercase', marginBottom: '6px' }}>Ambassador Commission</p>
                            <p style={{ fontSize: '20px', ...s.anton }}>$ {(order.commission_amount || 0).toFixed(2)}</p>
                            <p style={{ ...s.mono, fontSize: '11px', color: '#555', marginTop: '4px' }}>Code: {order.ambassador_code} · Status: {order.commission_status || 'pending'}</p>
                          </div>
                        )}

                        {/* Shipping address */}
                        {order.shipping_address && (
                          <div>
                            <p style={{ ...s.mono, fontSize: '10px', color: '#555', letterSpacing: '.15em', textTransform: 'uppercase', marginBottom: '8px' }}>Ship To</p>
                            <p style={{ fontSize: '13px', color: '#aaa', lineHeight: '1.6' }}>
                              {order.shipping_address.name}<br />
                              {order.shipping_address.line1}<br />
                              {order.shipping_address.city}, {order.shipping_address.state} {order.shipping_address.postal_code}
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
