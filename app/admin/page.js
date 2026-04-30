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
    const savedUser = localStorage.getItem('vibin_user');
    if (!savedUser) {
      router.push('/admin/login');
      return;
    }
    const user = JSON.parse(savedUser);
    if (!user.is_admin) {
      router.push('/login');
    }
  }, [router]);
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState({
    totalOrders: 0,
    totalRevenue: 0,
    pendingOrders: 0,
    shippedOrders: 0,
    deliveredOrders: 0,
    adSpend: 0,
    adClicks: 0,
    adConversions: 0,
    revenuePotential: 0,
    avgOrderValue: 0,
    conversionRate: 0
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
    setOrders([
      { id: 'ORD-001', guest_email: 'test@example.com', status: 'pending', total: 96, created_at: '2026-04-28', items: 2 },
      { id: 'ORD-002', guest_email: 'john@email.com', status: 'shipped', total: 48, created_at: '2026-04-27', items: 1 },
      { id: 'ORD-003', guest_email: 'jane@email.com', status: 'delivered', total: 146, created_at: '2026-04-26', items: 3 },
      { id: 'ORD-004', guest_email: 'mike@email.com', status: 'pending', total: 72, created_at: '2026-04-29', items: 1 },
      { id: 'ORD-005', guest_email: 'sarah@email.com', status: 'shipped', total: 218, created_at: '2026-04-29', items: 4 },
    ])
    
    setStats({
      totalOrders: 5,
      totalRevenue: 580,
      pendingOrders: 2,
      shippedOrders: 2,
      deliveredOrders: 1,
      adSpend: 150,
      adClicks: 1247,
      adConversions: 23,
      revenuePotential: 2400,
      avgOrderValue: 116,
      conversionRate: 3.2
    })

    setReviews([
      { platform: 'instagram', user: '@streetwear_joe', rating: 5, text: 'Best tee quality hands down 🔥', time: '2h ago' },
      { platform: 'tiktok', user: '@fashiondave', rating: 5, text: 'VIBIN different frfr', time: '5h ago' },
      { platform: 'google', user: 'Marcus R.', rating: 5, text: 'Exactly what I expected. Fire fits.', time: '1d ago' },
      { platform: 'instagram', user: '@atlanta_mike', rating: 4, text: 'Love the fit but shipping took forever', time: '2d ago' },
      { platform: 'tiktok', user: '@vibecheck', rating: 5, text: ' ambassador program is crazy 🔥', time: '3d ago' },
      { platform: 'google', user: 'Jaylen T.', rating: 5, text: 'Already got my second order. VIBIN different.', time: '4d ago' },
    ])
    setLoading(false)
  }

  const platformIcons = {
    instagram: '📸',
    tiktok: '🎵',
    google: '🔍',
    facebook: '👤',
    twitter: '🐦'
  }

  const formatCurrency = (num) => '$' + num.toLocaleString()

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
             <Link href="/" className="admin-nav-link">View Store</Link>
           </nav>
        </div>

        <div className="admin-content">
          {page === 'dashboard' && (
            <>
              <div className="admin-header">
                <h1 className="admin-title">Dashboard</h1>
                <span style={{ color: '#888', fontSize: '14px' }}>Last updated: Just now</span>
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
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '30px' }}>
                <div className="admin-card">
                  <h3 className="admin-card-title">Advertising</h3>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
                    <div>
                      <div style={{ fontSize: '12px', color: '#888', marginBottom: '5px' }}>Ad Spend</div>
                      <div style={{ fontSize: '24px', fontWeight: 'bold' }}>{formatCurrency(stats.adSpend)}</div>
                    </div>
                    <div>
                      <div style={{ fontSize: '12px', color: '#888', marginBottom: '5px' }}>Clicks</div>
                      <div style={{ fontSize: '24px', fontWeight: 'bold' }}>{stats.adClicks.toLocaleString()}</div>
                    </div>
                    <div>
                      <div style={{ fontSize: '12px', color: '#888', marginBottom: '5px' }}>Conversions</div>
                      <div style={{ fontSize: '24px', fontWeight: 'bold' }}>{stats.adConversions}</div>
                    </div>
                    <div>
                      <div style={{ fontSize: '12px', color: '#888', marginBottom: '5px' }}>Cost/Conversion</div>
                      <div style={{ fontSize: '24px', fontWeight: 'bold' }}>{formatCurrency(Math.round(stats.adSpend / stats.adConversions))}</div>
                    </div>
                  </div>
                </div>

                <div className="admin-card">
                  <h3 className="admin-card-title">Revenue Potential</h3>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
                    <div>
                      <div style={{ fontSize: '12px', color: '#888', marginBottom: '5px' }}>Revenue Potential</div>
                      <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#22c55e' }}>{formatCurrency(stats.revenuePotential)}</div>
                    </div>
                    <div>
                      <div style={{ fontSize: '12px', color: '#888', marginBottom: '5px' }}>Avg Order Value</div>
                      <div style={{ fontSize: '24px', fontWeight: 'bold' }}>{formatCurrency(stats.avgOrderValue)}</div>
                    </div>
                    <div>
                      <div style={{ fontSize: '12px', color: '#888', marginBottom: '5px' }}>Conversion Rate</div>
                      <div style={{ fontSize: '24px', fontWeight: 'bold' }}>{stats.conversionRate}%</div>
                    </div>
                    <div>
                      <div style={{ fontSize: '12px', color: '#888', marginBottom: '5px' }}>Customers</div>
                      <div style={{ fontSize: '24px', fontWeight: 'bold' }}>{stats.totalOrders}</div>
                    </div>
                  </div>
                </div>
              </div>

              <div>
                <h2 style={{ fontFamily: "'Anton', sans-serif", fontSize: '24px', marginBottom: '20px', textTransform: 'uppercase' }}>Recent Orders</h2>
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
                    {orders.map(order => (
                      <tr key={order.id}>
                        <td>{order.id}</td>
                        <td>{order.guest_email}</td>
                        <td>{order.items}</td>
                        <td>{order.created_at}</td>
                        <td>${order.total}</td>
                        <td>
                          <span style={{ 
                            padding: '4px 8px', 
                            background: order.status === 'pending' ? '#fff3cd' : order.status === 'shipped' ? '#d4edda' : '#e2e3e5',
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
              </div>
            </>
          )}

          {page === 'orders' && (
            <>
              <div className="admin-header">
                <h1 className="admin-title">Orders</h1>
              </div>
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
                      <td>{order.id}</td>
                      <td>{order.guest_email}</td>
                      <td>{order.items}</td>
                      <td>{order.created_at}</td>
                      <td>${order.total}</td>
                      <td>
                        <span style={{ 
                          padding: '4px 8px', 
                          background: order.status === 'pending' ? '#fff3cd' : order.status === 'shipped' ? '#d4edda' : '#e2e3e5',
                          fontSize: '11px',
                          textTransform: 'uppercase'
                        }}>
                          {order.status}
                        </span>
                      </td>
                      <td>
                        <button style={{ padding: '4px 12px', background: '#000', color: '#fff', border: 'none', cursor: 'pointer' }}>
                          {order.status === 'pending' ? 'Fulfill' : 'Track'}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
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
                  <div className="admin-stat-label">Revenue Potential</div>
                  <div className="admin-stat-value">{formatCurrency(stats.revenuePotential)}</div>
                </div>
                <div className="admin-stat">
                  <div className="admin-stat-label">Ad Spend</div>
                  <div className="admin-stat-value">{formatCurrency(stats.adSpend)}</div>
                </div>
                <div className="admin-stat">
                  <div className="admin-stat-label">Conversion Rate</div>
                  <div className="admin-stat-value">{stats.conversionRate}%</div>
                </div>
              </div>
              <div className="admin-card" style={{ marginTop: '20px' }}>
                <h3 className="admin-card-title">Traffic Sources</h3>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '20px' }}>
                  <div style={{ padding: '15px', background: '#f5f5f5', borderRadius: '8px' }}>
                    <div style={{ fontSize: '12px', color: '#888' }}>Instagram</div>
                    <div style={{ fontSize: '20px', fontWeight: 'bold' }}>487 visits</div>
                    <div style={{ fontSize: '12px', color: '#22c55e' }}>+12% this week</div>
                  </div>
                  <div style={{ padding: '15px', background: '#f5f5f5', borderRadius: '8px' }}>
                    <div style={{ fontSize: '12px', color: '#888' }}>TikTok</div>
                    <div style={{ fontSize: '20px', fontWeight: 'bold' }}>623 visits</div>
                    <div style={{ fontSize: '12px', color: '#22c55e' }}>+28% this week</div>
                  </div>
                  <div style={{ padding: '15px', background: '#f5f5f5', borderRadius: '8px' }}>
                    <div style={{ fontSize: '12px', color: '#888' }}>Google</div>
                    <div style={{ fontSize: '20px', fontWeight: 'bold' }}>312 visits</div>
                    <div style={{ fontSize: '12px', color: '#22c55e' }}>+5% this week</div>
                  </div>
                </div>
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
        )
  }