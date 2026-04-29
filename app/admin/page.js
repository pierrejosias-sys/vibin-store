'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import styles from '../styles.css'

export default function AdminPage() {
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState({ totalOrders: 0, totalRevenue: 0, pending: 0, shipped: 0 })
  const [page, setPage] = useState('orders')

  useEffect(() => {
    fetchOrders()
  }, [])

  async function fetchOrders() {
    setOrders([
      { id: 'ORD-001', guest_email: 'test@example.com', status: 'pending', total: 96, created_at: '2026-04-28' },
      { id: 'ORD-002', guest_email: 'john@email.com', status: 'shipped', total: 48, created_at: '2026-04-27' },
      { id: 'ORD-003', guest_email: 'jane@email.com', status: 'delivered', total: 146, created_at: '2026-04-26' },
    ])
    
    setStats({
      totalOrders: 3,
      totalRevenue: 290,
      pending: 1,
      shipped: 1
    })
    setLoading(false)
  }

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: styles }} />
      
      <div className="admin-page">
        <div className="admin-sidebar">
          <div className="admin-logo">VIBIN</div>
          <nav className="admin-nav">
            <a href="#" className={`admin-nav-link ${page === 'orders' ? 'on' : ''}`} onClick={() => setPage('orders')}>Orders</a>
            <a href="#" className={`admin-nav-link ${page === 'products' ? 'on' : ''}`} onClick={() => setPage('products')}>Products</a>
            <a href="#" className={`admin-nav-link ${page === 'customers' ? 'on' : ''}`} onClick={() => setPage('customers')}>Customers</a>
            <Link href="/" className="admin-nav-link">View Store</Link>
          </nav>
        </div>

        <div className="admin-content">
          <div className="admin-header">
            <h1 className="admin-title">Dashboard</h1>
          </div>

          <div className="admin-stats">
            <div className="admin-stat">
              <div className="admin-stat-label">Total Orders</div>
              <div className="admin-stat-value">{stats.totalOrders}</div>
            </div>
            <div className="admin-stat">
              <div className="admin-stat-label">Revenue</div>
              <div className="admin-stat-value">${stats.totalRevenue}</div>
            </div>
            <div className="admin-stat">
              <div className="admin-stat-label">Pending</div>
              <div className="admin-stat-value">{stats.pending}</div>
            </div>
            <div className="admin-stat">
              <div className="admin-stat-label">Shipped</div>
              <div className="admin-stat-value">{stats.shipped}</div>
            </div>
          </div>

          <div>
            <h2 style={{ fontFamily: "'Anton', sans-serif", fontSize: '24px', marginBottom: '20px', textTransform: 'uppercase' }}>Recent Orders</h2>
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Order</th>
                  <th>Customer</th>
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
        </div>
      </div>
    </>
  )
}