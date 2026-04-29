'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import supabase from '../../lib/supabase-public'
import styles from '../../styles.css'

export default function AdminSupportPage() {
  const [requests, setRequests] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchRequests()
  }, [])

  async function fetchRequests() {
    try {
      const { data } = await supabase
        .from('verification_requests')
        .select('*, support_chats(email)')
        .eq('status', 'pending')
        .order('created_at', { ascending: false })
      if (data) setRequests(data)
    } catch (e) {
      console.log('Fetch error:', e)
    }
    setLoading(false)
  }

  async function handleAction(id, status) {
    try {
      await supabase
        .from('verification_requests')
        .update({ status, resolved_at: new Date().toISOString() })
        .eq('id', id)
      alert('Request ' + status + '!')
      fetchRequests()
    } catch (e) {
      alert('Error: ' + e.message)
    }
  }

  if (loading) return <div style={{padding:'60px',textAlign:'center'}}>Loading...</div>

  return (
    <>
      <style dangerouslySetInnerHTML={{__html: styles}} />
      <nav><Link href="/" className="logo">VIBIN ADMIN</Link></nav>
      <div style={{padding:'40px 60px',maxWidth:'1200px',margin:'0 auto'}}>
         <h1 style={{fontFamily:'Anton,sans-serif',fontSize:'48px',textTransform:'uppercase'}}>
           Support <em style={{fontStyle:'italic',color:'var(--coral)'}}>Verification</em>
         </h1>
         <img 
           src="https://images.unsplash.com/photo-1423666639041-f56000c27a9a?w=1200&h=300&fit=crop" 
           alt="Customer support"
           style={{width:'100%',height:'300px',objectFit:'cover',marginBottom:'24px',borderRadius:'4px'}}
         />
         {requests.length === 0 ? (
          <div style={{padding:'60px',textAlign:'center',color:'var(--muted)'}}>
            No pending verification requests.
          </div>
        ) : (
          <div>
            {requests.map(req => (
              <div key={req.id} style={{border:'1px solid var(--line)',padding:'16px',marginBottom:'12px',background:'var(--cream)'}}>
                <div style={{fontWeight:600,fontSize:'14px',marginBottom:'4px'}}>
                  {req.request_type?.replace('_', ' ').toUpperCase()}
                </div>
                <div style={{fontSize:'12px',color:'var(--muted)',marginBottom:'8px'}}>
                  From: {req.requester_email || req.support_chats?.email}
                </div>
                <div style={{fontSize:'12px',color:'var(--muted)',marginBottom:'12px'}}>
                  {new Date(req.created_at).toLocaleString()}
                </div>
                <div style={{display:'flex',gap:'12px'}}>
                  <button onClick={() => handleAction(req.id, 'approved')}
                    style={{padding:'8px 16px',background:'var(--coral)',color:'var(--cream)',border:'none',cursor:'pointer'}}>
                    ✓ Approve
                  </button>
                  <button onClick={() => handleAction(req.id, 'rejected')}
                    style={{padding:'8px 16px',background:'var(--ink)',color:'var(--cream)',border:'none',cursor:'pointer'}}>
                    ✕ Reject
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
      <footer><div className="foot-top">Vibin <em>Different.</em></div></footer>
    </>
  )
}
