import './styles.css'
import { SpeedInsights } from "@vercel/speed-insights/next"
import { Analytics } from '@vercel/analytics/next'
import { CartProvider } from './lib/cart-context'

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Anton&family=Manrope:wght@300;400;500;600;700;800&family=JetBrains+Mono:wght@300;400;500&display=swap" rel="stylesheet" />
      </head>
      <body>
        <CartProvider>
          {children}
          <SpeedInsights />
          <Analytics />
          <script src="/chatbot.js" strategy="lazyOnload" />
          <script dangerouslySetInnerHTML={{ __html: `
            window.addEventListener('load', function() {
              if (!document.getElementById('vibin-chat-bubble')) {
                const bubble = document.createElement('div');
                bubble.id = 'vibin-chat-bubble';
                bubble.innerHTML = '💬';
                bubble.style.cssText = 'position:fixed;bottom:24px;right:24px;width:60px;height:60px;border-radius:50%;background:#ff4a3d;color:#f6f1e7;display:flex;align-items:center;justify-content:center;font-size:24px;cursor:pointer;z-index:1000;border:none;box-shadow:0 4px 12px rgba(255,74,61,0.3);';
                document.body.appendChild(bubble);
                bubble.onclick = function() { alert('Support chat coming soon! For now, email returns@vibinstore.com'); };
              }
            });
          ` }} />
        </CartProvider>
      </body>
    </html>
  )
}