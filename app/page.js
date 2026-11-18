import Link from 'next/link'
import Image from 'next/image'
import SiteHeader from './components/SiteHeader'
import SiteFooter from './components/SiteFooter'
import ProductThumb from './components/ProductThumb'
import HomeDrop from './components/HomeDrop'
import HomeNewsletter from './components/HomeNewsletter'
import ReferralTracker from './components/ReferralTracker'
import { getProducts } from './lib/catalog'
import { FREE_SHIPPING_LABEL } from './lib/shipping'
import { productImage, canOptimizeImage } from './lib/product-image'
import { productSubtitle, formatPrice } from './lib/shop-filters.mjs'
import { featuredForHome, homeCategories } from './lib/home-helpers.mjs'

// Built once and refreshed in the background every minute: visitors get the page (with product photos
// and counts already in it) straight from the cache instead of waiting on a database call in the browser.
export const revalidate = 60

export default async function HomePage() {
  let products = []
  try {
    products = await getProducts()
  } catch {
    // The page still renders; the product sections show a friendly empty state.
  }
  const featured = featuredForHome(products, 8)
  const categories = homeCategories(products)

  return (
    <>
      <ReferralTracker />
      <SiteHeader />

      {/* HERO */}
      <section className="hero">
        <div className="hero-img" role="img" aria-label="Model wearing the black VIBIN. hoodie"></div>
        <div className="hero-grain"></div>
        <div className="hero-content">
          <div className="hero-top">
            <div className="hero-meta">
              <strong>SS26 Collection</strong> · Drop 01<br />
              Vol. I — The Foundation
            </div>
            <div className="hero-meta">
              Designed · Jacksonville FL<br />
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
              <Link href="/shop" className="btn primary">Shop The Drop <span className="arrow">→</span></Link>
              <Link href="/lookbook" className="btn">Lookbook</Link>
            </div>
          </div>
        </div>
      </section>

      {/* MARQUEE: true in every phase of the drop */}
      <div className="marquee">
        <div className="marquee-track">
          <span>DROP 01 · NOV 19</span>
          <span><em>The Foundation</em></span>
          <span>NEW ARRIVALS</span>
          <span>FREE SHIPPING {FREE_SHIPPING_LABEL}+</span>
          <span>DROP 01 · NOV 19</span>
          <span><em>The Foundation</em></span>
          <span>NEW ARRIVALS</span>
          <span>FREE SHIPPING {FREE_SHIPPING_LABEL}+</span>
        </div>
      </div>

      {/* THE DROP */}
      <div className="sec-hdr">
        <div>
          <div className="sec-eye">SS26 · Drop 01</div>
          <h2 className="sec-title">The <em>Foundation</em></h2>
        </div>
        <Link href="/shop" className="sec-link">View All Products →</Link>
      </div>

      {featured.length > 0 ? (
        <div className="products">
          {featured.map((p, i) => {
            const soldOut = p.in_stock === false
            const isNew = Array.isArray(p.tags) && p.tags.includes('new')
            const was = Number(p.compare_price) > Number(p.price) ? Number(p.compare_price) : null
            return (
              <Link key={p.id} href={`/product/${p.slug || p.id}`} prefetch={false} className={`prod${soldOut ? ' is-sold' : ''}`}>
                <div className="prod-img prod-img--photo">
                  {soldOut ? <div className="prod-tag-img last">Sold out</div> : isNew ? <div className="prod-tag-img new">New</div> : null}
                  <ProductThumb
                    src={productImage(p, 'square')}
                    name={p.name}
                    color={p.color}
                    alt=""
                    priority={i < 2}
                    sizes="(max-width: 900px) 50vw, 25vw"
                  />
                </div>
                <div className="prod-info">
                  <div>
                    <div className="prod-name">{p.name}</div>
                    <div className="prod-cat">{productSubtitle(p)}</div>
                  </div>
                  <div className="prod-price">
                    {was ? <span className="prod-was">{formatPrice(was)}</span> : null}
                    {formatPrice(p.price)}
                  </div>
                </div>
              </Link>
            )
          })}
        </div>
      ) : (
        <div className="products products--empty">
          <p>New pieces are on the way.</p>
          <Link href="/drop/01" className="sec-link">See Drop 01 →</Link>
        </div>
      )}

      {/* CATEGORIES: only categories that have pieces, with real counts and photos */}
      {categories.length > 0 && (
        <>
          <div className="sec-hdr">
            <div>
              <div className="sec-eye">Shop By</div>
              <h2 className="sec-title">Cate<em>gory</em></h2>
            </div>
            <Link href="/shop" className="sec-link">All Categories →</Link>
          </div>

          <div className="categories">
            {categories.map((c, i) => (
              <Link key={c.key} href={c.href} prefetch={false} className="cat">
                <div className="cat-bg">
                  {c.image ? (
                    <Image
                      src={c.image}
                      alt=""
                      fill
                      sizes="(max-width: 700px) 100vw, 50vw"
                      quality={70}
                      unoptimized={!canOptimizeImage(c.image)}
                      style={{ objectFit: 'cover', objectPosition: 'center 30%' }}
                    />
                  ) : null}
                </div>
                <div className="cat-shade"></div>
                <div className="cat-content">
                  <div className="cat-num">{`${String(i + 1).padStart(2, '0')} / ${String(categories.length).padStart(2, '0')}`}</div>
                  <div className="cat-foot">
                    <div className="cat-name">{c.label}</div>
                    <div className="cat-count">{`${c.count} ${c.count === 1 ? 'Piece' : 'Pieces'}`}</div>
                    <span className="cat-cta">{`Shop ${c.label} →`}</span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </>
      )}

      {/* LOOKBOOK */}
      <section className="lookbook">
        <div className="lb-img"></div>
        <div className="lb-text">
          <div className="lb-eye">Editorial Nº 01 · The Foundation</div>
          <h2 className="lb-title">Built for the <em>quiet</em> ones who move loudest.</h2>
          <p className="lb-body">
            Vibin isn&apos;t loud about itself. It moves with intention. Every piece in The Foundation drop was designed for the people who don&apos;t need to announce who they are — they show it. Heavyweight cotton. Pre-shrunk. Built to last past the season.
          </p>
          <Link href="/lookbook" className="btn">View Editorial →</Link>
        </div>
      </section>

      {/* MANIFESTO */}
      <section className="manifesto">
        <div className="man-text">
          Vibin <em>different</em> isn&apos;t a tagline. It&apos;s a posture. <em>Confident.</em> Calm. Community.
        </div>
        <div className="man-credit">— The Vibin Manifesto · Vol. 01</div>
      </section>

      {/* DROP 01 COUNTDOWN (follows the pre-order window) */}
      <HomeDrop />

      {/* NEWSLETTER */}
      <section id="email-signup" className="newsletter">
        <div className="nl-eye">Join the List</div>
        <h2 className="nl-title">Get <em>15% off</em><br />your first piece.</h2>
        <p className="nl-body">
          Be the first to know when drops go live. Early access, exclusive pieces, and 15% off your first order. No spam — just the good stuff.
        </p>
        <HomeNewsletter />
        <div className="nl-disclaim">No spam. Unsubscribe anytime.</div>
      </section>

      <SiteFooter />
    </>
  )
}
