'use client'

import { createContext, useState, useContext, useEffect } from 'react'
import { createPortal } from 'react-dom'

const SearchContext = createContext()

export function SearchProvider({ children }) {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')

  useEffect(() => {
    const handleKey = (e) => {
      if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault()
        setOpen(true)
      }
      if (e.key === 'Escape') setOpen(false)
    }
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [])

  return (
    <SearchContext.Provider value={{ open, setOpen, query, setQuery }}>
      {children}
      <SearchModal />
    </SearchContext.Provider>
  )
}

export function useSearch() {
  return useContext(SearchContext)
}

function SearchModal() {
  const { open, setOpen, query, setQuery } = useSearch()
  const [results, setResults] = useState({ products: [], pages: [] })
  const [catalog, setCatalog] = useState(null)

  // Products come from the products table so search only links to real /product/<slug> pages.
  useEffect(() => {
    if (!open || catalog) return
    let cancelled = false
    import('./supabase-public')
      .then(({ default: supabase }) => supabase.from('products').select('name, slug, price, category'))
      .then(({ data, error }) => {
        if (cancelled) return
        if (error) throw error
        setCatalog((data || []).filter(p => p.slug).map(p => ({
          name: p.name, price: Number(p.price), url: `/product/${p.slug}`,
          tags: `${p.slug} ${p.category || ''}`.toLowerCase(),
        })))
      })
      .catch(() => { if (!cancelled) setCatalog([]) })
    return () => { cancelled = true }
  }, [open, catalog])

  useEffect(() => {
    if (!query.trim()) {
      setResults({ products: [], pages: [] })
      return
    }
    const q = query.toLowerCase()

    const products = (catalog || []).filter(p => p.name.toLowerCase().includes(q) || p.tags.includes(q))

    const pages = [
      { name: 'Shop', url: '/shop', desc: 'Browse all products' },
      { name: 'Drop 01', url: '/drop/01', desc: 'Numbered limited drop' },
      { name: 'Snapback', url: '/snapback', desc: 'Vibin Snapback hat' },
      { name: 'Lanyard', url: '/lanyard', desc: 'Vibin Lanyard' },
      { name: 'Shipping', url: '/shipping', desc: 'Shipping info' },
      { name: 'Lookbook', url: '/lookbook', desc: 'Style inspiration' },
      { name: 'About', url: '/about', desc: 'Our story' },
      { name: 'Ambassador', url: '/ambassador', desc: 'Earn with VIBIN' },
      { name: 'Login', url: '/login', desc: 'Account login' },
      { name: 'Profile', url: '/profile', desc: 'Your account' },
      { name: 'Cart', url: '/cart', desc: 'Shopping cart' },
      { name: 'Checkout', url: '/checkout', desc: 'Complete order' },
      { name: 'Returns', url: '/returns', desc: 'Returns & exchanges' },
      { name: 'Contact', url: '/contact', desc: 'Get in touch' },
    ].filter(p => p.name.toLowerCase().includes(q) || p.desc.toLowerCase().includes(q))

    setResults({ products, pages })
  }, [query, catalog])

  if (!open) return null

  return createPortal(
    <div className={`search-overlay ${open ? 'on' : ''}`} onClick={() => setOpen(false)}>
      <button className="search-close" onClick={() => setOpen(false)}>✕</button>
      <div className="search-box" onClick={e => e.stopPropagation()}>
        <input 
          className="search-input" 
          placeholder="Search..." 
          autoFocus
          value={query}
          onChange={e => setQuery(e.target.value)}
        />
        {query && (
          <div className="search-results">
            {results.products.length > 0 && (
              <div className="search-section">
                <h4>Products</h4>
                {results.products.map((p, i) => (
                  <a key={i} href={p.url} className="search-result">
                    {p.name} <span>${p.price.toFixed(2)}</span>
                  </a>
                ))}
              </div>
            )}
            {results.pages.length > 0 && (
              <div className="search-section">
                <h4>Pages</h4>
                {results.pages.map((p, i) => (
                  <a key={i} href={p.url} className="search-result">
                    {p.name} <span>{p.desc}</span>
                  </a>
                ))}
              </div>
            )}
            {!results.products.length && !results.pages.length && (
              <div className="search-no">No results found</div>
            )}
          </div>
        )}
      </div>
    </div>,
    document.body
  )
}