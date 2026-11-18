import Link from 'next/link'
import { FREE_SHIPPING_LABEL, SHIPPING_FLAT_RATE } from '../lib/shipping'
import SiteHeader from '../components/SiteHeader'
import SiteFooter from '../components/SiteFooter'

export default function ShippingPage() {
  return (
    <>
      
      <SiteHeader />

      <div className="breadcrumb">
        <Link href="/">Home</Link> / <span className="current">Shipping</span>
      </div>

      <section style={{maxWidth:'800px',margin:'0 auto',padding:'60px 20px'}}>
        <h1 style={{fontFamily:'Anton, sans-serif',fontSize:'56px',textTransform:'uppercase',marginBottom:'40px'}}>Shipping</h1>
        
        <div style={{marginBottom:'40px'}}>
          <h3 style={{fontFamily:'Anton, sans-serif',fontSize:'24px',textTransform:'uppercase',marginBottom:'16px',color:'var(--coral)'}}>Delivery Times</h3>
          <table style={{width:'100%',borderCollapse:'collapse'}}>
            <thead>
              <tr style={{borderBottom:'2px solid var(--ink)'}}>
                <th style={{textAlign:'left',padding:'12px 0',fontFamily:'JetBrains Mono, monospace',fontSize:'11px',textTransform:'uppercase',letterSpacing:'.1em'}}>Method</th>
                <th style={{textAlign:'left',padding:'12px 0',fontFamily:'JetBrains Mono, monospace',fontSize:'11px',textTransform:'uppercase',letterSpacing:'.1em'}}>Time</th>
                <th style={{textAlign:'right',padding:'12px 0',fontFamily:'JetBrains Mono, monospace',fontSize:'11px',textTransform:'uppercase',letterSpacing:'.1em'}}>Price</th>
              </tr>
            </thead>
            <tbody>
              <tr style={{borderBottom:'1px solid var(--line)'}}>
                <td style={{padding:'16px 0',fontWeight:'600'}}>Standard Shipping</td>
                <td style={{padding:'16px 0'}}>5–8 business days</td>
                <td style={{padding:'16px 0',textAlign:'right'}}>${SHIPPING_FLAT_RATE} · free on orders {FREE_SHIPPING_LABEL}+</td>
              </tr>
            </tbody>
          </table>
        </div>

        <div style={{marginBottom:'40px',padding:'20px',background:'var(--cream2)',borderRadius:'8px'}}>
          <h3 style={{fontFamily:'Anton, sans-serif',fontSize:'24px',textTransform:'uppercase',marginBottom:'16px'}}>International</h3>
          <p>Currently shipping to US only. International drops coming SS27.</p>
        </div>

        <div style={{marginBottom:'40px'}}>
          <h3 style={{fontFamily:'Anton, sans-serif',fontSize:'24px',textTransform:'uppercase',marginBottom:'16px'}}>Processing</h3>
          <p>Orders are processed within 1–2 business days. You will receive a tracking number via email once your order ships.</p>
        </div>

        <div style={{padding:'20px',border:'2px solid var(--coral)',borderRadius:'8px'}}>
          <p>Looking for return info? <Link href="/returns" style={{color:'var(--coral)',fontWeight:'bold'}}>View our Returns Policy →</Link></p>
        </div>
      </section>

      <SiteFooter />
    </>
  )
}

