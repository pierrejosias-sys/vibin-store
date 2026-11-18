import Image from 'next/image'
import Link from 'next/link'
import SiteHeader from '../components/SiteHeader'
import SiteFooter from '../components/SiteFooter'
import './about.css'

export const metadata = {
  title: 'About',
  description: 'Vibin Apparel is a lifestyle streetwear brand based in Jacksonville, FL, a subsidiary of HVD Holdings, LLC. Apparel for those who move different.',
}

const VALUES = [
  { title: 'Quality First', desc: '240 GSM heavyweight cotton. Pre-shrunk. Double-stitched. Built to last past the season, not fall apart after two washes.' },
  { title: 'Intentional Design', desc: "Every graphic, every cut, every stitch has a reason. We don't add anything that doesn't serve the vision." },
  { title: 'Community Driven', desc: "Vibin isn't just a brand — it's a community of people who move different. We grow together, we win together." },
  { title: 'Hype-Free Drops', desc: "No artificial scarcity. No gimmicks. Just quality pieces released when they're ready, not when the calendar says so." },
]

export default function AboutPage() {
  return (
    <>
      <SiteHeader />

      {/* HERO */}
      <section className="ab-hero">
        <div className="ab-eye">About · The Brand</div>
        <h1 className="ab-title">Vibin <em>Different.</em></h1>
        <p className="ab-sub">Apparel for those who move with purpose, dress with intention, and vibe louder than the noise.</p>
      </section>

      {/* MANIFESTO */}
      <section className="manifesto">
        <div className="man-text">
          Vibin <em>different</em> isn&apos;t a tagline. It&apos;s a posture. <em>Confident.</em> Calm. Community.
        </div>
        <div className="man-credit">— The Vibin Manifesto · Vol. 01</div>
      </section>

      {/* STORY */}
      <section className="ab-story">
        <div className="ab-story-text">
          <div className="sec-eye">Our Story</div>
          <h2 className="sec-title">Born in Miami. Built in <em>Jacksonville.</em></h2>
          <p className="ab-body">
            Vibin was born in the heart of Miami, FL — a city that moves to its own rhythm. Now based in Jacksonville, the brand carries that Miami energy into every piece: bold, intentional, and unapologetically different.
          </p>
          <p className="ab-body">
            Vibin isn&apos;t about following trends or chasing hype. It&apos;s about creating quality pieces that speak to the people who don&apos;t need to announce who they are — they show it. Every piece is designed with intention. Heavyweight cotton that lasts. Cuts that fit right. Graphics that mean something.
          </p>
          <p className="ab-body">
            A subsidiary of HVD Holdings, LLC, Vibin represents a new wave of lifestyle streetwear that prioritizes substance over spectacle. Born in Miami. Built in Jacksonville. Shipping across the US.
          </p>
        </div>
        <div className="ab-photo">
          <Image
            src="/brand/lookbook-tee-cream-model.jpg"
            alt="Model wearing a cream oversized Vibin tee"
            fill
            sizes="(max-width: 768px) 100vw, 40vw"
            quality={70}
          />
        </div>
      </section>

      {/* VALUES */}
      <section className="ab-values">
        <div className="sec-eye">What We Stand For</div>
        <h2 className="sec-title">Our <em>Values</em></h2>
        <div className="ab-values-grid">
          {VALUES.map((v, i) => (
            <div className="ab-value" key={v.title}>
              <div className="ab-value-num">{`0${i + 1}`}</div>
              <h3>{v.title}</h3>
              <p>{v.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="ab-cta">
        <h2 className="ab-cta-title">See what we&apos;ve <em>built.</em></h2>
        <div className="ab-cta-btns">
          <Link href="/shop" className="btn primary">Shop The Drop <span className="arrow">→</span></Link>
          <Link href="/lookbook" className="btn">Lookbook</Link>
        </div>
      </section>

      <SiteFooter />
    </>
  )
}
