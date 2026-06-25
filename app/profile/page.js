'use client'

import { useState, useEffect, useMemo } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createBrowserClient } from '@supabase/ssr'

export default function ProfilePage() {
  const supabase = useMemo(() => createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  ), [])

  const router = useRouter()
  const [user, setUser] = useState(null)
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)
  const [orders, setOrders] = useState([])

  useEffect(() => {
    async function loadProfile() {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        router.push('/login')
        return
      }

      setUser(session.user)

      // Fetch real profile
      const { data: profileData } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', session.user.id)
        .single()
      setProfile(profileData)

      // Fetch real orders for this user
      const { data: ordersData } = await supabase
        .from('orders')
        .select('id, order_number, total, status, created_at, items')
        .eq('user_id', session.user.id)
        .order('created_at', { ascending: false })
      setOrders(ordersData || [])

      setLoading(false)
    }
    loadProfile()
  }, [supabase, router])

  async function handleLogout() {
    await supabase.auth.signOut()
    router.push('/login')
  }

  if (loading) {
    return (
      <div style={{background:'#0a0a0a', minHeight:'100vh', color:'#f6f1e7', display:'flex', alignItems:'center', justifyContent:'center', fontFamily:'Manrope, sans-serif'}}>
        Loading...
      </div>
    )
  }

  if (!user) return null

  const displayName = profile?.full_name || user.email?.split('@')[0] || 'Vibin Member'
  const memberSince = user.created_at ? new Date(user.created_at).toLocaleDateString('en-US', { month: 'long', year: 'numeric' }) : 'Recently'

  return (
    <div style={{background:'#0a0a0a', minHeight:'100vh', color:'#f6f1e7', fontFamily:'Manrope, sans-serif'}}>
      {/* Promo Bar */}
      <div style={{background:'#111', borderBottom:'1px solid #1e1e1e', padding:'8px', textAlign:'center', fontSize:'12px', color:'#888', letterSpacing:'.05em'}}>
        Free shipping over $75 &nbsp;·&nbsp; SS26 Drop is live &nbsp;·&nbsp; 15% off your first order
      </div>

      {/* Nav */}
      <nav style={{padding:'20px 40px', borderBottom:'1px solid #1e1e1e', display:'flex', justifyContent:'space-between', alignItems:'center'}}>
        <Link href="/" style={{fontFamily:'Anton, sans-serif', fontSize:'32px', color:'#f6f1e7', textDecoration:'none'}}>VIBIN</Link>
        <div style={{display:'flex', gap:'24px', alignItems:'center'}}>
          <Link href="/shop" style={{color:'#888', textDecoration:'none', fontSize:'14px'}}>Shop</Link>
          <Link href="/print" style={{color:'#888', textDecoration:'none', fontSize:'14px'}}>Custom Print</Link>
          <Link href="/ambassador" style={{color:'#888', textDecoration:'none', fontSize:'14px'}}>Ambassador</Link>
          <Link href="/cart" style={{color:'#f6f1e7', textDecoration:'none', fontSize:'20px'}}>🛒</Link>
        </div>
      </nav>

      <div style={{maxWidth:'900px', margin:'0 auto', padding:'40px 20px'}}>
        <h1 style={{fontFamily:'Anton, sans-serif', fontSize:'48px', marginBottom:'8px', textTransform:'uppercase'}}>
          Welcome back, <em style={{fontStyle:'italic', color:'#e05c2e'}}>{displayName}</em>
        </h1>
        <p style={{color:'#555', fontSize:'13px', marginBottom:'40px'}}>Member since {memberSince}</p>

        {/* Account Cards */}
        <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:'20px', marginBottom:'40px'}}>
          <div style={{padding:'28px', background:'#111', border:'1px solid #1e1e1e', borderRadius:'8px'}}>
            <div style={{fontSize:'11px', color:'#555', marginBottom:'10px', textTransform:'uppercase', letterSpacing:'.1em', fontFamily:'JetBrains Mono, monospace'}}>Account</div>
            <div style={{fontWeight:'bold', fontSize:'16px', wordBreak:'break-all'}}>{user.email}</div>
            {profile?.is_ambassador && (
              <div style={{marginTop:'8px', display:'inline-block', padding:'3px 10px', background:'#1a1a2e', border:'1px solid #3a3a8a', borderRadius:'4px', fontSize:'11px', color:'#8888ff', letterSpacing:'.05em'}}>Ambassador</div>
            )}
            {profile?.is_admin && (
              <div style={{marginTop:'8px', display:'inline-block', padding:'3px 10px', background:'#1a2a1a', border:'1px solid #3a8a3a', borderRadius:'4px', fontSize:'11px', color:'#88cc88', letterSpacing:'.05em'}}>Admin</div>
            )}
          </div>
          <div style={{padding:'28px', background:'#111', border:'1px solid #1e1e1e', borderRadius:'8px'}}>
            <div style={{fontSize:'11px', color:'#555', marginBottom:'10px', textTransform:'uppercase', letterSpacing:'.1em', fontFamily:'JetBrains Mono, monospace'}}>Orders</div>
            <div style={{fontFamily:'Anton, sans-serif', fontSize:'36px', color:'#e05c2e'}}>{orders.length}</div>
            <div style={{fontSize:'13px', color:'#555', marginTop:'4px'}}>Total orders placed</div>
          </div>
        </div>

        {/* Orders */}
        <h2 style={{fontFamily:'Anton, sans-serif', fontSize:'24px', textTransform:'uppercase', marginBottom:'20px', letterSpacing:'.02em'}}>Your Orders</h2>

        {orders.length === 0 ? (
          <div style={{padding:'40px', textAlign:'center', background:'#111', border:'1px solid #1e1e1e', borderRadius:'8px'}}>
            <p style={{marginBottom:'20px', color:'#555', fontSize:'14px'}}>No orders yet</p>
            <Link href="/shop" style={{display:'inline-block', padding:'12px 24px', background:'#e05c2e', color:'#fff', textDecoration:'none', borderRadius:'4px', fontSize:'13px', fontWeight:'bold', textTransform:'uppercase', letterSpacing:'.1em'}}>
              Start Shopping →
            </Link>
          </div>
        ) : (
          <div style={{display:'grid', gap:'12px'}}>
            {orders.map(order => {
              const itemList = Array.isArray(order.items)
                ? order.items.map(i => i.name || i.title || JSON.stringify(i))
                : []
              const statusColor = order.status === 'delivered' ? '#88cc88' : order.status === 'shipped' ? '#8888ff' : order.status === 'cancelled' ? '#ff8888' : '#f6cc44'
              return (
                <div key={order.id} style={{padding:'20px', background:'#111', border:'1px solid #1e1e1e', borderRadius:'8px'}}>
                  <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'8px'}}>
                    <span style={{fontFamily:'JetBrains Mono, monospace', fontWeight:'bold', fontSize:'13px'}}>{order.order_number || `#${order.id}`}</span>
                    <span style={{padding:'3px 10px', background:'#0a0a0a', border:`1px solid ${statusColor}`, color:statusColor, fontSize:'11px', borderRadius:'4px', textTransform:'uppercase', letterSpacing:'.05em'}}>
                      {order.status}
                    </span>
                  </div>
                  <div style={{color:'#555', fontSize:'13px', marginBottom:'8px'}}>
                    {new Date(order.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })} · ${Number(order.total).toFixed(2)}
                  </div>
                  {itemList.length > 0 && (
                    <div style={{display:'flex', gap:'8px', flexWrap:'wrap'}}>
                      {itemList.map((item, i) => (
                        <span key={i} style={{padding:'3px 10px', background:'#1e1e1e', fontSize:'12px', borderRadius:'4px', color:'#888'}}>{item}</span>
                      ))}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}

        {/* Sign Out */}
        <button onClick={handleLogout} style={{marginTop:'40px', padding:'12px 24px', background:'transparent', border:'1px solid #3a3a3a', color:'#888', cursor:'pointer', borderRadius:'4px', fontSize:'13px', textTransform:'uppercase', letterSpacing:'.1em'}}>
          Sign Out
        </button>

        {/* Ambassador CTA */}
        {!profile?.is_ambassador && (
          <div style={{marginTop:'40px', padding:'30px', background:'#111', border:'1px solid #1e1e1e', borderRadius:'8px', textAlign:'center'}}>
            <h3 style={{fontFamily:'Anton, sans-serif', fontSize:'24px', textTransform:'uppercase', marginBottom:'12px'}}>Want to Earn as an Ambassador?</h3>
            <p style={{color:'#555', fontSize:'14px', marginBottom:'20px'}}>Earn 15–25% commission by sharing Vibin with your audience.</p>
            <Link href="/ambassador/apply" style={{display:'inline-block', padding:'12px 24px', background:'#e05c2e', color:'#fff', textDecoration:'none', borderRadius:'4px', fontWeight:'bold', fontSize:'12px', textTransform:'uppercase', letterSpacing:'.1em'}}>
              Apply as Ambassador →
            </Link>
          </div>
        )}
      </div>

      <footer style={{marginTop:'80px', padding:'40px', borderTop:'1px solid #1e1e1e', textAlign:'center'}}>
        <div style={{fontFamily:'Anton, sans-serif', fontSize:'24px', marginBottom:'8px'}}>VIBIN</div>
        <div style={{color:'#555', fontSize:'13px'}}>Custom prints · Made to order · Jacksonville, FL</div>
      </footer>
    </div>
  )
}
