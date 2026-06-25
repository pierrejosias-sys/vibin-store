'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import supabase from '../lib/supabase-public'
import styles from '../styles.css'
import AIAssistant from '../../components/ai-assistant'

export default function AdminPage() {
  const router = useRouter();

  useEffect(() => {
    async function checkAdminAuth() {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        router.push('/admin/login');
        return;
      }
      const { data: profile } = await supabase
        .from('profiles')
        .select('is_admin')
        .eq('id', session.user.id)
        .single();
      if (!profile?.is_admin) {
        await supabase.auth.signOut();
        router.push('/admin/login');
      }
    }
    checkAdminAuth();
  }, [router]);

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

  useEffect(() => {
    fetchData()
    fetchPendingVerifications()
  }, [])

  async function fetchPendingVerifications() {
    try {
      const { count } = await supabase
        .from('verification_requests')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'pending')
      if (count !== null) setPendingVerifications(count)
    } catch (e) {
      console.log('Error fetching pending verifications:', e)
    }
  }

  async function fetchData() {
    setLoading(true)
    try {
      // Fetch all orders
      const { data: allOrders, error } = await supabase
        .from('orders')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) throw error

      const orderList = allOrders || []
      setOrders(orderList)

      // Compute stats from real data
      const totalOrders = orderList.length
      const totalRevenue = orderList
        .filter(o => o.status !== 'cancelled')
        .reduce((sum, o) => sum + (parseFloat(o.total) || 0), 0)
      const pendingOrders = orderList.filter(o => o.status === 'pending' || o.status === 'paid').length
      const shippedOrders = orderList.filter(o => o.status === 'shipped').length
      const deliveredOrders = orderList.filter(o => o.status === 'delivered').length
      const avgOrderValue = totalOrders > 0 ? Math.round(totalRevenue / totalOrders) : 0

      setStats({
        totalOrders,
        totalRevenue: Math.round(totalRevenue),
        pendingOrders,
        shippedOrders,
        deliveredOrders,
        avgOrderValue,
      })
    } catch (e) {
      console.error('Error fetching orders:', e)
    }

    // Reviews are external (Instagram/TikTok/Google) — keep as curated display
    setReviews([
      { platform: 'instagram', user: '@streetwear_joe', rating: 5, text: 'Best tee quality hands down 🔥', time: '2h ago' },
      { platform: 'tiktok', user: '@fashiondave', rating: 5, text: 'VIBIN different frfr', time: '5h ago' },
      { platform: 'google', user: 'Marcus R.', rating: 5, text: 'Exactly what I expected. Fire fits.', time: '1d ago' },
      { platform: 'instagram', user: '@atlanta_mike', rating: 4, text: 'Love the fit but shipping took forever', time: '2d ago' },
      { platform: 'tiktok', user: '@vibecheck', rating: 5, text: 'ambassador program is crazy 🔥', time: '3d ago' },
      { platform: 'google', user: 'Jaylen T.', rating: 5, text: 'Already got my second order. VIBIN different.', time: '4d ago' },
    ])

    setLoading(false)
  }

  async function handleSignOut() {
    await supabase.auth.signOut();
    router.push('/admin/login');
  }

  const platformIcons = {
    instagram: '📸',
    tiktok: '🎵',
    google: '🔍',
    facebook: '👤',
    twitter: '🐦'
  }

  const formatCurrency = (num) => '$' + Number(num).toLocaleString()
  const formatDate = (str) => str ? new Date(str).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '—'

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: styles }} />
      
      <div className="admin-page">
        <div className="admin-sidebar">
          <div className="admin-logo">VIBIN</div>
          <nav className="admin-nav">
             <a href="#" className={`admin-nav-link ${page === 'dashboard' ? 'on' : ''}`} onClick={() => setPage('dashboard')}>Dashboard</a>
             <a href="#" className={`admin-nav-link ${page === 'orders' ? 'on' : ''}`} onClick={() => setPage('orders')}>Orders</a>
             <a href="#" className={`admin-nav-link ${page === 'analytics' ? 'on' : ''}`} onClick={() => setPage('analytics')}>Analytics</a>
             <a href="#" className={`admin-nav-link ${page === 'reviews' ? 'on' : ''}`} onClick={() => setPage('reviews')}>Reviews</a>
             <Link href="/admin/payouts" className="admin-nav-link">Payouts</Link>
             <Link href="/admin/support" className="admin-nav-link" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
               Support Verification
               {pendingVerifications > 0 && (
                 <span style={{ 
                   background: 'var(--coral)', 
                   color: 'white', 
                   borderRadius: '50%', 
                   width: '20px', 
                   height: '20px', 
                   display: 'inline-flex', 
                   alignItems: 'center', 
                   justifyContent: 'center',
                   fontSize: '11px',
                   fontWeight: 'bold'
                 }}>
                   {pendingVerifications}
                 </span>
               )}
             </Link>
             <Link href="https://vibin-arsenal.vercel.app" target="_blank" className="admin-nav-link" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
               <span style={{ fontSize: '14px' }}>⚡</span> Arsenal
             </Link>
             <Link href="/" className="admin-nav-link">View Store</Link>
             <a href="#" className="admin-nav-link" onClick={handleSignOut} style={{ marginTop: 'auto', color: 'var(--coral)' }}>Sign Out</a>
           </nav>
        </div>

        <div className="admin-content">
          {page === 'dashboard' && (
            <>
              <div className="admin-header">
                <h1 className="admin-title">Dashboard</h1>
                <span style={{ color: '#888', fontSize: '14px' }}>Live data</span>
              </div>

              {loading ? (
                <div style={{ color: '#888', padding: '40px 0' }}>Loading...</div>
              ) : (
                <>
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
                  </div>

                  <div>
                    <h2 style={{ fontFamily: "'Anton', sans-serif", fontSize: '24px', marginBottom: '20px', textTransform: 'uppercase' }}>Recent Orders</h2>
                    {orders.length === 0 ? (
                      <div style={{ color: '#888', padding: '40px 0', textAlign: 'center' }}>No orders yet. They'll show up here once customers check out.</div>
                    ) : (
                      <table className="admin-table">
                        <thead>
                          <tr>
                            <th>Order</th>
                            <th>Customer</th>
                            <th>Items</th>
                            <th>Date</th>
                            <th>Total</th>
                            <th>Status</th>
                          </tr>
                        </thead>
                        <tbody>
                          {orders.slice(0, 10).map(order => (
                            <tr key={order.id}>
                              <td>{order.order_number || order.id?.slice(0, 8).toUpperCase()}</td>
                              <td>{order.customer_email || order.guest_email || '—'}</td>
                              <td>{Array.isArray(order.items) ? order.items.length : (order.items || '—')}</td>
                              <td>{formatDate(order.created_at)}</td>
                              <td>{formatCurrency(order.total || 0)}</td>
                              <td>
                                <span style={{ 
                                  padding: '4px 8px', 
                                  background: order.status === 'pending' ? '#fff3cd' : order.status === 'paid' ? '#cce5ff' : order.status === 'shipped' ? '#d4edda' : order.status === 'delivered' ? '#d4edda' : '#e2e3e5',
                                  fontSize: '11px',
                                  textTransform: 'uppercase'
                                }}>
                                  {order.status}
                                </span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    )}
                  </div>
                </>
              )}
            </>
          )}

          {page === 'orders' && (
            <>
              <div className="admin-header">
                <h1 className="admin-title">Orders</h1>
              </div>
              {loading ? (
                <div style={{ color: '#888', padding: '40px 0' }}>Loading...</div>
              ) : orders.length === 0 ? (
                <div style={{ color: '#888', padding: '40px 0', textAlign: 'center' }}>No orders yet.</div>
              ) : (
                <table className="admin-table">
                  <thead>
                    <tr>
                      <th>Order</th>
                      <th>Customer</th>
                      <th>Items</th>
                      <th>Date</th>
                      <th>Total</th>
                      <th>Status</th>
                      <th>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {orders.map(order => (
                      <tr key={order.id}>
                        <td>{order.order_number || order.id?.slice(0, 8).toUpperCase()}</td>
                        <td>{order.customer_email || order.guest_email || '—'}</td>
                        <td>{Array.isArray(order.items) ? order.items.length : (order.items || '—')}</td>
                        <td>{formatDate(order.created_at)}</td>
                        <td>{formatCurrency(order.total || 0)}</td>
                        <td>
                          <span style={{ 
                            padding: '4px 8px', 
                            background: order.status === 'pending' ? '#fff3cd' : order.status === 'paid' ? '#cce5ff' : order.status === 'shipped' ? '#d4edda' : order.status === 'delivered' ? '#d4edda' : '#e2e3e5',
                            fontSize: '11px',
                            textTransform: 'uppercase'
                          }}>
                            {order.status}
                          </span>
                        </td>
                        <td>
                          <Link href="/admin/orders" style={{ padding: '4px 12px', background: '#000', color: '#fff', textDecoration: 'none', fontSize: '12px' }}>
                            {order.status === 'pending' || order.status === 'paid' ? 'Fulfill' : 'Manage'}
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </>
          )}

          {page === 'analytics' && (
            <>
              <div className="admin-header">
                <h1 className="admin-title">Analytics</h1>
              </div>
              <div className="admin-stats">
                <div className="admin-stat">
                  <div className="admin-stat-label">Total Revenue</div>
                  <div className="admin-stat-value">{formatCurrency(stats.totalRevenue)}</div>
                </div>
                <div className="admin-stat">
                  <div className="admin-stat-label">Total Orders</div>
                  <div className="admin-stat-value">{stats.totalOrders}</div>
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
              <div className="admin-card" style={{ marginTop: '20px' }}>
                <h3 className="admin-card-title">Order Status Breakdown</h3>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: '20px' }}>
                  {['pending', 'paid', 'shipped', 'delivered'].map(status => {
                    const count = orders.filter(o => o.status === status).length
                    const pct = stats.totalOrders > 0 ? Math.round((count / stats.totalOrders) * 100) : 0
                    return (
                      <div key={status} style={{ padding: '15px', background: '#f5f5f5', borderRadius: '8px' }}>
                        <div style={{ fontSize: '12px', color: '#888', textTransform: 'uppercase', marginBottom: '5px' }}>{status}</div>
                        <div style={{ fontSize: '24px', fontWeight: 'bold' }}>{count}</div>
                        <div style={{ fontSize: '12px', color: '#888' }}>{pct}% of orders</div>
                      </div>
                    )
                  })}
                </div>
              </div>
              <div className="admin-card" style={{ marginTop: '20px' }}>
                <h3 className="admin-card-title">Traffic Sources</h3>
                <p style={{ color: '#888', fontSize: '14px' }}>Connect Google Analytics or Meta Pixel to see live traffic data here.</p>
              </div>
            </>
          )}

          {page === 'reviews' && (
            <>
              <div className="admin-header">
                <h1 className="admin-title">Reviews</h1>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '15px', marginBottom: '30px' }}>
                <div className="admin-stat" style={{ background: '#d4edda' }}>
                  <div className="admin-stat-label">⭐ Instagram</div>
                  <div className="admin-stat-value">4.8</div>
                </div>
                <div className="admin-stat" style={{ background: '#d4edda' }}>
                  <div className="admin-stat-label">🎵 TikTok</div>
                  <div className="admin-stat-value">4.9</div>
                </div>
                <div className="admin-stat" style={{ background: '#d4edda' }}>
                  <div className="admin-stat-label">🔍 Google</div>
                  <div className="admin-stat-value">4.7</div>
                </div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
                {reviews.map((review, i) => (
                  <div key={i} className="admin-card">
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
                      <span style={{ fontSize: '24px' }}>{platformIcons[review.platform]}</span>
                      <span style={{ color: '#888', fontSize: '12px' }}>{review.time}</span>
                    </div>
                    <div style={{ fontWeight: 'bold', marginBottom: '5px' }}>{review.user}</div>
                    <div style={{ display: 'flex', marginBottom: '10px' }}>
                      {[...Array(5)].map((_, j) => (
                        <span key={j} style={{ color: j < review.rating ? '#fbbf24' : '#ddd' }}>★</span>
                      ))}
                    </div>
                    <div style={{ color: '#555', fontSize: '14px' }}>"{review.text}"</div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </div>
      <AIAssistant />
    </>
  );
}
