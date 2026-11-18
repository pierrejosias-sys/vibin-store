import Link from 'next/link'
import SiteHeader from './components/SiteHeader'
import SiteFooter from './components/SiteFooter'

export default function NotFound() {
  return (
    <>
      <SiteHeader />
      <main className="nf">
        <div className="nf-eye">Error 404</div>
        <h1 className="nf-title">Lost the <em>vibe.</em></h1>
        <p className="nf-sub">That page doesn&apos;t exist, or it moved. Here&apos;s where to go next.</p>
        <div className="nf-links">
          <Link href="/shop" className="btn primary">Shop</Link>
          <Link href="/drop/01" className="btn">Drop 01</Link>
          <Link href="/lookbook" className="btn">Lookbook</Link>
          <Link href="/contact" className="btn">Contact</Link>
        </div>
      </main>
      <SiteFooter />
    </>
  )
}
