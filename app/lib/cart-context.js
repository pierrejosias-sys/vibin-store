'use client'

import { createContext, useContext, useState, useEffect } from 'react'

const CartContext = createContext()

export function CartProvider({ children }) {
  const [cartCount, setCartCount] = useState(0)

  useEffect(() => {
    const saved = localStorage.getItem('vibin_cart')
    if (saved) {
      const items = JSON.parse(saved)
      const count = items.reduce((sum, item) => sum + item.qty, 0)
      setCartCount(count)
    }
  }, [])

  function updateCart() {
    const saved = localStorage.getItem('vibin_cart')
    if (saved) {
      const items = JSON.parse(saved)
      const count = items.reduce((sum, item) => sum + item.qty, 0)
      setCartCount(count)
    } else {
      setCartCount(0)
    }
  }

  return (
    <CartContext.Provider value={{ cartCount, updateCart }}>
      {children}
    </CartContext.Provider>
  )
}

export function useCart() {
  return useContext(CartContext)
}
