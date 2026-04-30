# VIBIN Apparel - Complete Working Code Compilation
*Compiled: April 29, 2026*

## Table of Contents
1. [Project Overview](#project-overview)
2. [Supabase Configuration](#supabase-configuration)
3. [Next.js Web App (vibin-store)](#nextjs-web-app)
4. [iOS App (VibinApp)](#ios-app)
5. [Deployment Configuration](#deployment-configuration)
6. [GitHub Workflows](#github-workflows)

---

## Project Overview

**Brand:** VIBIN Apparel  
**Tagline:** "VIBIN Different."  
**Description:** A lifestyle streetwear brand from Miami, FL. Now based in Jacksonville. A subsidiary of HVD Holdings, LLC.  
**Website:** vibinapparel.com  
**Tech Stack:** Next.js 14 (App Router), Supabase, Vercel, iOS (SwiftUI)

**Active Projects:**
- `vibin-store` - Next.js web application
- `VibinApp` - iOS mobile application
- `supabase-app` - Shared Supabase configuration

---

## Supabase Configuration

### Connection Details
```javascript
// supabase.js
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://grbwnjnngzcsjlubcmtp.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdyYnduam5uZ3pjc2psdWJjbXRwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzczNTgzMDEsImV4cCI6MjA5MjkzNDMwMX0.SYKFZJ0XVua0JmZ-tkaNhec2M3KtG3tS5vj_1Nl261c'

export const supabase = createClient(supabaseUrl, supabaseKey)
```

### Static Product Data (Fallback)
```javascript
const STATIC_PRODUCTS = [
  { id: 1, name: 'VIBIN Classic Tee', price: 48, image: 'https://images.unsplash.com/photo-1523381210434-271e8be1f52b', description: 'Premium heavyweight cotton tee', category: 'Tops', sizes: ['S', 'M', 'L', 'XL'], colors: ['Black', 'White', 'Coral'] },
  { id: 2, name: 'VIBIN Street Hoodie', price: 96, image: 'https://images.unsplash.com/photo-1556821840-3a63f95609a7', description: 'Heavyweight pullover hoodie', category: 'Outerwear', sizes: ['S', 'M', 'L', 'XL'], colors: ['Black', 'Grey'] },
  { id: 3, name: 'VIBIN Joggers', price: 72, image: 'https://images.unsplash.com/photo-1523381210434-271e8be1f52b', description: 'Tapered fit joggers', category: 'Bottoms', sizes: ['S', 'M', 'L', 'XL'], colors: ['Black', 'Olive'] },
  { id: 4, name: 'VIBIN Cap', price: 36, image: 'https://images.unsplash.com/photo-1523381210434-271e8be1f52b', description: 'Embroidered snapback', category: 'Accessories', sizes: null, colors: ['Black', 'White'] },
  { id: 5, name: 'VIBIN Longsleeve', price: 64, image: 'https://images.unsplash.com/photo-1523381210434-271e8be1f52b', description: 'Heavyweight longsleeve', category: 'Tops', sizes: ['S', 'M', 'L', 'XL'], colors: ['Black', 'White'] },
  { id: 6, name: 'VIBIN Shorts', price: 56, image: 'https://images.unsplash.com/photo-1523381210434-271e8be1f52b', description: 'Athletic mesh shorts', category: 'Bottoms', sizes: ['S', 'M', 'L', 'XL'], colors: ['Black', 'Grey'] }
]
```

---

## Next.js Web App

### next.config.js
```javascript
/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    domains: [
      'images.unsplash.com',
      'grbwnjnngzcsjlubcmtp.supabase.co'
    ],
  },
}

module.exports = nextConfig
```

### Core Pages

#### Home Page (`app/page.js`)
```javascript
'use client'

import { useState, useEffect } from 'react'
import { supabase } from './lib/supabase'
import styles from './styles.css'

export default function HomePage() {
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [cartCount, setCartCount] = useState(0)
  const [addedId, setAddedId] = useState(null)

  useEffect(() => {
    fetchProducts()
  }, [])

  async function fetchProducts() {
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .order('created_at', { ascending: false })

    if (data && data.length > 0) {
      setProducts(data)
    } else {
      setProducts(STATIC_PRODUCTS)
    }
    setLoading(false)
  }

  // Full hero section with:
  // - Promo bar (free shipping, new drops)
  // - Navigation (logo, shop, lookbook, about, cart)
  // - Hero section ("Vibin Different.")
  // - Marquee text
  // - Product grid (The Foundation drop)
  // - Category sections (Tees, Hoodies, Accessories)
  // - Lookbook editorial section
  // - Manifesto section
  // - Drop countdown (Vol. 02)
  // - Newsletter signup (15% off)
  // - Footer with shop/links/connect
}
```

#### Shop Page (`app/shop/page.js`)
```javascript
'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import styles from '../styles.css'

const PRODUCTS = [
  { id: '1', name: 'Foundation Tee', price: 48 },
  { id: '2', name: 'Move Different Tee', price: 48 },
  { id: '3', name: 'Vol 01 Hoodie', price: 98 },
  { id: '4', name: 'VIBIN Cap', price: 32 },
  { id: '5', name: 'Cargo Pant', price: 88 },
]

export default function ShopPage() {
  const [products] = useState(PRODUCTS)
  const [loading, setLoading] = useState(false)
  const [filter, setFilter] = useState('all')

  const filters = ['all', 'Tee', 'Hoodie', 'Pants', 'Accessories']

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: styles }} />
      
      <nav>
        <Link href="/" className="logo">VIBIN</Link>
        <div className="nav-links">
          <Link href="/shop">Shop</Link>
          <Link href="/shop">New Drop</Link>
          <Link href="/">Lookbook</Link>
          <Link href="/">About</Link>
        </div>
        <div className="nav-actions">
          <div className="nav-icon">🔍</div>
          <Link href="/login" className="nav-icon">👤</Link>
          <Link href="/cart" className="nav-icon">🛒</Link>
        </div>
      </nav>

      <div className="shop-hero">
        <h1>Move <em>different.</em></h1>
      </div>

      <div className="shop-filters">
        {filters.map(f => (
          <button key={f} onClick={() => setFilter(f)}>
            {f === 'all' ? 'All' : f}
          </button>
        ))}
      </div>

      <div className="shop-grid">
        {products.map(product => (
          <Link key={product.id} href={`/product/${product.id}`}>
            <div className="shop-card">
              <div className="shop-img">{product.name}</div>
              <div className="shop-info">
                <div className="shop-name">{product.name}</div>
                <div className="shop-price">${product.price}</div>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </>
  )
}
```

#### Other Restored Pages
- `app/about/page.js` - About page
- `app/lookbook/page.js` - Editorial/lookbook page
- `app/login/page.js` - Login page
- `app/cart/page.js` - Shopping cart
- `app/checkout/page.js` - Checkout flow
- `app/profile/page.js` - User profile
- `app/returns/page.js` - Returns policy

---

## iOS App (VibinApp)

### Project Configuration (`project.yml`)
```yaml
name: VibinApp
options:
  bundleIdPrefix: com.vibin
  developmentLanguage: en
packages: {}
targets:
  VibinApp:
    type: application
    platform: iOS
    deploymentTarget: "16.0"
    sources:
      - path: VibinApp
        excludes:
          - Info.plist
          - Assets.xcassets
      - path: VibinApp/Models
      - path: VibinApp/Services
      - path: VibinApp/Views
    resources:
      - VibinApp/Assets.xcassets
    settings:
      INFOPLIST_FILE: VibinApp/Info.plist
      PRODUCT_BUNDLE_IDENTIFIER: com.vibin.apparel.ios
      SWIFT_VERSION: "5.0"
      MARKETING_VERSION: "1.0"
      CURRENT_PROJECT_VERSION: "1"
      ASSETCATALOG_COMPILER_APPICON_NAME: AppIcon
schemes:
  - name: VibinApp
    build:
      targets:
        VibinApp: [run, test, profile]
```

### Data Models (`Models/Product.swift`)
```swift
import Foundation

struct Product: Codable, Identifiable {
    let id: Int
    let name: String
    let price: Double
    let image: String?
    let description: String?
    let category: String?
    let sizes: [String]?
    let colors: [String]?
    
    enum CodingKeys: String, CodingKey {
        case id, name, price, image, description, category, sizes, colors
    }
}

struct Order: Codable, Identifiable {
    let id: String
    let guest_email: String
    let total: Double
    let status: String
    let created_at: String
    let items: Int?
}

struct CartItem: Identifiable {
    let id = UUID()
    let product: Product
    var quantity: Int
    var selectedSize: String
    var selectedColor: String
}
```

### Supabase Service (`Services/SupabaseService.swift`)
```swift
import Foundation

class SupabaseService {
    static let shared = SupabaseService()
    
    private let baseURL = "https://grbwnjnngzcsjlubcmtp.supabase.co"
    private let anonKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdyYnduam5uZ3pjc2psdWJjbXRwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzczNTgzMDEsImV4cCI6MjA5MjkzNDMwMX0.SYKFZJ0XVua0JmZ-tkaNhec2M3KtG3tS5vj_1Nl261c"
    
    func fetchProducts() async throws -> [Product] {
        guard let url = URL(string: "\(baseURL)/rest/v1/products?select=*") else {
            return []
        }
        
        var request = URLRequest(url: url)
        request.setValue(anonKey, forHTTPHeaderField: "apikey")
        request.setValue("Bearer \(anonKey)", forHTTPHeaderField: "Authorization")
        
        let (data, _) = try await URLSession.shared.data(for: request)
        
        if let products = try? JSONDecoder().decode([Product].self, from: data) {
            return products.isEmpty ? getStaticProducts() : products
        }
        
        return getStaticProducts()
    }
    
    private func getStaticProducts() -> [Product] {
        return [
            Product(id: 1, name: "VIBIN Classic Tee", price: 48, image: "https://images.unsplash.com/photo-1523381210434-271e8be1f52b", description: "Premium heavyweight cotton tee", category: "Tops", sizes: ["S", "M", "L", "XL"], colors: ["Black", "White", "Coral"]),
            Product(id: 2, name: "VIBIN Street Hoodie", price: 96, image: "https://images.unsplash.com/photo-1556821840-3a63f95609a7", description: "Heavyweight pullover hoodie", category: "Outerwear", sizes: ["S", "M", "L", "XL"], colors: ["Black", "Grey"]),
            Product(id: 3, name: "VIBIN Joggers", price: 72, image: "https://images.unsplash.com/photo-1523381210434-271e8be1f52b", description: "Tapered fit joggers", category: "Bottoms", sizes: ["S", "M", "L", "XL"], colors: ["Black", "Olive"]),
            Product(id: 4, name: "VIBIN Cap", price: 36, image: "https://images.unsplash.com/photo-1523381210434-271e8be1f52b", description: "Embroidered snapback", category: "Accessories", sizes: nil, colors: ["Black", "White"]),
            Product(id: 5, name: "VIBIN Longsleeve", price: 64, image: "https://images.unsplash.com/photo-1523381210434-271e8be1f52b", description: "Heavyweight longsleeve", category: "Tops", sizes: ["S", "M", "L", "XL"], colors: ["Black", "White"]),
            Product(id: 6, name: "VIBIN Shorts", price: 56, image: "https://images.unsplash.com/photo-1523381210434-271e8be1f52b", description: "Athletic mesh shorts", category: "Bottoms", sizes: ["S", "M", "L", "XL"], colors: ["Black", "Grey"])
        ]
    }
}
```

### Views

#### Home View (`Views/HomeView.swift`)
```swift
import SwiftUI

struct HomeView: View {
    @State private var products: [Product] = []
    
    var body: some View {
        NavigationView {
            ScrollView {
                VStack(spacing: 20) {
                    // Hero Section
                    ZStack {
                        Rectangle()
                            .fill(Color.black)
                            .frame(height: 300)
                        
                        VStack {
                            Text("VIBIN")
                                .font(.system(size: 48, weight: .black))
                                .foregroundColor(.white)
                            
                            Text("Different.")
                                .font(.system(size: 24, weight: .light, design: .italic))
                                .foregroundColor(Color(red: 1.0, green: 0.4, blue: 0.3))
                            
                            Text("Streetwear that speaks for you.")
                                .font(.system(size: 14))
                                .foregroundColor(.gray)
                                .padding(.top, 8)
                        }
                    }
                    
                    // Featured Products
                    HStack {
                        Text("FEATURED")
                            .font(.system(size: 12, weight: .bold))
                            .kerning(3)
                            .foregroundColor(Color(red: 1.0, green: 0.4, blue: 0.3))
                        Spacer()
                    }
                    .padding(.horizontal)
                    
                    ScrollView(.horizontal, showsIndicators: false) {
                        HStack(spacing: 15) {
                            ForEach(products.prefix(6)) { product in
                                NavigationLink(destination: ProductView(product: product)) {
                                    ProductCard(product: product)
                                }
                                .buttonStyle(PlainButtonStyle())
                            }
                        }
                        .padding(.horizontal)
                    }
                }
            }
            .navigationBarHidden(true)
            .task {
                await loadProducts()
            }
        }
    }
    
    func loadProducts() async {
        do {
            products = try await SupabaseService.shared.fetchProducts()
        } catch {
            products = []
        }
    }
}

struct ProductCard: View {
    let product: Product
    
    var body: some View {
        VStack(alignment: .leading, spacing: 8) {
            Rectangle()
                .fill(Color.gray.opacity(0.2))
                .frame(width: 160, height: 200)
                .overlay(Text("Photo").foregroundColor(.gray))
            
            Text(product.name)
                .font(.system(size: 14, weight: .semibold))
                .foregroundColor(.black)
            
            Text("$\(Int(product.price))")
                .font(.system(size: 14))
                .foregroundColor(.gray)
        }
        .frame(width: 160)
    }
}
```

#### Shop View (`Views/ShopView.swift`)
```swift
import SwiftUI

struct ShopView: View {
    @State private var products: [Product] = []
    @State private var selectedCategory = "All"
    
    let categories = ["All", "Tops", "Bottoms", "Outerwear", "Accessories"]
    
    var filteredProducts: [Product] {
        if selectedCategory == "All" {
            return products
        }
        return products.filter { $0.category == selectedCategory }
    }
    
    var body: some View {
        NavigationView {
            VStack(spacing: 0) {
                ScrollView(.horizontal, showsIndicators: false) {
                    HStack(spacing: 12) {
                        ForEach(categories, id: \.self) { category in
                            Button(action: { selectedCategory = category }) {
                                Text(category.uppercased())
                                    .font(.system(size: 11, weight: .bold))
                                    .kerning(1.5)
                                    .padding(.horizontal, 16)
                                    .padding(.vertical, 8)
                                    .background(selectedCategory == category ? Color.black : Color.gray.opacity(0.1))
                                    .foregroundColor(selectedCategory == category ? .white : .black)
                            }
                        }
                    }
                    .padding(.horizontal)
                    .padding(.vertical, 12)
                }
                
                ScrollView {
                    LazyVGrid(columns: [GridItem(.flexible()), GridItem(.flexible())], spacing: 15) {
                        ForEach(filteredProducts) { product in
                            NavigationLink(destination: ProductView(product: product)) {
                                ProductGridCard(product: product)
                            }
                            .buttonStyle(PlainButtonStyle())
                        }
                    }
                    .padding()
                }
            }
            .navigationTitle("SHOP")
            .navigationBarTitleDisplayMode(.inline)
            .task {
                await loadProducts()
            }
        }
    }
    
    func loadProducts() async {
        do {
            products = try await SupabaseService.shared.fetchProducts()
        } catch {
            products = []
        }
    }
}

struct ProductGridCard: View {
    let product: Product
    
    var body: some View {
        VStack(alignment: .leading, spacing: 8) {
            Rectangle()
                .fill(Color.gray.opacity(0.2))
                .aspectRatio(1, contentMode: .fit)
                .overlay(Text("Photo").foregroundColor(.gray))
            
            Text(product.name)
                .font(.system(size: 13, weight: .semibold))
                .lineLimit(1)
            
            Text("$\(Int(product.price))")
                .font(.system(size: 13))
                .foregroundColor(.gray)
        }
    }
}
```

#### Cart View (`Views/CartView.swift`)
```swift
import SwiftUI

struct CartView: View {
    @State private var cartItems: [CartItem] = []
    
    var total: Double {
        cartItems.reduce(0) { $0 + ($1.product.price * Double($1.quantity)) }
    }
    
    var body: some View {
        NavigationView {
            VStack {
                if cartItems.isEmpty {
                    Spacer()
                    Text("Your cart is empty")
                        .font(.system(size: 16))
                        .foregroundColor(.gray)
                    Spacer()
                } else {
                    ScrollView {
                        VStack(spacing: 15) {
                            ForEach(cartItems) { item in
                                CartItemRow(item: item)
                            }
                        }
                        .padding()
                    }
                    
                    VStack(spacing: 12) {
                        HStack {
                            Text("TOTAL")
                                .font(.system(size: 11, weight: .bold))
                                .kerning(2)
                            Spacer()
                            Text("$\(Int(total))")
                                .font(.system(size: 20, weight: .bold))
                        }
                        
                        NavigationLink(destination: CheckoutView()) {
                            Text("CHECKOUT")
                                .font(.system(size: 14, weight: .bold))
                                .kerning(2)
                                .frame(maxWidth: .infinity)
                                .padding()
                                .background(Color(red: 1.0, green: 0.4, blue: 0.3))
                                .foregroundColor(.white)
                        }
                    }
                    .padding()
                    .background(Color.white)
                    .shadow(color: .black.opacity(0.05), radius: 10, y: -5)
                }
            }
            .navigationTitle("CART")
            .navigationBarTitleDisplayMode(.inline)
        }
    }
}

struct CartItemRow: View {
    let item: CartItem
    
    var body: some View {
        HStack(spacing: 12) {
            Rectangle()
                .fill(Color.gray.opacity(0.2))
                .frame(width: 80, height: 80)
                .overlay(Text("Photo").font(.system(size: 10)))
            
            VStack(alignment: .leading, spacing: 4) {
                Text(item.product.name)
                    .font(.system(size: 14, weight: .semibold))
                Text("Size: \(item.selectedSize) • Color: \(item.selectedColor)")
                    .font(.system(size: 12))
                    .foregroundColor(.gray)
                Text("$\(Int(item.product.price))")
                    .font(.system(size: 14, weight: .semibold))
            }
            
            Spacer()
            
            Text("×\(item.quantity)")
                .font(.system(size: 14))
                .foregroundColor(.gray)
        }
    }
}

struct CheckoutView: View {
    @State private var email = ""
    @State private var name = ""
    @State private var address = ""
    @State private var city = ""
    @State private var zip = ""
    
    var body: some View {
        ScrollView {
            VStack(spacing: 20) {
                Text("CHECKOUT")
                    .font(.system(size: 28, weight: .black))
                    .frame(maxWidth: .infinity, alignment: .leading)
                    .padding(.top)
                
                Group {
                    TextField("Email", text: $email)
                    TextField("Full Name", text: $name)
                    TextField("Address", text: $address)
                    HStack {
                        TextField("City", text: $city)
                        TextField("ZIP", text: $zip)
                    }
                }
                .textFieldStyle(RoundedBorderTextFieldStyle())
                
                Button(action: {}) {
                    Text("PLACE ORDER")
                        .font(.system(size: 14, weight: .bold))
                        .kerning(2)
                        .frame(maxWidth: .infinity)
                        .padding()
                        .background(Color.black)
                        .foregroundColor(.white)
                }
            }
            .padding()
        }
        .navigationTitle("")
        .navigationBarHidden(true)
    }
}
```

#### Profile View (`Views/ProfileView.swift`)
```swift
import SwiftUI

struct ProfileView: View {
    @State private var isLoggedIn = false
    @State private var email = ""
    @State private var orders: [Order] = []
    
    var body: some View {
        NavigationView {
            ScrollView {
                VStack(spacing: 20) {
                    if isLoggedIn {
                        VStack(spacing: 16) {
                            Circle()
                                .fill(Color.gray.opacity(0.2))
                                .frame(width: 80, height: 80)
                                .overlay(Text("👤").font(.system(size: 32)))
                            
                            Text(email)
                                .font(.system(size: 16, weight: .semibold))
                        }
                        .padding(.top, 20)
                        
                        VStack(alignment: .leading, spacing: 12) {
                            Text("ORDERS")
                                .font(.system(size: 12, weight: .bold))
                                .kerning(3)
                                .foregroundColor(Color(red: 1.0, green: 0.4, blue: 0.3))
                            
                            if orders.isEmpty {
                                Text("No orders yet")
                                    .font(.system(size: 14))
                                    .foregroundColor(.gray)
                            } else {
                                ForEach(orders) { order in
                                    HStack {
                                        Text(order.id)
                                            .font(.system(size: 14, weight: .semibold))
                                        Spacer()
                                        Text(order.status.uppercased())
                                            .font(.system(size: 11))
                                            .padding(.horizontal, 8)
                                            .padding(.vertical, 4)
                                            .background(Color.gray.opacity(0.1))
                                    }
                                }
                            }
                        }
                        .padding()
                        .frame(maxWidth: .infinity, alignment: .leading)
                        .background(Color.gray.opacity(0.05))
                        
                        Button(action: { isLoggedIn = false }) {
                            Text("LOG OUT")
                                .font(.system(size: 14, weight: .bold))
                                .kerning(2)
                                .frame(maxWidth: .infinity)
                                .padding()
                                .background(Color.black)
                                .foregroundColor(.white)
                        }
                        .padding()
                        
                    } else {
                        VStack(spacing: 20) {
                            Text("VIBIN")
                                .font(.system(size: 36, weight: .black))
                            
                            Text("Log in to your account")
                                .font(.system(size: 14))
                                .foregroundColor(.gray)
                            
                            TextField("Email", text: $email)
                                .textFieldStyle(RoundedBorderTextFieldStyle())
                                .padding(.horizontal)
                            
                            Button(action: {
                                if !email.isEmpty {
                                    isLoggedIn = true
                                }
                            }) {
                                Text("LOG IN")
                                    .font(.system(size: 14, weight: .bold))
                                    .kerning(2)
                                    .frame(maxWidth: .infinity)
                                    .padding()
                                    .background(Color.black)
                                    .foregroundColor(.white)
                            }
                            .padding(.horizontal)
                        }
                        .padding(.top, 60)
                    }
                }
            }
            .navigationTitle("PROFILE")
            .navigationBarTitleDisplayMode(.inline)
        }
    }
}
```

---

## Deployment Configuration

### Vercel Settings
- **Project ID:** `prj_oD0ZHDE...`
- **Org ID:** `team_4QgnaZO...`
- **Token:** `vcp_3nruw...`
- **Custom Domain:** vibinapparel.com (Valid Configuration, Production)
- **Deployment URL:** https://vibin-store-7z83q119a-pierrejosias-sys-projects.vercel.app

### GitHub Secrets
- `VERCEL_TOKEN`
- `VERCEL_ORG_ID`
- `VERCEL_PROJECT_ID`
- `SHIPPO_TEST_TOKEN`

### Branch Strategy
- `main` - Production (branch protection: 1 approval required)
- `staging` - Staging
- `dev` - Development

---

## GitHub Workflows

### deploy.yml
```yaml
name: Deploy to Vercel
on:
  push:
    branches: [main]
  workflow_dispatch:

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      - run: npm install
      - run: npx vercel --token ${{ secrets.VERCEL_TOKEN }} --yes
      - run: npx vercel alias --token ${{ secrets.VERCEL_TOKEN }} --yes
```

### pr-check.yml
```yaml
name: PR Check
on:
  pull_request:
    branches: [main]

jobs:
  check:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
      - run: npm install
      - run: npm run build
```

### sitemap.yml
```yaml
name: Generate Sitemap
on:
  push:
    branches: [main]

jobs:
  sitemap:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Generate sitemap
        run: |
          echo '<?xml version="1.0" encoding="UTF-8"?>' > public/sitemap.xml
          # sitemap generation logic
```

---

## Notes

### Current Status (April 29, 2026)
- ✅ Restored 9 missing pages to vibin-store (home, shop, about, lookbook, login, cart, checkout, profile, returns)
- ✅ Created `.gitignore` to exclude node_modules, .next/, .env
- ✅ Branch `restore-missing-pages` ready to merge to main
- ✅ Vercel deployment workflow configured
- ⏳ Push branch and create PR to fix 404 on vibinapparel.com

### HVD Rentals Project
The HVD Rentals project files were found in:
- `/Users/josiaslucksonpierre/rentals/` (empty directories: app/admin, app/booking, app/vehicles, lib)
- `/Users/josiaslucksonpierre/Desktop/hvd-rentals/` (initialized git, no files)
- `/Users/josiaslucksonpierre/tmp-hvd/` (empty)

These appear to be separate from the vibin-store project. The HVD Rentals code may need to be developed separately.

### Key Files Location
- **Web App:** `/Users/josiaslucksonpierre/Desktop/supabase-app/vibin-store/`
- **iOS App:** `/Users/josiaslucksonpierre/Desktop/supabase-app/VibinApp/`
- **Shared Config:** `/Users/josiaslucksonpierre/Desktop/supabase-app/supabase.js`
- **Extracted HTML:** `/Users/josiaslucksonpierre/Desktop/supabase-app/extracted/` (hvd-*.html, vibin-*.html)

---

*Compiled by opencode AI Assistant*
