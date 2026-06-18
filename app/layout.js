import { CartProvider } from './lib/cart-context'
import './globals.css'

export const metadata = {
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
    description: 'Heavyweight cotton streetwear built for those who move different. SS26 Drop 01: The Foundation — now live. Free shipping on orders $75+.',
    images: [{ url: '/og-default.jpg', width: 1200, height: 630, alt: 'Vibin Apparel SS26 Drop 01 — The Foundation Collection' }]
  },
  twitter: {
    card: 'summary_large_image',
    site: '@vibinapparel',
    creator: '@vibinapparel',
    title: 'Vibin Apparel — Jacksonville Streetwear SS26',
    description: 'Heavyweight cotton streetwear built for those who move different. SS26 Drop 01: The Foundation — now live.',
    images: ['/og-default.jpg']
  },
  alternates: { canonical: 'https://vibinapparel.com' }
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
