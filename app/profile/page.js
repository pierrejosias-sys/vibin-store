'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import styles from '../styles.css'

export default function ProfilePage() {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [orders, setOrders] = useState([])

  useEffect(() => {
    const savedUser = localStorage.getItem('vibin_user')
    if (!savedUser) {
      window.location.href = '/login'
      return
    }
    
    setUser(JSON.parse(savedUser))
    setOrders([
      { id: 'ORD-001', date: '2026-04-15', status: 'Delivered', total: 96, items: ['Foundation Tee', 'Vol 01 Hoodie'] },
      { id: 'ORD-002', date: '2026-03-22', status: 'Delivered', total: 48, items: ['Move Different Tee'] },
    ])
    setLoading(false)
  }, [])

  function handleLogout() {
    localStorage.removeItem('vibin_user')
    window.location.href = '/login'
  }

  function getInitials(email) {
    if (!email) return 'U'
    return email.split('@')[0].slice(0, 2).toUpperCase()
  }

  if (loading) {
    return (
      <>
        <style dangerouslySetInnerHTML={{ __html: styles }} />
        <div style={{ padding: '100px', textAlign: 'center' }}>Loading...</div>
      </>
    )
  }

  if (!user) {
    return null
  }

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: styles }} />
      
      <div className="promo">
        <div className="promo-track">
          <span>Free shipping over $75</span><span>SS26 Drop is live</span><span>15% off your first order</span>
        </div>
      </div>

      <nav>
        <Link href="/" className="logo">VIBIN</Link>
        <div className="nav-links">
          <Link href="/shop">Shop</Link>
          <Link href="/print">Custom Print</Link>
          <Link href="/ambassador">Ambassador</Link>
        </div>
        <div className="nav-actions">
          <Link href="/profile" className="nav-icon">👤</Link>
          <Link href="/cart" className="nav-icon">🛒<span>0</span></Link>
        </div>
      </nav>

      <div style={{ maxWidth: '900px', margin: '0 auto', padding: '40px 20px' }}>
        <h1 style={{ fontFamily: "'Anton', sans-serif", fontSize: '48px', marginBottom: '40px' }}>
          Welcome back, <em>{user.firstName || user.email?.split('@')[0]}</em>
        </h1>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '30px', marginBottom: '40px' }}>
          <div style={{ padding: '30px', background: '#f5f5f5', borderRadius: '8px' }}>
            <div style={{ fontSize: '12px', color: '#888', marginBottom: '10px', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Account</div>
            <div style={{ fontWeight: 'bold', fontSize: '18px' }}>{user.email}</div>
            <div style={{ color: '#888', fontSize: '14px', marginTop: '5px' }}>Member since {user.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'today'}</div>
          </div>
          <div style={{ padding: '30px', background: '#f5f5f5', borderRadius: '8px' }}>
            <div style={{ fontSize: '12px', color: '#888', marginBottom: '10px', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Member Status</div>
            <div style={{ fontWeight: 'bold', fontSize: '18px', color: '#22c55e' }}>Active Member</div>
            <div style={{ color: '#888', fontSize: '14px', marginTop: '5px' }}>15% member discount available</div>
          </div>
        </div>

        <h2 style={{ fontFamily: "'Anton', sans-serif", fontSize: '24px', marginBottom: '20px' }}>Your Orders</h2>
        
        {orders.length === 0 ? (
          <div style={{ padding: '40px', textAlign: 'center', background: '#f5f5f5', borderRadius: '8px' }}>
            <p style={{ marginBottom: '20px', color: '#888' }}>No orders yet</p>
            <Link href="/shop" style={{ display: 'inline-block', padding: '12px 24px', background: '#000', color: '#fff', textDecoration: 'none' }}>Start Shopping</Link>
          </div>
        ) : (
          <div style={{ display: 'grid', gap: '15px' }}>
            {orders.map(order => (
              <div key={order.id} style={{ padding: '20px', background: '#fff', border: '1px solid #eee', borderRadius: '8px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
                  <span style={{ fontFamily: "'JetBrains Mono', monospace", fontWeight: 'bold' }}>{order.id}</span>
                  <span style={{ padding: '4px 8px', background: '#22c55e', color: '#fff', fontSize: '12px', borderRadius: '4px' }}>{order.status}</span>
                </div>
                <div style={{ color: '#888', fontSize: '14px' }}>{order.date} · ${order.total}</div>
                <div style={{ marginTop: '10px', display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                  {order.items.map((item, i) => (
                    <span key={i} style={{ padding: '4px 10px', background: '#f5f5f5', fontSize: '12px' }}>{item}</span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}

        <button onClick={handleLogout} style={{ marginTop: '40px', padding: '12px 24px', background: 'transparent', border: '1px solid #ccc', cursor: 'pointer' }}>
          Sign Out
        </button>

        {/* Ambassador Section */}
        <div style={{ marginTop: '40px', padding: '30px', background: '#111', borderRadius: '8px', textAlign: 'center' }}>
          <h3 style={{ fontFamily: 'Anton, sans-serif', fontSize: '24px', textTransform: 'uppercase', marginBottom: '12px' }}>Want to Earn as an Ambassador?</h3>
          <p style={{ color: '#888', fontSize: '14px', marginBottom: '20px' }}>Earn 15-25% commission by sharing Vibin with your audience.</p>
          <Link href="/ambassador/apply" style={{ display: 'inline-block', padding: '12px 24px', background: '#e05c2e', color: '#fff', textDecoration: 'none', borderRadius: '4px', fontWeight: 'bold', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '.1em' }}>
            Apply as Ambassador →
          </Link>
        </div>
      </div>
      
      <footer>
        <div className="foot-logo">VIBIN</div>
        <div className="foot-tag">Custom prints · Made to order · Jacksonville, FL</div>
      </footer>
    </>
  )
}