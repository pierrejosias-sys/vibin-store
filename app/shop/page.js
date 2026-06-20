'use client'

import { useState, useEffect, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { supabase } from '../lib/supabase'
import { useCart } from '../lib/cart-context'

export const metadata = {
  title: 'Shop SS26 Drop 01 — Vibin Apparel',
  description: 'Shop Vibin Apparel\'s SS26 Drop 01: The Foundation. Heavyweight cotton tees, hoodies, crewnecks, and headwear. Jacksonville streetwear. Free shipping on orders $75+.',
  alternates: { canonical: 'https://vibinapparel.com/shop' },
  openGraph: {
    title: 'Shop SS26 Drop 01 — Vibin Apparel',
    description: 'Shop heavyweight cotton tees, hoodies, and accessories from Vibin Apparel\'s SS26 Drop 01: The Foundation. Jacksonville streetwear. Free shipping $75+.',
    url: 'https://vibinapparel.com/shop',
    images: [{ url: '/og-shop.jpg', width: 1200, height: 630, alt: 'Vibin Apparel SS26 Shop — Drop 01 The Foundation Collection' }]
  },
  twitter: {
    card: 'summary_large_image',
    site: '@vibinapparel',
    title: 'Shop SS26 Drop 01 — Vibin Apparel',
    description: 'Heavyweight cotton tees, hoodies, crewnecks, and headwear. Jacksonville streetwear. Free shipping $75+.',
    images: ['/og-shop.jpg']
  }
}

// Fix #13: expanded CATEGORY_MAP to match all product category strings including Cargo Pant
const CATEGORY_MAP = {
  tees: 'Tee',
  hoodies: 'Hoodie',
  crewnecks: 'Sweatshirt',
  accessories: 'Headwear',
  bottoms: 'Bottom',
  pants: 'Pant',
  cargo: 'Cargo',
}

// Fix #13: bottoms filter now catches both 'Bottom' AND 'Pant' (Cargo Pant, Sweatpant, etc.)
function matchesFilter(product, filter) {
  if (filter === 'all') return true
  const cat = product.category?.toLowerCase() || ''
  if (filter === 'bottoms') {
    return cat.includes('bottom') || cat.includes('pant') || cat.includes('short') || cat.includes('cargo')
  }
  if (filter === 'accessories') {
    return cat.includes('headwear') || cat.includes('cap') || cat.includes('beanie') || cat.includes('accessory')
  }
  const key = (CATEGORY_MAP[filter] || filter).toLowerCase()
  return cat.includes(key)
}

function ShopContent() {
  const searchParams = useSearchParams()
  const catParam = searchParams.get('cat')
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [activeFilter, setActiveFilter] = useState(catParam || 'all')
  const [addedId, setAddedId] = useState(null)
  const { cartCount } = useCart()

  useEffect(() => { fetchProducts() }, [])
  useEffect(() => { if (catParam) setActiveFilter(catParam) }, [catParam])

  async function fetchProducts() {
    const { data } = await supabase.from('products').select('*').order('created_at', { ascending: false })
    if (data && data.length > 0) {
      setProducts(data)
    } else {
      setProducts([
        { id: 1, name: 'Foundation Tee — Black', price: 48, category: 'Tee · Heavyweight', color: 'Black' },
        { id: 2, name: 'Move Different Tee — Cream', price: 48, category: 'Tee · Heavyweight', color: 'Cream' },
        { id: 3, name: 'Vol 01 Hoodie — Coral', price: 98, category: 'Hoodie · Heavyweight Fleece', color: 'Coral' },
        { id: 4, name: 'Mark Hoodie — Onyx', price: 98, category: 'Hoodie · Heavyweight Fleece', color: 'Onyx' },
        { id: 5, name: 'Different Crewneck — Violet', price: 78, category: 'Sweatshirt · Cotton Blend', color: 'Violet' },
        { id: 6, name: 'Louder Cap — Acid', price: 38, category: 'Headwear · 6-Panel', color: 'Acid' },
        { id: 7, name: 'VBN Heavyweight Tee — Forest', price: 48, category: 'Tee · Heavyweight', color: 'Forest' },
        { id: 8, name: 'Sunup Beanie — Sun', price: 32, category: 'Headwear · Knit', color: 'Sun' },
        { id: 9, name: 'Foundation Cargo Pant — Black', price: 88, category: 'Cargo Pant · Heavyweight', color: 'Black' },
      ])
    }
    setLoading(false)
  }

  function handleQuickAdd(id, name, price, color) {
    try {
      const cart = JSON.parse(localStorage.getItem('vibin_cart') || '[]')
      const existing = cart.find(item => item.id === id)
      if (existing) { existing.qty += 1 } else { cart.push({ id, name, price, color, size: 'M', qty: 1 }) }
      localStorage.setItem('vibin_cart', JSON.stringify(cart))
      window.dispatchEvent(new Event('storage'))
    } catch (e) {}
    setAddedId(id)
    setTimeout(() => setAddedId(null), 1800)
  }

  const filtered = products.filter(p => matchesFilter(p, activeFilter))

  // Fix #6: filter labels now match exactly so active state highlights correctly
  const FILTERS = [
    { key: 'all', label: 'All Pieces' },
    { key: 'tees', label: 'Tees' },
    { key: 'hoodies', label: 'Hoodies' },
    { key: 'crewnecks', label: 'Crewnecks' },
    { key: 'bottoms', label: 'Bottoms' },
    { key: 'accessories', label: 'Accessories' },
  ]

  return (
    <div style={{background:'#0a0a0a',minHeight:'100vh',color:'#f6f1e7',fontFamily:'Manrope,sans-serif'}}>
      {/* Fix #6: nav links all use correct internal routes */}
      <nav style={{display:'flex',justifyContent:'space-between',alignItems:'center',padding:'20px 40px',borderBottom:'1px solid #1a1a1a',position:'sticky',top:0,background:'rgba(10,10,10,0.95)',backdropFilter:'blur(12px)',zIndex:100}}>
        <Link href="/" style={{fontFamily:'Anton,sans-serif',fontSize:'24px',color:'#f6f1e7',textDecoration:'none',letterSpacing:'0.05em'}}>VIBIN</Link>
        <div style={{display:'flex',gap:'32px',fontSize:'14px'}}>
          <Link href="/shop" style={{color:'#ff6b4a',textDecoration:'none',fontWeight:600}}>Shop</Link>
          <Link href="/drop-01" style={{color:'#f6f1e7',textDecoration:'none'}}>Drop 01</Link>
          <Link href="/lookbook" style={{color:'#f6f1e7',textDecoration:'none'}}>Lookbook</Link>
          <Link href="/about" style={{color:'#f6f1e7',textDecoration:'none'}}>About</Link>
        </div>
        <Link href="/cart" style={{color:'#f6f1e7',textDecoration:'none',fontSize:'20px'}}>
          🛒{cartCount > 0 && <span style={{background:'#ff6b4a',color:'#fff',borderRadius:'50%',fontSize:'10px',padding:'2px 5px',marginLeft:'4px'}}>{cartCount}</span>}
        </Link>
      </nav>
      <div style={{padding:'48px 40px 24px'}}>
        <div style={{marginBottom:'8px',fontSize:'12px',color:'#888',letterSpacing:'0.1em',textTransform:'uppercase',fontFamily:'JetBrains Mono,monospace'}}>SS26 · Drop 01</div>
        <h1 style={{fontFamily:'Anton,sans-serif',fontSize:'clamp(36px,6vw,72px)',letterSpacing:'0.02em',textTransform:'uppercase',marginBottom:'32px'}}>The Foundation</h1>
        <div style={{display:'flex',gap:'12px',flexWrap:'wrap',marginBottom:'40px'}}>
          {FILTERS.map(({ key, label }) => (
            <button key={key} onClick={() => setActiveFilter(key)} style={{padding:'8px 20px',fontSize:'13px',fontFamily:'Manrope,sans-serif',fontWeight:600,textTransform:'capitalize',letterSpacing:'0.05em',cursor:'pointer',border:'1px solid',borderRadius:'2px',transition:'all 0.18s',background:activeFilter===key?'#f6f1e7':'transparent',color:activeFilter===key?'#0a0a0a':'#f6f1e7',borderColor:activeFilter===key?'#f6f1e7':'#333'}}>
              {label}
            </button>
          ))}
          <span style={{marginLeft:'auto',fontSize:'13px',color:'#666',alignSelf:'center'}}>{filtered.length} {filtered.length === 1 ? 'piece' : 'pieces'}</span>
        </div>
      </div>
      <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(280px,1fr))',gap:'2px',padding:'0 40px 80px'}}>
        {loading ? (
          Array(8).fill(0).map((_,i) => <div key={i} style={{background:'#111',aspectRatio:'3/4'}} />)
        ) : filtered.length === 0 ? (
          <div style={{gridColumn:'1/-1',textAlign:'center',padding:'80px',color:'#666'}}>
            <div style={{fontSize:'48px',marginBottom:'16px'}}>∅</div>
            <div style={{fontSize:'16px'}}>No pieces in this category yet.</div>
            <button onClick={() => setActiveFilter('all')} style={{marginTop:'24px',padding:'12px 32px',background:'transparent',border:'1px solid #f6f1e7',color:'#f6f1e7',cursor:'pointer',fontFamily:'Manrope,sans-serif',fontSize:'14px'}}>View All</button>
          </div>
        ) : (
          filtered.map((prod) => (
            <div key={prod.id} style={{background:'#111',position:'relative',cursor:'pointer',overflow:'hidden',aspectRatio:'3/4',display:'flex',flexDirection:'column'}}>
              <div
                style={{flex:1,display:'flex',alignItems:'center',justifyContent:'center',padding:'40px 24px'}}
                role="img"
                aria-label={`${prod.name} — ${prod.color || ''} colorway, Vibin Apparel SS26 Drop 01`}
              >
                <div style={{textAlign:'center',lineHeight:1}}>
                  <div style={{fontFamily:'Anton,sans-serif',fontSize:'clamp(28px,4vw,48px)',letterSpacing:'0.05em',color:'#f6f1e7',textTransform:'uppercase'}}>{prod.name?.split('—')[0]?.trim()}</div>
                  <div style={{fontFamily:'Anton,sans-serif',fontSize:'clamp(18px,3vw,32px)',color:'#ff6b4a',fontStyle:'italic',textTransform:'uppercase'}}>{prod.color}</div>
                </div>
              </div>
              <div style={{padding:'16px 20px',borderTop:'1px solid #1a1a1a',display:'flex',justifyContent:'space-between',alignItems:'center'}}>
                <div>
                  <div style={{fontSize:'14px',fontWeight:600,marginBottom:'2px'}}>{prod.name}</div>
                  <div style={{fontSize:'12px',color:'#888',fontFamily:'JetBrains Mono,monospace'}}>{prod.category}</div>
                </div>
                <div style={{fontSize:'16px',fontWeight:700}}>${prod.price}</div>
              </div>
              <button
                onClick={() => handleQuickAdd(prod.id, prod.name, prod.price, prod.color)}
                style={{position:'absolute',bottom:'60px',left:0,right:0,background:addedId===prod.id?'#2a5c2a':'rgba(0,0,0,0.85)',color:'#f6f1e7',border:'none',padding:'12px',fontSize:'13px',fontFamily:'Manrope,sans-serif',fontWeight:700,cursor:'pointer',letterSpacing:'0.05em',opacity:0,transition:'opacity 0.2s'}}
                onMouseEnter={e => e.currentTarget.style.opacity='1'}
                onMouseLeave={e => e.currentTarget.style.opacity='0'}
                aria-label={`Quick add ${prod.name} to cart`}
              >
                {addedId === prod.id ? '✓ Added to Cart' : '+ Quick Add'}
              </button>
              <Link href={`/product/${prod.id}`} style={{position:'absolute',inset:0}} aria-label={`View ${prod.name} details`} />
            </div>
          ))
        )}
      </div>
    </div>
  )
}

export default function ShopPage() {
  return (
    <Suspense fallback={<div style={{background:'#0a0a0a',minHeight:'100vh',display:'flex',alignItems:'center',justifyContent:'center',color:'#f6f1e7'}}>Loading...</div>}>
      <ShopContent />
    </Suspense>
  )
}
