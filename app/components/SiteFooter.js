import Link from 'next/link'

const LEGAL = { color: '#888', textDecoration: 'none', fontSize: '13px', marginRight: '20px', marginBottom: '8px', display: 'inline-block', whiteSpace: 'nowrap', fontFamily: 'JetBrains Mono, monospace' }

/** Footer shared by every storefront page (same columns as the home page footer). */
export default function SiteFooter() {
  return (
    <footer>
      <div className="foot-cols">
        <div className="foot-brand">
          <div className="foot-logo">VIBIN</div>
          <div className="foot-tagline">A lifestyle streetwear brand based in Jacksonville, FL. A subsidiary of HVD Holdings. Apparel for those who move different.</div>
        </div>
        <div className="foot-col">
          <h4>Shop</h4>
          <ul>
            <li><Link href="/shop">All Products</Link></li>
            <li><Link href="/shop?cat=tees">Tees</Link></li>
            <li><Link href="/shop?cat=hoodies">Hoodies</Link></li>
            <li><Link href="/shop?cat=accessories">Accessories</Link></li>
            <li><Link href="/lookbook">Lookbook</Link></li>
            <li><Link href="/drop/01">Drop 01</Link></li>
          </ul>
        </div>
        <div className="foot-col">
          <h4>Help</h4>
          <ul>
            <li><Link href="/shipping">Shipping</Link></li>
            <li><Link href="/returns">Returns</Link></li>
            <li><Link href="/qa">FAQ</Link></li>
            <li><Link href="/contact">Contact</Link></li>
            <li><Link href="/login">Account</Link></li>
            <li><Link href="/ambassador">Ambassador</Link></li>
          </ul>
        </div>
        <div className="foot-col">
          <h4>Connect</h4>
          <ul>
            <li><a href="https://instagram.com/vibinapparel" target="_blank" rel="noopener">Instagram</a></li>
            <li><a href="https://tiktok.com/@vibinapparel" target="_blank" rel="noopener">TikTok</a></li>
            <li><a href="https://twitter.com/vibinapparel" target="_blank" rel="noopener">Twitter / X</a></li>
            <li><Link href="/verify">Vibin Verify</Link></li>
          </ul>
        </div>
      </div>
      <div className="foot-bottom">
        <div>© 2026 Vibin Apparel · A subsidiary of HVD Holdings, LLC · Jacksonville, FL</div>
        <div style={{ marginTop: '12px' }}>
          <Link href="/legal/privacy" style={LEGAL}>Privacy Policy</Link>
          <Link href="/legal/terms" style={LEGAL}>Terms of Service</Link>
          <Link href="/returns" style={{ ...LEGAL, marginRight: 0 }}>Returns</Link>
        </div>
      </div>
    </footer>
  )
}
