'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { loadStripe } from '@stripe/stripe-js'
import { useCart } from '../lib/cart-context'
import styles from '../styles.css'

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || 'pk_test_placeholder')

export default function CheckoutPage() {
  const [step, setStep] = useState(1)
  const [loading, setLoading] = useState(false)
  const [orderId, setOrderId] = useState(null)
  const [items, setItems] = useState([])
  const [ambassadorCode, setAmbassadorCode] = useState(null)
  const [paymentStatus, setPaymentStatus] = useState(null)
  const { updateCart } = useCart()
  const router = useRouter()

  const [shipping, setShipping] = useState({
    firstName: '', lastName: '', email: '', phone: '',
    address: '', city: '', state: '', zip: '', country: 'US'
  })

  useEffect(() => {
    const saved = localStorage.getItem('vibin_cart')
    if (saved) setItems(JSON.parse(saved))

    // Read ambassador code from localStorage (set by cart page)
    const ref = localStorage.getItem('vibin_ref')
    if (ref) setAmbassadorCode(ref)

    const urlParams = new URLSearchParams(window.location.search)
    const success = urlParams.get('success')
    const orderId = urlParams.get('order')
    if (success === 'true' && orderId) {
      setOrderId(orderId)
      setPaymentStatus('success')
      setStep(3)
      localStorage.removeItem('vibin_cart')
      localStorage.removeItem('vibin_ref')
      updateCart()
    }
  }, [])

  async function handleStripeCheckout() {
    setLoading(true)

    try {
      const response = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          items,
          email: shipping.email,
          ambassadorCode: ambassadorCode || null,
          shippingAddress: shipping,
        })
      })

      const { sessionId, url, error } = await response.json()

      if (error) {
        setPaymentStatus('error')
        setLoading(false)
        return
      }

      if (url) {
        window.location.href = url
        return
      }

      if (sessionId) {
        const stripe = await stripePromise
        const { error } = await stripe.redirectToCheckout({ sessionId })
        if (error) console.error('Stripe redirect error:', error)
      }
    } catch (e) {
      console.error('Checkout error:', e)
      setPaymentStatus('error')
    }

    setLoading(false)
  }

  const subtotal = items.reduce((sum, item) => sum + item.price * item.qty, 0)
  const shippingCost = subtotal >= 75 ? 0 : 10
  const total = subtotal + shippingCost

  if (items.length === 0 && step !== 3 && paymentStatus !== 'success') {
    return (
      <>
        <style dangerouslySetInnerHTML={{ __html: styles }} />
        <div className="promo"><div className="promo-track"><span>Free shipping over $75</span><span>SS26 Drop is live</span></div></div>
        <nav>
          <Link href="/" className="logo">VIBIN</Link>
          <div className="nav-actions"><Link href="/cart" className="nav-icon">🛒</Link></div>
        </nav>
        <div className="cart-page">
          <div className="cart-empty">
            <p>Your bag is empty.</p>
            <Link href="/shop" style={{ color: 'var(--coral)', marginTop: '20px', display: 'inline-block' }}>Continue Shopping →</Link>
          </div>
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

            {ambassadorCode && (
              <div style={{background:'#f0faf9',border:'1px solid #01696f',borderRadius:'8px',padding:'10px 14px',marginBottom:'20px',fontSize:'0.78rem',color:'#01696f',textAlign:'center'}}>
                🎉 Ambassador code <strong>{ambassadorCode}</strong> applied!
              </div>
            )}

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
              🔒 <strong>Secure checkout powered by Stripe.</strong> Your payment info is encrypted and secure.
            </p>

            {paymentStatus === 'error' && (
              <div style={{ padding: '12px', background: '#ffcccc', color: '#cc0000', marginBottom: '20px', fontSize: '13px' }}>
                Payment failed. Please try again.
              </div>
            )}

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

            <button className="btn-atc" onClick={handleStripeCheckout} disabled={loading}>
              {loading ? 'Processing...' : `Pay $${total} with Stripe →`}
            </button>

            <div style={{ marginTop: '16px', fontSize: '12px', color: 'var(--muted)', textAlign: 'center' }}>
              🔒 SSL Secure · 256-bit encryption · Stripe protected
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="checkout-success">
            <div className="success-icon">✓</div>
            <h2>Order Confirmed!</h2>
            <p className="success-order">Order #{orderId}</p>
            <p>Thank you for your order! Your payment was successful.</p>
            <p style={{ fontSize: '13px', color: 'var(--muted)', marginTop: '8px' }}>
              Confirmation sent to <strong>{shipping.email}</strong>
            </p>
            <Link href="/shop" className="btn-atc">Continue Shopping</Link>
          </div>
        )}
      </div>

      <footer>
        <div className="foot-top">Vibin <em>Different.</em></div>
        <div className="foot-bottom"><div>© 2026 Vibin Apparel · Jacksonville, FL</div></div>
      </footer>
    </>
  )
}
