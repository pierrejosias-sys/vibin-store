'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createClient } from '../lib/supabase-browser'
import AIAssistant from '../../components/ai-assistant'

export default function AdminPage() {
  const router = useRouter()
  const supabase = createClient()

  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState({
    totalOrders: 0,
    totalRevenue: 0,
    pendingOrders: 0,
    shippedOrders: 0,
    deliveredOrders: 0,
    avgOrderValue: 0,
  })
  const [reviews, setReviews] = useState([])
  const [pendingVerifications, setPendingVerifications] = useState(0)
  const [page, setPage] = useState('dashboard')

  const fetchData = useCallback(async () => {
    setLoading(true)
    try {
      // Fetch real orders from Supabase
      const { data: ordersData, error: ordersError } = await supabase
        .from('orders')
        .select('id, guest_email, status, total, created_at, items')
        .order('created_at', { ascending: false })
        .limit(50)

      if (ordersError) throw ordersError

      const orderList = ordersData || []
      setOrders(orderList)

      // Derive stats from real data
      const totalRevenue = orderList.reduce((sum, o) => sum + (o.total || 0), 0)
      const pendingOrders = orderList.filter(o => o.status === 'pending').length
      const shippedOrders = orderList.filter(o => o.status === 'shipped').length
      const deliveredOrders = orderList.filter(o => o.status === 'delivered').length

      setStats({
        totalOrders: orderList.length,
        totalRevenue,
        pendingOrders,
        shippedOrders,
        deliveredOrders,
        avgOrderValue: orderList.length > 0 ? Math.round(totalRevenue / orderList.length) : 0,
      })

      // Fetch pending support verifications
      const { count } = await supabase
        .from('verification_requests')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'pending')
      if (count !== null) setPendingVerifications(count)

    } catch (err) {
      console.error('Admin fetch error:', err)
    } finally {
      setLoading(false)
    }
  }, [supabase])

  useEffect(() => {
    fetchData()
    // Hardcoded review samples (social proof — no DB table yet)
    setReviews([
      { platform: 'instagram', user: '@streetwear_joe', rating: 5, text: 'Best tee quality hands down 🔥', time: '2h ago' },
      { platform: 'tiktok', user: '@fashiondave', rating: 5, text: 'VIBIN different frfr', time: '5h ago' },
      { platform: 'google', user: 'Marcus R.', rating: 5, text: 'Exactly what I expected. Fire fits.', time: '1d ago' },
      { platform: 'instagram', user: '@atlanta_mike', rating: 4, text: 'Love the fit but shipping took forever', time: '2d ago' },
      { platform: 'tiktok', user: '@vibecheck', rating: 5, text: 'Ambassador program is crazy 🔥', time: '3d ago' },
      { platform: 'google', user: 'Jaylen T.', rating: 5, text: 'Already got my second order. VIBIN different.', time: '4d ago' },
    ])
  }, [fetchData])

  async function handleSignOut() {
    await supabase.auth.signOut()
    router.push('/admin/login')
    router.refresh()
  }

  async function updateOrderStatus(orderId, newStatus) {
    const { error } = await supabase
      .from('orders')
      .update({ status: newStatus })
      .eq('id', orderId)
    if (!error) {
      setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status: newStatus } : o))
      setStats(prev => ({
        ...prev,
        pendingOrders: orders.filter(o => o.status === 'pending' && o.id !== orderId).length + (newStatus === 'pending' ? 1 : 0),
        shippedOrders: orders.filter(o => o.status === 'shipped' && o.id !== orderId).length + (newStatus === 'shipped' ? 1 : 0),
        deliveredOrders: orders.filter(o => o.status === 'delivered' && o.id !== orderId).length + (newStatus === 'delivered' ? 1 : 0),
      }))
    }
  }

  const platformIcons = { instagram: '📸', tiktok: '🎵', google: '🔍', facebook: '👤', twitter: '🐦' }
  const formatCurrency = (num) => '$' + Number(num || 0).toLocaleString()

  return (
    <div className="admin-page">
      <div className="admin-sidebar">
        <div className="admin-logo">VIBIN</div>
        <nav className="admin-nav">
          <button className={`admin-nav-link ${page === 'dashboard' ? 'on' : ''}`} onClick={() => setPage('dashboard')}>Dashboard</button>
          <button className={`admin-nav-link ${page === 'orders' ? 'on' : ''}`} onClick={() => setPage('orders')}>Orders</button>
          <button className={`admin-nav-link ${page === 'reviews' ? 'on' : ''}`} onClick={() => setPage('reviews')}>Reviews</button>
          <Link href="/admin/support" className="admin-nav-link" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            Support
            {pendingVerifications > 0 && (
              <span style={{
                background: 'var(--coral, #ff6b6b)',
                color: 'white',
                borderRadius: '50%',
                width: '20px',
                height: '20px',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '11px',
                fontWeight: 'bold'
              }}>{pendingVerifications}</span>
            )}
          </Link>
          <Link href="/" className="admin-nav-link">View Store</Link>
          <button className="admin-nav-link" onClick={handleSignOut} style={{ marginTop: 'auto', color: '#ff6b6b' }}>Sign Out</button>
        </nav>
      </div>

      <div className="admin-content">
        {page === 'dashboard' && (
          <>
            <div className="admin-header">
              <h1 className="admin-title">Dashboard</h1>
              <button onClick={fetchData} style={{ color: '#888', fontSize: '14px', background: 'none', border: 'none', cursor: 'pointer' }}>
                {loading ? 'Loading...' : '↻ Refresh'}
              </button>
            </div>

            <div className="admin-stats">
              <div className="admin-stat">
                <div className="admin-stat-label">Total Orders</div>
                <div className="admin-stat-value">{stats.totalOrders}</div>
              </div>
              <div className="admin-stat">
                <div className="admin-stat-label">Revenue</div>
                <div className="admin-stat-value">{formatCurrency(stats.totalRevenue)}</div>
              </div>
              <div className="admin-stat" style={{ background: '#fff3cd' }}>
                <div className="admin-stat-label">Pending Fulfillment</div>
                <div className="admin-stat-value">{stats.pendingOrders}</div>
              </div>
              <div className="admin-stat">
                <div className="admin-stat-label">Shipped</div>
                <div className="admin-stat-value">{stats.shippedOrders}</div>
              </div>
              <div className="admin-stat">
                <div className="admin-stat-label">Avg Order Value</div>
                <div className="admin-stat-value">{formatCurrency(stats.avgOrderValue)}</div>
              </div>
              <div className="admin-stat">
                <div className="admin-stat-label">Delivered</div>
                <div className="admin-stat-value">{stats.deliveredOrders}</div>
              </div>
            </div>

            <div className="admin-card">
              <h3 className="admin-card-title">Recent Orders</h3>
              {loading ? (
                <p style={{ color: '#888' }}>Loading orders…</p>
              ) : orders.length === 0 ? (
                <p style={{ color: '#888' }}>No orders yet.</p>
              ) : (
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid #eee' }}>
                      {['Order', 'Customer', 'Status', 'Total', 'Date', 'Action'].map(h => (
                        <th key={h} style={{ textAlign: 'left', padding: '8px 12px', fontSize: '12px', color: '#888', fontWeight: '600' }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {orders.slice(0, 10).map(order => (
                      <tr key={order.id} style={{ borderBottom: '1px solid #f5f5f5' }}>
                        <td style={{ padding: '10px 12px', fontSize: '13px', fontWeight: '600' }}>{String(order.id).slice(0, 8).toUpperCase()}</td>
                        <td style={{ padding: '10px 12px', fontSize: '13px', color: '#666' }}>{order.guest_email || '—'}</td>
                        <td style={{ padding: '10px 12px' }}>
                          <span style={{
                            background: order.status === 'pending' ? '#fff3cd' : order.status === 'shipped' ? '#cce5ff' : '#d4edda',
                            color: order.status === 'pending' ? '#856404' : order.status === 'shipped' ? '#004085' : '#155724',
                            padding: '2px 10px',
                            borderRadius: '12px',
                            fontSize: '11px',
                            fontWeight: '600',
                            textTransform: 'uppercase',
                          }}>{order.status}</span>
                        </td>
                        <td style={{ padding: '10px 12px', fontSize: '13px', fontWeight: '600' }}>{formatCurrency(order.total)}</td>
                        <td style={{ padding: '10px 12px', fontSize: '12px', color: '#888' }}>{new Date(order.created_at).toLocaleDateString()}</td>
                        <td style={{ padding: '10px 12px' }}>
                          <select
                            value={order.status}
                            onChange={e => updateOrderStatus(order.id, e.target.value)}
                            style={{ fontSize: '12px', padding: '4px 8px', borderRadius: '6px', border: '1px solid #ddd', cursor: 'pointer' }}
                          >
                            <option value="pending">Pending</option>
                            <option value="shipped">Shipped</option>
                            <option value="delivered">Delivered</option>
                            <option value="cancelled">Cancelled</option>
                          </select>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </>
        )}

        {page === 'orders' && (
          <>
            <div className="admin-header">
              <h1 className="admin-title">All Orders</h1>
              <button onClick={fetchData} style={{ color: '#888', fontSize: '14px', background: 'none', border: 'none', cursor: 'pointer' }}>
                {loading ? 'Loading...' : '↻ Refresh'}
              </button>
            </div>
            <div className="admin-card">
              {loading ? (
                <p style={{ color: '#888' }}>Loading orders…</p>
              ) : orders.length === 0 ? (
                <p style={{ color: '#888' }}>No orders yet.</p>
              ) : (
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid #eee' }}>
                      {['Order', 'Customer', 'Status', 'Items', 'Total', 'Date', 'Action'].map(h => (
                        <th key={h} style={{ textAlign: 'left', padding: '8px 12px', fontSize: '12px', color: '#888', fontWeight: '600' }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {orders.map(order => (
                      <tr key={order.id} style={{ borderBottom: '1px solid #f5f5f5' }}>
                        <td style={{ padding: '10px 12px', fontSize: '13px', fontWeight: '600' }}>{String(order.id).slice(0, 8).toUpperCase()}</td>
                        <td style={{ padding: '10px 12px', fontSize: '13px', color: '#666' }}>{order.guest_email || '—'}</td>
                        <td style={{ padding: '10px 12px' }}>
                          <span style={{
                            background: order.status === 'pending' ? '#fff3cd' : order.status === 'shipped' ? '#cce5ff' : '#d4edda',
                            color: order.status === 'pending' ? '#856404' : order.status === 'shipped' ? '#004085' : '#155724',
                            padding: '2px 10px',
                            borderRadius: '12px',
                            fontSize: '11px',
                            fontWeight: '600',
                            textTransform: 'uppercase',
                          }}>{order.status}</span>
                        </td>
                        <td style={{ padding: '10px 12px', fontSize: '13px', color: '#666' }}>{order.items ?? '—'}</td>
                        <td style={{ padding: '10px 12px', fontSize: '13px', fontWeight: '600' }}>{formatCurrency(order.total)}</td>
                        <td style={{ padding: '10px 12px', fontSize: '12px', color: '#888' }}>{new Date(order.created_at).toLocaleDateString()}</td>
                        <td style={{ padding: '10px 12px' }}>
                          <select
                            value={order.status}
                            onChange={e => updateOrderStatus(order.id, e.target.value)}
                            style={{ fontSize: '12px', padding: '4px 8px', borderRadius: '6px', border: '1px solid #ddd', cursor: 'pointer' }}
                          >
                            <option value="pending">Pending</option>
                            <option value="shipped">Shipped</option>
                            <option value="delivered">Delivered</option>
                            <option value="cancelled">Cancelled</option>
                          </select>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </>
        )}

        {page === 'reviews' && (
          <>
            <div className="admin-header">
              <h1 className="admin-title">Reviews</h1>
            </div>
            <div style={{ display: 'grid', gap: '16px' }}>
              {reviews.map((review, i) => (
                <div key={i} className="admin-card" style={{ padding: '20px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '10px' }}>
                    <span style={{ fontSize: '20px' }}>{platformIcons[review.platform]}</span>
                    <span style={{ fontWeight: '600', fontSize: '14px' }}>{review.user}</span>
                    <span style={{ color: '#fbbf24', fontSize: '13px' }}>{'★'.repeat(review.rating)}</span>
                    <span style={{ color: '#aaa', fontSize: '12px', marginLeft: 'auto' }}>{review.time}</span>
                  </div>
                  <p style={{ color: '#555', fontSize: '14px', margin: 0 }}>{review.text}</p>
                </div>
              ))}
            </div>
          </>
        )}
      </div>

      <AIAssistant />
    </div>
  )
}
