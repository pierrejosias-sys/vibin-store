import Link from 'next/link'
export const metadata = { title: 'VIBIN Apparel', description: 'Lifestyle streetwear brand' }
export default function Home() {
  return (
    <div className="min- h- screen bg- black text- white">
      <nav className="flex justify- between items- center px-6 py-4 border- b border- white/10">
        <Link href="/" className="text- xl font- black tracking- widest">VIBIN</Link>
        <div className="flex gap-6 text- sm">
          <Link href="/shop" className="hover:text-gray-300">SHOP</Link>
          <Link href="/about" className="hover:text-gray-300">ABOUT</Link>
          <Link href="/qa" className="hover:text-gray-300">FAQ</Link>
          <Link href="/admin" className="hover:text-gray-300">ADMIN</Link>
        </div>
      </nav>
      <main className="p-6">
        <h1 className="text-6xl font-black tracking-widest mb-4">VIBIN</h1>
        <p className="text- gray-400 text- xl mb-8">different.</p>
        <Link href="/shop" className="inline- block bg- white text-black px-8 py-4 font- bold">SHOP NOW</Link>
      </main>
      <footer className="fixed bottom-0 left-0 right-0 text- center py-4 text-gray-500 text-sm">
        © 2026 VIBIN Apparel · HVD Holdings, LLC · Jacksonville, FL
      </footer>
    </div>
  )
}
