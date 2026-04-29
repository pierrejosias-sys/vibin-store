'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import styles from '../styles.css'

export default function ProfilePage() {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [orders, setOrders] = useState([])
  const router = useRouter()

  useEffect(() => {
    checkUser()
  }, [])

  function checkUser() {
    const savedUser = localStorage.getItem('vibin_user')
    
    if (!savedUser) {
      router.push('/login')
      return
    }
    
    setUser(JSON.parse(savedUser))
    setOrders([
      { id: 'ORD-001', date: '2026-04-15', status: 'Delivered', total: 96, items: ['Foundation Tee', 'Vol 01 Hoodie'] },
      { id: 'ORD-002', date: '2026-03-22', status: 'Delivered', total: 48, items: ['Move Different Tee'] },
    ])
    setLoading(false)
  }

  async function handleLogout() {
    localStorage.removeItem('vibin_user')
    router.push('/login')
  }

  function getInitials(email) {
    return email ? email.substring(0, 2).toUpperCase() : 'U'
  }

  if (loading) {
    return (
      <>
        <style dangerouslySetInnerHTML={{ __html: styles }} />
        <div className="cart-page">
          <div className="cart-empty">Loading...</div>
        </div>
      </>
    )
  }

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: styles }} />
      
      <div className="promo">
        <div className="promo-track">
          <span>Free shipping over $75</span><span>SS26 Drop is live</span><span>Member pricing 15% off</span>
          <span>Free shipping over $75</span><span>SS26 Drop is live</span><span>Member pricing 15% off</span>
        </div>
      </div>

      <nav>
        <Link href="/" className="logo">VIBIN</Link>
        <div className="nav-links">
          <Link href="/shop">Shop</Link>
          <Link href="/shop">New Drop</Link>
          <Link href="/">Lookbook</Link>
        </div>
        <div className="nav-actions">
          <Link href="/profile" className="nav-icon">👤</Link>
          <Link href="/cart" className="nav-icon">🛒<span className="cart-dot">0</span></Link>
        </div>
      </nav>

      <div className="profile-page">
        <div className="profile-header">
          <div className="profile-avatar">{getInitials(user?.email)}</div>
          <div className="profile-info">
            <h1>Welcome back.</h1>
            <div className="profile-email">{user?.email}</div>
          </div>
        </div>

        <div className="profile-section">
          <div className="profile-section-title">Member Status</div>
          <div className="profile-row">
            <span>Member since</span>
            <span>{user?.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'Today'}</span>
          </div>
          <div className="profile-row">
            <span>Tier</span>
            <span style={{color: 'var(--coral)', fontWeight: '600'}}>Founding Member</span>
          </div>
          <div className="profile-row">
            <span>Member discount</span>
            <span>15% off</span>
          </div>
        </div>

        <div className="profile-section">
          <div className="profile-section-title">Orders</div>
          {orders.length === 0 ? (
            <div style={{ color: 'var(--muted)', padding: '20px 0' }}>No orders yet</div>
          ) : (
            orders.map(order => (
              <div key={order.id} className="profile-row">
                <div>
                  <div style={{ fontWeight: '600' }}>{order.id}</div>
                  <div style={{ fontSize: '12px', color: 'var(--muted)' }}>{order.date} · {order.items.join(', ')}</div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div>${order.total}</div>
                  <div style={{ fontSize: '12px', color: 'var(--coral)' }}>{order.status}</div>
                </div>
              </div>
            ))
          )}
        </div>

        <div className="profile-section">
          <div className="profile-section-title">Account</div>
          <div className="profile-row">
            <span>Email</span>
            <span>{user?.email}</span>
          </div>
          <div className="profile-row">
            <span>Name</span>
            <span>{user?.firstName} {user?.lastName}</span>
          </div>
        </div>

        <button className="btn-logout" onClick={handleLogout}>Sign Out →</button>
      </div>

      <footer>
        <div className="foot-logo">VIBIN</div>
        <div className="foot-tag">Apparel for those who move different · Jacksonville, FL</div>
      </footer>
    </>
  )
}