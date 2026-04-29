'use client'

import { useState, useEffect } from 'react'
import { supabase } from './lib/supabase'
import styles from './styles.css'

export default function HomePage() {
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [cartCount, setCartCount] = useState(0)
  const [addedId, setAddedId] = useState(null)

  useEffect(() => {
    fetchProducts()
  }, [])

  async function fetchProducts() {
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .order('created_at', { ascending: false })

    if (data && data.length > 0) {
      setProducts(data)
    } else {
      setProducts([
        { id: 1, name: 'Foundation Tee — Black', price: 48, category: 'Tee · Heavyweight', color: 'Black', image_color: 'ink' },
        { id: 2, name: 'Move Different Tee — Cream', price: 48, category: 'Tee · Heavyweight', color: 'Cream', image_color: 'cream2' },
        { id: 3, name: 'Vol 01 Hoodie — Coral', price: 98, category: 'Hoodie · Heavyweight Fleece', color: 'Coral', image_color: 'coral' },
        { id: 4, name: 'Mark Hoodie — Onyx', price: 98, category: 'Hoodie · Heavyweight Fleece', color: 'Onyx', image_color: 'ink2' },
        { id: 5, name: 'Different Crewneck — Violet', price: 78, category: 'Sweatshirt · Cotton Blend', color: 'Violet', image_color: 'violet' },
        { id: 6, name: 'Louder Cap — Acid', price: 38, category: 'Headwear · 6-Panel', color: 'Acid', image_color: 'acid' },
        { id: 7, name: 'VBN Heavyweight Tee — Forest', price: 48, category: 'Tee · Heavyweight', color: 'Forest', image_color: 'teal' },
        { id: 8, name: 'Sunup Beanie — Sun', price: 32, category: 'Headwear · Knit', color: 'Sun', image_color: 'sun' },
      ])
    }
    setLoading(false)
  }

  function handleQuickAdd(id) {
    setCartCount(cartCount + 1)
    setAddedId(id)
    setTimeout(() => setAddedId(null), 1800)
  }

  const colorMap = {
    'ink': '', 'cream2': 'cream', 'coral': 'coral', 'violet': 'violet',
    'acid': 'acid', 'teal': 'teal', 'sun': 'sun', 'ink2': 'ink2'
  }

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: styles }} />

      {/* PROMO BAR */}
      <div className="promo">
        <div className="promo-track">
          <span>Free shipping on orders over $75</span>
          <span>New SS26 Drop is live</span>
          <span>Sign up for 15% off your first order</span>
          <span>Free shipping on orders over $75</span>
          <span>New SS26 Drop is live</span>
          <span>Sign up for 15% off your first order</span>
        </div>
      </div>

      {/* NAV */}
      <nav>
        <a href="/" className="logo">VIBIN</a>
        <div className="nav-links">
          <a href="/shop">Shop</a>
          <a href="/shop" className="new">New Drop</a>
          <a href="#">Lookbook</a>
          <a href="#">About</a>
          <a href="#">Stockists</a>
        </div>
        <div className="nav-actions">
          <div className="nav-icon">🔍</div>
          <a href="/login" className="nav-icon" style={{textDecoration:'none',color:'inherit'}}>👤</a>
          <a href="/cart" className="nav-icon" style={{textDecoration:'none',color:'inherit'}}>
            🛒{cartCount > 0 && <span className="cart-dot">{cartCount}</span>}
          </a>
        </div>
      </nav>

      {/* HERO */}
      <section className="hero">
        <div className="hero-img"></div>
        <div className="hero-grain"></div>
        <div className="hero-content">
          <div className="hero-top">
            <div className="hero-meta">
              <strong>SS26 Collection</strong> · Drop 01<br/>
              Vol. I — The Foundation
            </div>
            <div className="hero-meta">
              Released · Jacksonville FL<br/>
              Shot at 6:42 AM
            </div>
          </div>
          <h1 className="hero-title">
            <span className="vt-1">Vibin</span>
            <span className="vt-2">Different.</span>
          </h1>
          <div className="hero-bottom">
            <div className="hero-tag">
              Apparel for those who move with purpose, dress with intention, and vibe louder than the noise. Quality first, hype second.
            </div>
            <div className="hero-cta">
              <a href="/shop" className="btn primary">Shop The Drop <span className="arrow">→</span></a>
              <a href="#" className="btn">Lookbook</a>
            </div>
          </div>
        </div>
      </section>

      {/* MARQUEE */}
      <div className="marquee">
        <div className="marquee-track">
          <span>SS26 IS LIVE</span>
          <span><em>The Foundation</em></span>
          <span>NEW ARRIVALS</span>
          <span>FREE SHIPPING $75+</span>
          <span>SS26 IS LIVE</span>
          <span><em>The Foundation</em></span>
          <span>NEW ARRIVALS</span>
          <span>FREE SHIPPING $75+</span>
        </div>
      </div>

      {/* THE DROP */}
      <div className="sec-hdr">
        <div>
          <div className="sec-eye">SS26 · Drop 01</div>
          <h2 className="sec-title">The <em>Foundation</em></h2>
        </div>
        <a href="/shop" className="sec-link">View All Products →</a>
      </div>

      <div className="products">
        {loading ? (
          <div style={{gridColumn:'1/-1',textAlign:'center',padding:'60px',color:'var(--muted)'}}>Loading...</div>
        ) : (
          products.map((prod, i) => (
            <div className="prod" key={prod.id}>
              <div className="prod-img">
                {i === 0 && <div className="prod-tag-img new">New</div>}
                {i === 2 && <div className="prod-tag-img last">Last Pieces</div>}
                {i === 3 && <div className="prod-tag-img new">New</div>}
                <div className={`prod-canvas pc-${i+1}`}>
                  <div className="prod-graphic">
                    {i === 0 && <>VIBIN<em>different.</em></>}
                    {i === 1 && <>MOVE<em>different.</em></>}
                    {i === 2 && <>VOL<em>01.</em></>}
                    {i === 3 && <>✦<em>vibin.</em></>}
                    {i === 4 && <>DIFF<em>erent.</em></>}
                    {i === 5 && <>VIBE<em>louder.</em></>}
                    {i === 6 && <>VBN<em>·hvd·</em></>}
                    {i === 7 && <>SUN<em>up.</em></>}
                  </div>
                </div>
                <div
                  className="prod-quick"
                  onClick={() => handleQuickAdd(prod.id)}
                >
                  {addedId === prod.id ? '✓ Added' : '+ Quick Add'}
                </div>
              </div>
              <div className="prod-info">
                <div>
                  <div className="prod-name">{prod.name}</div>
                  <div className="prod-cat">{prod.category}</div>
                </div>
                <div className="prod-price">${prod.price}</div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* CATEGORIES */}
      <div className="sec-hdr">
        <div>
          <div className="sec-eye">Shop By</div>
          <h2 className="sec-title">Cate<em>gory</em></h2>
        </div>
        <a href="/shop" className="sec-link">All Categories →</a>
      </div>

      <div className="categories">
        <div className="cat cat-1">
          <div className="cat-bg"></div>
          <div className="cat-content">
            <div className="cat-num">01 / 03</div>
            <div className="cat-foot">
              <div className="cat-name">Tees</div>
              <div className="cat-count">12 Pieces</div>
              <div className="cat-cta">Shop Tees →</div>
            </div>
          </div>
        </div>
        <div className="cat cat-2">
          <div className="cat-bg"></div>
          <div className="cat-content">
            <div className="cat-num">02 / 03</div>
            <div className="cat-foot">
              <div className="cat-name">Hoodies<br/>+ Crews</div>
              <div className="cat-count">8 Pieces</div>
              <div className="cat-cta">Shop Hoodies →</div>
            </div>
          </div>
        </div>
        <div className="cat cat-3">
          <div className="cat-bg"></div>
          <div className="cat-content">
            <div className="cat-num">03 / 03</div>
            <div className="cat-foot">
              <div className="cat-name">Headwear<br/>+ Acc.</div>
              <div className="cat-count">6 Pieces</div>
              <div className="cat-cta">Shop Accessories →</div>
            </div>
          </div>
        </div>
      </div>

      {/* LOOKBOOK */}
      <section className="lookbook">
        <div className="lb-img"></div>
        <div className="lb-text">
          <div className="lb-eye">Editorial Nº 01 · The Foundation</div>
          <h2 className="lb-title">Built for the <em>quiet</em> ones who move loudest.</h2>
          <p className="lb-body">
            Vibin isn't loud about itself. It moves with intention. Every piece in The Foundation drop was designed for the people who don't need to announce who they are — they show it. Heavyweight cotton. Pre-shrunk. Built to last past the season.
          </p>
          <a href="#" className="btn">View Editorial →</a>
        </div>
      </section>

      {/* MANIFESTO */}
      <section className="manifesto">
        <div className="man-text">
          Vibin <em>different</em> isn't a tagline. It's a posture. <em>Confident.</em> Calm. Community.
        </div>
        <div className="man-credit">— The Vibin Manifesto · Vol. 01</div>
      </section>

      {/* DROP COUNTDOWN */}
      <section className="drop-block">
        <div className="drop-left">
          <div className="drop-eye">Coming Next · Drop 02</div>
          <h2 className="drop-title">Vol. <em>02</em></h2>
          <p className="drop-info">
            The next chapter. Pieces designed for late nights, sunrises, and everything in between. Sign up to get early access — drops always sell out before retail.
          </p>
          <a href="#" className="btn" style={{borderColor:'var(--cream)',color:'var(--cream)'}}>Get Early Access →</a>
        </div>
        <div className="countdown">
          <div className="cd"><div className="cd-num" id="cd-d">14</div><div className="cd-lbl">Days</div></div>
          <div className="cd"><div className="cd-num" id="cd-h">06</div><div className="cd-lbl">Hours</div></div>
          <div className="cd"><div className="cd-num" id="cd-m">23</div><div className="cd-lbl">Minutes</div></div>
          <div className="cd"><div className="cd-num" id="cd-s">47</div><div className="cd-lbl">Seconds</div></div>
        </div>
      </section>

      {/* NEWSLETTER */}
      <section className="newsletter">
        <div className="nl-eye">Join the List</div>
        <h2 className="nl-title">Get <em>15% off</em><br/>your first piece.</h2>
        <p className="nl-body">
          Be the first to know when drops go live. Early access, exclusive pieces, and 15% off your first order. No spam — just the good stuff.
        </p>
        <form className="nl-form" onSubmit={(e) => { e.preventDefault(); e.target.querySelector('.nl-btn').textContent = '✓ Subscribed'; }}>
          <input type="email" className="nl-input" placeholder="your@email.com" required />
          <button type="submit" className="nl-btn">Subscribe</button>
        </form>
        <div className="nl-disclaim">No spam. Unsubscribe anytime.</div>
      </section>

      {/* FOOTER */}
      <footer>
        <div className="foot-top">
          Vibin <em>Different.</em>
        </div>
        <div className="foot-cols">
          <div className="foot-brand">
            <div className="foot-logo">VIBIN</div>
            <div className="foot-tagline">
              A lifestyle streetwear brand from Miami, FL. Now based in Jacksonville. A subsidiary of HVD Holdings. Apparel for those who move different.
            </div>
          </div>
          <div className="foot-col">
            <h4>Shop</h4>
            <ul>
              <li>New Drop</li>
              <li>Tees</li>
              <li>Hoodies</li>
              <li>Headwear</li>
              <li>All Pieces</li>
              <li>Sale</li>
            </ul>
          </div>
          <div className="foot-col">
            <h4>Help</h4>
            <ul>
              <li>Shipping</li>
              <li>Returns</li>
              <li>Size Guide</li>
              <li>Track Order</li>
              <li>Contact</li>
              <li>FAQ</li>
            </ul>
          </div>
          <div className="foot-col">
            <h4>Connect</h4>
            <ul>
              <li>Instagram</li>
              <li>TikTok</li>
              <li>Twitter / X</li>
              <li>Lookbook</li>
              <li>Stockists</li>
              <li>Wholesale</li>
            </ul>
          </div>
        </div>
        <div className="foot-bottom">
          <div>© 2026 Vibin Apparel · A subsidiary of HVD Holdings, LLC · Jacksonville, FL</div>
          <div className="foot-payments">
            <span>VISA</span>
            <span>AMEX</span>
            <span>PAYPAL</span>
            <span>SHOP PAY</span>
            <span>APPLE</span>
          </div>
        </div>
      </footer>

      {/* COUNTDOWN SCRIPT */}
      <script dangerouslySetInnerHTML={{ __html: `
        function tick() {
          let d = parseInt(document.getElementById('cd-s').textContent);
          d--;
          if (d < 0) {
            d = 59;
            let m = parseInt(document.getElementById('cd-m').textContent) - 1;
            if (m < 0) {
              m = 59;
              let h = parseInt(document.getElementById('cd-h').textContent) - 1;
              if (h < 0) {
                h = 23;
                let day = parseInt(document.getElementById('cd-d').textContent) - 1;
                document.getElementById('cd-d').textContent = String(day).padStart(2,'0');
              }
              document.getElementById('cd-h').textContent = String(h).padStart(2,'0');
            }
            document.getElementById('cd-m').textContent = String(m).padStart(2,'0');
          }
          document.getElementById('cd-s').textContent = String(d).padStart(2,'0');
        }
        setInterval(tick, 1000);
      `}} />
    </>
  )
}
