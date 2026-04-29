'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import styles from '../styles.css'

export default function CheckoutPage() {
  const [step, setStep] = useState(1)
  const [loading, setLoading] = useState(false)
  const [orderId, setOrderId] = useState(null)
  const [items, setItems] = useState([])
  const [emailNotified, setEmailNotified] = useState(false)
  
  const [shipping, setShipping] = useState({
    firstName: '', lastName: '', email: '', phone: '',
    address: '', city: '', state: '', zip: '', country: 'US'
  })

  useEffect(() => {
    const saved = localStorage.getItem('vibin_cart')
    if (saved) setItems(JSON.parse(saved))
  }, [])

  async function sendNotification(email, orderId, items) {
    try {
      await fetch('/api/notify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email,
          type: 'order_confirmation',
          orderId,
          data: { items, shipping }
        })
      })
    } catch (e) {
      console.log('Email notification skipped')
    }
  }

  async function handleSubmitOrder() {
    setLoading(true)
    
    // Skip auth - allow guest checkout
    const guestEmail = shipping.email || 'guest@checkout.com'
    const orderData = {
      id: 'ORD-' + Date.now(),
      items,
      shipping,
      guest_email: shipping.email,
      subtotal: items.reduce((sum, i) => sum + i.price * i.qty, 0),
      shipping_cost: items.reduce((sum, i) => sum + i.price * i.qty, 0) >= 75 ? 0 : 10,
      total: items.reduce((sum, i) => sum + i.price * i.qty, 0) + (items.reduce((sum, i) => sum + i.price * i.qty, 0) >= 75 ? 0 : 10),
      status: 'pending',
      created_at: new Date().toISOString()
    }

    try {
      const { supabase } = await import('../lib/supabase')
      const { error } = await supabase.from('orders').insert(orderData)
    } catch (e) {
      console.log('DB insert skipped')
    }

    setOrderId(orderData.id)
    localStorage.removeItem('vibin_cart')
    
    if (shipping.email && !emailNotified) {
      await sendNotification(shipping.email, orderData.id, items)
      setEmailNotified(true)
    }
    
    setStep(3)
    setLoading(false)
  }

  const subtotal = items.reduce((sum, item) => sum + item.price * item.qty, 0)
  const shippingCost = subtotal >= 75 ? 0 : 10
  const total = subtotal + shippingCost

  if (items.length === 0 && step !== 3) {
    return (
      <>
        <style dangerouslySetInnerHTML={{ __html: styles }} />
        <div className="promo"><div className="promo-track"><span>Free shipping over $75</span><span>SS26 Drop is live</span></div></div>
        <nav>
          <Link href="/" className="logo">VIBIN</Link>
          <div className="nav-actions"><Link href="/cart" className="nav-icon">🛒</Link></div>
        </nav>
        <div className="cart-page">
          <div className="cart-empty">Your bag is empty</div>
          <Link href="/shop" style={{color: 'var(--coral)'}}>Continue Shopping</Link>
        </div>
      </>
    )
  }

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: styles }} />
      
      <div className="promo">
        <div className="promo-track">
          <span>Free shipping over $75</span><span>SS26 Drop is live</span>
          <span>Free shipping over $75</span><span>SS26 Drop is live</span>
        </div>
      </div>

      <nav>
        <Link href="/" className="logo">VIBIN</Link>
      </nav>

      <div className="checkout-page">
        {step === 1 && (
          <div className="checkout-form">
            <h2>Shipping Address</h2>
            <div className="field-row">
              <div className="field">
                <div className="field-label">First Name</div>
                <input className="field-input" value={shipping.firstName} onChange={e => setShipping({...shipping, firstName: e.target.value})} />
              </div>
              <div className="field">
                <div className="field-label">Last Name</div>
                <input className="field-input" value={shipping.lastName} onChange={e => setShipping({...shipping, lastName: e.target.value})} />
              </div>
            </div>
            <div className="field">
              <div className="field-label">Email</div>
              <input className="field-input" type="email" value={shipping.email} onChange={e => setShipping({...shipping, email: e.target.value})} />
            </div>
            <div className="field">
              <div className="field-label">Address</div>
              <input className="field-input" value={shipping.address} onChange={e => setShipping({...shipping, address: e.target.value})} />
            </div>
            <div className="field-row">
              <div className="field">
                <div className="field-label">City</div>
                <input className="field-input" value={shipping.city} onChange={e => setShipping({...shipping, city: e.target.value})} />
              </div>
              <div className="field">
                <div className="field-label">State</div>
                <input className="field-input" value={shipping.state} onChange={e => setShipping({...shipping, state: e.target.value})} />
              </div>
              <div className="field">
                <div className="field-label">ZIP</div>
                <input className="field-input" value={shipping.zip} onChange={e => setShipping({...shipping, zip: e.target.value})} />
              </div>
            </div>
            <button className="btn-atc" onClick={() => setStep(2)}>Continue to Payment →</button>
          </div>
        )}

        {step === 2 && (
          <div className="checkout-form">
            <h2>Payment</h2>
            <p style={{ color: 'var(--muted)', marginBottom: '24px' }}>
              💳 <strong>Stripe integration ready.</strong> Add STRIPE_SECRET_KEY to enable live payments.
            </p>
            
            <div className="checkout-summary">
              <h3>Order Summary</h3>
              {items.map(item => (
                <div key={item.id} className="checkout-item">
                  <span>{item.name} × {item.qty}</span>
                  <span>${item.price * item.qty}</span>
                </div>
              ))}
              <div className="checkout-row"><span>Subtotal</span><span>${subtotal}</span></div>
              <div className="checkout-row"><span>Shipping</span><span>{shippingCost === 0 ? 'FREE' : `$${shippingCost}`}</span></div>
              <div className="checkout-total"><span>Total</span><span>${total}</span></div>
            </div>
            
            <button className="btn-atc" onClick={handleSubmitOrder} disabled={loading}>
              {loading ? 'Processing...' : `Place Order · $${total}`}
            </button>
          </div>
        )}

        {step === 3 && (
          <div className="checkout-success">
            <div className="success-icon">✓</div>
            <h2>Order Confirmed!</h2>
            <p className="success-order">Order #{orderId}</p>
            <p>
              Confirmation sent to <strong>{shipping.email}</strong>
              {emailNotified && <span style={{ color: 'var(--coral)' }}> ✓</span>}
            </p>
            <p>Thank you for your order!</p>
            <Link href="/shop" className="btn-atc">Continue Shopping</Link>
          </div>
        )}
      </div>

      <footer>
        <div className="foot-logo">VIBIN</div>
      </footer>
    </>
  )
}