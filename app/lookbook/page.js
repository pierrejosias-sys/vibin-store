import Image from 'next/image'
import Link from 'next/link'
import SiteHeader from '../components/SiteHeader'
import SiteFooter from '../components/SiteFooter'

export const metadata = {
  title: 'Lookbook',
  description: 'Editorial Nº 01: The Foundation. SS26 Drop 01 from Vibin Apparel, Jacksonville. Shop each look.'
}

// Each look: the photo, what it actually shows, and where "shop the look" goes.
const LOOKS = [
  {
    src: '/brand/lookbook-tee-cream-model.jpg',
    alt: 'Model in a cream oversized Vibin tee against a deep teal backdrop',
    title: 'The Foundation Tee',
    detail: 'Oversized · Cream',
    href: '/product/vibin-classic-tee',
    cta: 'Shop the tee',
    pos: '50% 30%',
  },
  {
    src: '/brand/cat-hoodie-black-model.jpg',
    alt: 'Model in a black oversized Vibin hoodie with a tonal mark, in soft concrete light',
    title: 'The Oversized Hoodie',
    detail: 'Oversized · Black',
    href: '/product/vibin-oversized-hoodie',
    cta: 'Shop the hoodie',
    pos: '50% 35%',
  },
]

export default function LookbookPage() {
  return (
    <>
      <SiteHeader dark />
      <main className="lk">
        <section className="lk-hero">
          <div className="lk-eye">Editorial Nº 01</div>
          <h1 className="lk-title">The <em>Foundation</em></h1>
          <p className="lk-sub">SS26 · Drop 01 · Jacksonville</p>
        </section>

        <section className="lk-grid">
          {LOOKS.map((look, i) => (
            <article key={look.src} className={`lk-card${look.wide ? ' lk-card--wide' : ''}`}>
              <Link href={look.href} className="lk-photo" aria-label={`${look.title}: ${look.cta}`}>
                <Image
                  src={look.src}
                  alt={look.alt}
                  fill
                  sizes={look.wide ? '(max-width: 1200px) 100vw, 1200px' : '(max-width: 700px) 100vw, 600px'}
                  quality={75}
                  priority={i === 0}
                  style={{ objectFit: 'cover', objectPosition: look.pos }}
                />
                <span className="lk-tag">Look 0{i + 1}</span>
              </Link>
              <div className="lk-meta">
                <div>
                  <h2 className="lk-name">{look.title}</h2>
                  <p className="lk-detail">{look.detail}</p>
                </div>
                <Link href={look.href} className="lk-cta">{look.cta} →</Link>
              </div>
            </article>
          ))}
        </section>
      </main>
      <SiteFooter />
    </>
  )
}
