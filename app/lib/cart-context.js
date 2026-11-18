'use client'

import { createContext, useContext, useState, useEffect, useCallback } from 'react'

const CartContext = createContext({ cartCount: 0, updateCart: () => {} })

function readCount() {
  try {
    const items = JSON.parse(localStorage.getItem('vibin_cart') || '[]')
    return Array.isArray(items) ? items.reduce((sum, item) => sum + (Number(item?.qty) || 0), 0) : 0
  } catch {
    return 0
  }
}

export function CartProvider({ children }) {
  const [cartCount, setCartCount] = useState(0)
  const updateCart = useCallback(() => setCartCount(readCount()), [])

  useEffect(() => {
    updateCart()
    // 'storage' covers other tabs and the pages that dispatch it by hand after a quick-add;
    // 'vibin-cart' is the same-tab signal; focus/pageshow catch back-forward-cache restores.
    window.addEventListener('storage', updateCart)
    window.addEventListener('vibin-cart', updateCart)
    window.addEventListener('focus', updateCart)
    window.addEventListener('pageshow', updateCart)
    return () => {
      window.removeEventListener('storage', updateCart)
      window.removeEventListener('vibin-cart', updateCart)
      window.removeEventListener('focus', updateCart)
      window.removeEventListener('pageshow', updateCart)
    }
  }, [updateCart])

  return (
    <CartContext.Provider value={{ cartCount, updateCart }}>
      {children}
    </CartContext.Provider>
  )
}

export function useCart() {
  return useContext(CartContext)
}
