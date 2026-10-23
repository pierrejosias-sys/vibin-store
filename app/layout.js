import { CartProvider } from './lib/cart-context'
import './globals.css'
// Site-wide styles (nav, promo bar, footer, fonts). Previously only imported by some pages, so a
// direct load of /product/*, /shop, /cart, /drop/* etc. rendered unstyled.
import './styles.css'
import { FREE_SHIPPING_LABEL } from './lib/shipping'
import { getDrop01Status } from './lib/drop-status-server'

// Re-evaluate static pages every 5 min so the meta copy flips when the window opens.
export const revalidate = 300

// "Now live" only once the Drop 01 window is open (DB release_at via getDrop01Status).
export async function generateMetadata() {
  let dropLine = 'SS26 Drop 01: The Foundation.'
  try { dropLine = (await getDrop01Status()).metaLine || dropLine } catch {}
  return {
  metadataBase: new URL('https://vibinapparel.com'),
  title: {
    default: 'Vibin Apparel — Jacksonville Streetwear SS26',
    template: '%s — Vibin Apparel'
  },
  description: 'Vibin Apparel is a Jacksonville streetwear brand built on heavyweight cotton, intentional design, and SS26 drops. Move different. Shop The Foundation collection.',
  keywords: ['Vibin Apparel', 'Jacksonville streetwear', 'SS26', 'heavyweight cotton tees', 'Drop 01', 'The Foundation', 'HVD Holdings', 'move different', 'lifestyle streetwear'],
  authors: [{ name: 'Vibin Apparel', url: 'https://vibinapparel.com' }],
  creator: 'Vibin Apparel',
  publisher: 'HVD Holdings LLC',
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true, 'max-image-preview': 'large' }
  },
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: 'https://vibinapparel.com',
    siteName: 'Vibin Apparel',
    title: 'Vibin Apparel — Jacksonville Streetwear SS26',
    description: `Heavyweight cotton streetwear built for those who move different. ${dropLine} Free shipping on orders ${FREE_SHIPPING_LABEL}+.`,
    images: [{ url: '/og-default.jpg', width: 1200, height: 630, alt: 'Vibin Apparel SS26 Drop 01 — The Foundation Collection' }]
  },
  twitter: {
    card: 'summary_large_image',
    site: '@vibinapparel',
    creator: '@vibinapparel',
    title: 'Vibin Apparel — Jacksonville Streetwear SS26',
    description: `Heavyweight cotton streetwear built for those who move different. ${dropLine}`,
    images: ['/og-default.jpg']
  },
  alternates: { canonical: 'https://vibinapparel.com' }
  }
}

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <CartProvider>
          {children}
        </CartProvider>
      </body>
    </html>
  )
}
