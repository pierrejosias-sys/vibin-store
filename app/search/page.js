'use client'

import { Suspense, useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { supabase } from '../lib/supabase'
import { productImage } from '../lib/product-image'
import { coverImage } from '../lib/product-extras.mjs'
import { DROP_STYLE_IMAGES } from '../lib/drop-catalog.mjs'
import { DROP_01 } from '../lib/drop-public.mjs'
import { formatPrice } from '../lib/shop-filters.mjs'
import ProductThumb from '../components/ProductThumb'
import SiteHeader from '../components/SiteHeader'
import SiteFooter from '../components/SiteFooter'

const PAGES = [
  { title: 'Drop 01: The Foundation', href: '/drop/01', words: 'drop pre-order preorder countdown waitlist early access' },
  { title: 'Lookbook', href: '/lookbook', words: 'lookbook editorial photos looks' },
  { title: 'Vibin Verify', href: '/verify', words: 'verify authenticity tag points rewards' },
  { title: 'Shipping', href: '/shipping', words: 'shipping delivery tracking' },
  { title: 'Returns', href: '/returns', words: 'returns refund exchange' },
  { title: 'FAQ', href: '/qa', words: 'faq questions answers help size sizing' },
  { title: 'Contact', href: '/contact', words: 'contact email support help' },
  { title: 'Ambassador program', href: '/ambassador', words: 'ambassador referral earn' },
  { title: 'About Vibin', href: '/about', words: 'about story brand jacksonville' },
]

// Words shoppers use that the catalog spells differently.
const SYNONYMS = { shirt: ['tee'], tshirt: ['tee'], 't-shirt': ['tee'], sweatshirt: ['hoodie', 'crewneck'], pants: ['jogger', 'cargo'], hat: ['snapback', 'cap'], cap: ['snapback'], bag: ['tote'] }

// "hoodies" should find "hoodie", "shorts" should find "short".
function forms(word) {
  const out = new Set([word, ...(SYNONYMS[word] || [])])
  if (word.length > 3) {
    if (word.endsWith('ies')) out.add(word.slice(0, -3) + 'y')
    if (word.endsWith('es')) out.add(word.slice(0, -2))
    if (word.endsWith('s')) out.add(word.slice(0, -1))
  }
  return [...out]
}

function matches(haystack, words) {
  const h = haystack.toLowerCase()
  return words.every(w => forms(w).some(f => h.includes(f)))
}

function SearchContent() {
  const router = useRouter()
  const params = useSearchParams()
  const q = (params.get('q') || '').trim()
  const [input, setInput] = useState(q)
  const [products, setProducts] = useState(null)
  const [styles, setStyles] = useState([])

  useEffect(() => { setInput(q) }, [q])

  useEffect(() => {
    let alive = true
    Promise.all([
      supabase.from('products').select('id,name,slug,price,category,color,image_url,images,tags').order('created_at', { ascending: false }),
      supabase.from('drop_styles').select('drop_id,style_code,name,price').order('sort_order'),
    ]).then(([p, s]) => {
      if (!alive) return
      setProducts(p.data || [])
      setStyles(s.data || [])
    }).catch(() => { if (alive) setProducts([]) })
    return () => { alive = false }
  }, [])

  // Products: the same rows /shop lists. Drop 01 styles are not shop products (they are sold on
  // /drop/01), so they get their own section, and hidden styles are left out.
  const catalog = useMemo(() => (products || []).map(p => ({
      key: `p-${p.id}`,
      name: p.name,
      price: p.price,
      color: p.color,
      sub: p.category,
      href: `/product/${p.slug || p.id}`,
      image: productImage(p) || coverImage(p)?.src || null,
      hay: [p.name, p.category, p.color, p.slug, ...(Array.isArray(p.tags) ? p.tags : [])].filter(Boolean).join(' '),
    })), [products])

  const dropCatalog = useMemo(() => styles
    .map(s => ({ s, availability: s.drop_id === DROP_01.id ? (DROP_01.availability[s.style_code] || 'hidden') : 'hidden' }))
    .filter(({ availability }) => availability !== 'hidden')
    .map(({ s, availability }) => ({
      key: `d-${s.drop_id}-${s.style_code}`,
      name: s.name,
      price: s.price,
      color: null,
      sub: `Drop ${s.drop_id.replace(/^d/, '')}${availability === 'coming-soon' ? ' · Coming soon' : ' · Pre-order'}`,
      href: `/drop/${s.drop_id.replace(/^d/, '')}#style-${s.style_code}`,
      image: DROP_STYLE_IMAGES[s.drop_id]?.[s.style_code]?.[0] || null,
      hay: `${s.name} drop ${s.drop_id} pre-order`,
    })), [styles])

  const words = q.toLowerCase().split(/\s+/).filter(Boolean)
  const results = words.length ? catalog.filter(c => matches(c.hay, words)) : []
  const dropResults = words.length ? dropCatalog.filter(c => matches(c.hay, words)) : []
  const pageHits = words.length ? PAGES.filter(p => matches(`${p.title} ${p.words}`, words)) : []
  const loading = products === null

  function submit(e) {
    e.preventDefault()
    const next = input.trim()
    router.replace(next ? `/search?q=${encodeURIComponent(next)}` : '/search')
  }

  return (
    <main className="srch">
      <form className="srch-form" onSubmit={submit} role="search">
        <input
          className="srch-input"
          type="search"
          value={input}
          onChange={e => setInput(e.target.value)}
          placeholder="Search Vibin"
          aria-label="Search Vibin"
          autoFocus
        />
        <button className="srch-go" type="submit">Search</button>
      </form>

      {words.length > 0 && (
        <div className="srch-meta">
          {loading ? 'Searching…' : `${results.length + dropResults.length} ${results.length + dropResults.length === 1 ? "result" : "results"} for “${q}”`}
        </div>
      )}

      {words.length > 0 && !loading && results.length === 0 && dropResults.length === 0 && pageHits.length === 0 && (
        <p className="srch-empty">Nothing matched. Try “hoodie”, “tee”, “snapback” or “shorts”, or browse everything below.</p>
      )}

      {results.length > 0 && <ItemGrid items={results} />}

      {dropResults.length > 0 && (
        <>
          <h2 className="srch-h2">Drop 01</h2>
          <ItemGrid items={dropResults} />
        </>
      )}

      {pageHits.length > 0 && (
        <>
          <h2 className="srch-h2">Pages</h2>
          <div className="srch-pages">
            {pageHits.map(p => <Link key={p.href} href={p.href} className="srch-page">{p.title}</Link>)}
          </div>
        </>
      )}

      {(!words.length || (!loading && results.length === 0 && dropResults.length === 0)) && !loading && (
        <>
          <h2 className="srch-h2">{words.length ? 'Browse everything' : 'All pieces'}</h2>
          <ItemGrid items={catalog} />
          {dropCatalog.length > 0 && (
            <>
              <h2 className="srch-h2">Drop 01</h2>
              <ItemGrid items={dropCatalog} />
            </>
          )}
        </>
      )}
    </main>
  )
}

function ItemGrid({ items }) {
  return (
    <div className="srch-grid">
      {items.map(it => (
        <Link key={it.key} href={it.href} className="srch-card">
          <div className="pt">
            <ProductThumb src={it.image} name={it.name} color={it.color} />
          </div>
          <div className="srch-name">{it.name}</div>
          <div className="srch-sub">{it.sub}{it.price != null ? ` · ${formatPrice(it.price)}` : ''}</div>
        </Link>
      ))}
    </div>
  )
}

export default function SearchPage() {
  return (
    <>
      <SiteHeader />
      <Suspense fallback={<main className="srch" />}>
        <SearchContent />
      </Suspense>
      <SiteFooter />
    </>
  )
}
