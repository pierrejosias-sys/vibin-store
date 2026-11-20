'use client'
import { shipsInTwoPackages, isDrop01NumberedLine } from '../lib/drop-catalog.mjs'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { loadStripe } from '@stripe/stripe-js'
import { useCart } from '../lib/cart-context'
import SiteHeader from '../components/SiteHeader'
import SiteFooter from '../components/SiteFooter'
import { shippingFor } from '../lib/shipping'
import { DROP_01, DROP01_CAP_COPY, DROP01_MARK_COPY, DROP01_NUMBERED_CLAIM_LIVE } from '../lib/drop-public.mjs'
import { preorderBuyOpen, storeOpen, formatET } from '../lib/drop-window.mjs'

import { podReturnTermsHref, POD_CART_TERMS_LINE, POD_CART_TERMS_LINK_TEXT } from '../lib/pod.mjs'

const money = n => `$${(Number(n) || 0).toFixed(2)}`

/** Items and totals, shown on the address step and the payment step. */
function OrderSummary({ items, subtotal, shippingCost, total }) {
  return (
    <div className="checkout-summary" data-testid="order-summary">
      <h3>Order Summary</h3>
      {items.map((item, i) => (
        <div key={`${item.id}-${item.color || ''}-${item.size || ''}-${i}`} className="checkout-item">
          <span>
            {item.name}{item.size ? ` (${item.color ? `${item.color} / ` : ''}${item.size})` : ''} × {item.qty}
            {item.pod === true && <><br /><small className="checkout-pod-terms">{POD_CART_TERMS_LINE} <a href={podReturnTermsHref(item)}>{POD_CART_TERMS_LINK_TEXT}</a></small></>}
          </span>
          <span>{money(item.price * item.qty)}</span>
        </div>
      ))}
      <div className="checkout-row"><span>Subtotal</span><span>{money(subtotal)}</span></div>
      <div className="checkout-row"><span>Shipping</span><span>{shippingCost === 0 ? 'FREE' : money(shippingCost)}</span></div>
      <div className="checkout-total"><span>Total</span><span>{money(total)}</span></div>
    </div>
  )
}

const STRIPE_PUBLISHABLE_KEY = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY
const stripePromise = STRIPE_PUBLISHABLE_KEY ? loadStripe(STRIPE_PUBLISHABLE_KEY) : Promise.resolve(null)

export default function CheckoutPage() {
  const [step, setStep] = useState(1)
  const [loading, setLoading] = useState(false)
  const [orderId, setOrderId] = useState(null)
  const [items, setItems] = useState([])
  const [ambassadorCode, setAmbassadorCode] = useState(null)
  const [paymentStatus, setPaymentStatus] = useState(null)
  const [errorMsg, setErrorMsg] = useState(null)
  const [preorderAck, setPreorderAck] = useState(false)
  const [now, setNow] = useState(null)
  const { updateCart } = useCart()
  const router = useRouter()

  const [hadNumbered, setHadNumbered] = useState(false)
  const [shipping, setShipping] = useState({
    firstName: '', lastName: '', email: '', phone: '',
    address: '', city: '', state: '', zip: '', country: 'US'
  })

  useEffect(() => {
    setNow(Date.now())
    const saved = localStorage.getItem('vibin_cart')
    if (saved) {
      try { const parsed = JSON.parse(saved); if (Array.isArray(parsed)) setItems(parsed) } catch {}
    }

    // Read ambassador code from localStorage (set by cart page)
    const ref = localStorage.getItem('vibin_ref')
    if (ref) setAmbassadorCode(ref)

    const urlParams = new URLSearchParams(window.location.search)
    const success = urlParams.get('success')
    const orderId = urlParams.get('order')
    if (success === 'true' && orderId) {
      setOrderId(orderId)
      setPaymentStatus('success')
      try { setHadNumbered((JSON.parse(saved || '[]') || []).some(isDrop01NumberedLine)) } catch {}
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
          preorderAck,
        })
      })

      const { sessionId, url, error } = await response.json()

      if (error) {
        setErrorMsg(error)
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
  const shippingCost = shippingFor(subtotal, items)
  const total = subtotal + shippingCost
  const hasPreorder = items.some(i => i.drop || i.preorder)
  // Drop 01 pieces can't be checked out before the window (the server refuses them too).
  // Made-to-order lines have their own gate (POD_SALES_LIVE), not the Jan 14 store open (same as /api/checkout).
  const hasRegular = items.some(i => !(i.drop || i.preorder) && i.pod !== true)
  const dropLocked = hasPreorder && now != null && !preorderBuyOpen(DROP_01, now)
  // Regular products open with the store, Thu Jan 14, 2027 7:00 PM ET.
  const storeLocked = hasRegular && now != null && !storeOpen(DROP_01.opensAt, now)
  const preorderLocked = dropLocked || storeLocked
  const lockedNote = preorderLocked && (
    <div data-testid="preorder-locked" style={{ border: '1px solid #e05c2e', borderRadius: '8px', padding: '10px 14px', margin: '0 0 16px', fontSize: '0.85rem' }}>
      <strong>Checkout opens {formatET(DROP_01.opensAt)}.</strong> {dropLocked ? `Waitlist members can pre-order Drop 01 pieces from ${formatET(DROP_01.earlyAccessAt)}.` : 'Everything in the shop goes on sale then.'} Your <Link href="/cart">bag</Link> is saved until then.
    </div>
  )

  if (items.length === 0 && step !== 3 && paymentStatus !== 'success') {
    return (
      <>
        <SiteHeader />
        <div className="cart-page">
          <div className="cart-empty">
            <p>Your bag is empty.</p>
            <Link href="/shop" style={{ color: 'var(--coral)', marginTop: '20px', display: 'inline-block' }}>Continue Shopping →</Link>
          </div>
        </div>
        <SiteFooter />
      </>
    )
  }

  return (
    <>
      <SiteHeader />

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
            <OrderSummary items={items} subtotal={subtotal} shippingCost={shippingCost} total={total} />
            {lockedNote}
            <button className="btn-atc" onClick={() => setStep(2)} disabled={preorderLocked}>Continue to Payment →</button>
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
                {errorMsg || 'Payment failed. Please try again.'}
              </div>
            )}

            <OrderSummary items={items} subtotal={subtotal} shippingCost={shippingCost} total={total} />
            {lockedNote}

            {shipsInTwoPackages(items) && (
              <div data-testid="two-packages" style={{ border: '1px solid #01696f', borderRadius: '8px', padding: '10px 14px', marginBottom: '12px', fontSize: '0.85rem' }}>
                <strong>Ships in two packages.</strong> Your hoodie ships separately from your tee/snapback, so your order may arrive in two packages.
              </div>
            )}
            {hasPreorder && (
              <label style={{ display: 'flex', gap: '10px', alignItems: 'flex-start', margin: '16px 0', fontSize: '14px' }}>
                <input type="checkbox" checked={preorderAck} onChange={e => setPreorderAck(e.target.checked)} required />
                <span>{DROP_01.shipsBy ? `I understand this is a pre-order shipping by ${DROP_01.shipsBy}.` : 'I understand this is a pre-order.'}</span>
              </label>
            )}
            <button className="btn-atc" onClick={handleStripeCheckout} disabled={loading || preorderLocked || (hasPreorder && !preorderAck)}>
              {loading ? 'Processing...' : `Pay ${money(total)} with Stripe →`}
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
            {/* Names the edition, never a unit number (numbers are assigned at marking). Gated like every surface. */}
            {hadNumbered && DROP01_NUMBERED_CLAIM_LIVE && <p style={{ fontSize: '13px', marginTop: '8px' }}>{DROP01_CAP_COPY} {DROP01_MARK_COPY}</p>}
            <p style={{ fontSize: '13px', color: 'var(--muted)', marginTop: '8px' }}>
              Confirmation sent to <strong>{shipping.email}</strong>
            </p>
            <Link href="/shop" className="btn-atc">Continue Shopping</Link>
          </div>
        )}
      </div>

      <SiteFooter />
    </>
  )
}
