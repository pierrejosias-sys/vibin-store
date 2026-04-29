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

  useEffect(() => {
    if (!query.trim()) {
      setResults({ products: [], pages: [] })
      return
    }
    const q = query.toLowerCase()
    
    const products = [
      { name: 'Foundation Tee', price: 48, url: '/product/foundation-tee', tags: 'basic cotton t-shirt white black' },
      { name: 'Move Different Tee', price: 52, url: '/product/move-different-tee', tags: 'graphic print oversized' },
      { name: 'Vol 01 Hoodie', price: 98, url: '/product/vol-01-hoodie', tags: 'hoodie sweatshirt' },
      { name: 'VIBIN Cap', price: 38, url: '/product/vibin-cap', tags: 'hat snapback' },
      { name: 'Cargo Pant', price: 88, url: '/product/cargo-pant', tags: 'pants trousers utility' },
    ].filter(p => p.name.toLowerCase().includes(q) || p.tags.includes(q))

    const pages = [
      { name: 'Shop', url: '/shop', desc: 'Browse all products' },
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
  }, [query])

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
                    {p.name} <span>${p.price}</span>
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