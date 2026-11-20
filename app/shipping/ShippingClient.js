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
                <td style={{padding:'16px 0'}}>Shown on each product page</td>
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
          <p>Each product page shows when that item ships. Made-to-order pieces ship within 7 business days of your order. Drop 01 is a pre-order, and its ship-by date is shown on the Drop 01 page and at checkout before you pay. You&apos;ll get a tracking number by email once your order ships.</p>
        </div>

        {/* Made-to-order items: same strings as app/lib/pod.mjs on the POD branch (PR #96). Pending Josias. */}
        <div id="made-to-order" style={{marginBottom:'40px'}}>
          <h3 style={{fontFamily:'Anton, sans-serif',fontSize:'24px',textTransform:'uppercase',marginBottom:'16px'}}>Made-to-order items</h3>
          <p>Made to order. Ships within 7 business days of your order. US delivery usually takes another 3–4 business days after it ships.</p>
          <p style={{marginTop:'8px'}}>Hats ship in a separate package.</p>
          <p style={{marginTop:'8px'}}>Made-to-order pieces don&apos;t count toward free shipping on orders over {FREE_SHIPPING_LABEL}. Their shipping is added at checkout.</p>
          <p style={{marginTop:'8px'}}>Made-to-order pieces are final sale except as stated in the return terms on their product page.</p>
        </div>

        <div style={{padding:'20px',border:'2px solid var(--coral)',borderRadius:'8px'}}>
          <p>Looking for return info? <Link href="/returns" style={{color:'var(--coral)',fontWeight:'bold'}}>View our Returns Policy →</Link></p>
        </div>
      </section>

      <SiteFooter />
    </>
  )
}

