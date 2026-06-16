'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createBrowserClient } from '@supabase/ssr'

const supabase = createBrowserClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
)

export default function AdminAmbassadors() {
  const router = useRouter()
  const [applications, setApplications] = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('pending')
  const [actionLoading, setActionLoading] = useState(null)
  const [toast, setToast] = useState(null)

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (!session) { router.push('/login'); return }
      const { data: profile } = await supabase.from('profiles').select('is_admin').eq('id', session.user.id).single()
      if (!profile?.is_admin) { router.push('/'); return }
      fetchApplications()
    })
  }, [])

  const fetchApplications = useCallback(async () => {
    setLoading(true)
    const { data } = await supabase
      .from('ambassadors')
      .select('*')
      .order('created_at', { ascending: false })
    setApplications(data || [])
    setLoading(false)
  }, [])

  useEffect(() => { fetchApplications() }, [fetchApplications])

  function showToast(msg, type = 'success') {
    setToast({ msg, type })
    setTimeout(() => setToast(null), 3000)
  }

  async function handleApprove(app) {
    setActionLoading(app.id)
    try {
      // Generate referral code
      const code = 'AMB' + app.name.split(' ')[0].toUpperCase().slice(0, 4) + Math.random().toString(36).substring(2, 5).toUpperCase()

      // Update ambassadors table
      await supabase.from('ambassadors').update({
        status: 'approved',
        code,
        approved_at: new Date().toISOString(),
        referral_link: `https://vibinapparel.com/?ref=${code}`
      }).eq('id', app.id)

      // Set is_ambassador on their profile if they have an account
      const { data: profile } = await supabase.from('profiles').select('id').eq('email', app.email).single()
      if (profile) {
        await supabase.from('profiles').update({ is_ambassador: true }).eq('id', profile.id)
      }

      showToast(`✓ ${app.name} approved — code: ${code}`)
      fetchApplications()
    } catch (err) {
      showToast('Error approving application', 'error')
    }
    setActionLoading(null)
  }

  async function handleReject(app) {
    if (!confirm(`Reject ${app.name}'s application? This cannot be undone.`)) return
    setActionLoading(app.id)
    try {
      await supabase.from('ambassadors').update({ status: 'rejected', rejected_at: new Date().toISOString() }).eq('id', app.id)
      showToast(`${app.name}'s application rejected`, 'error')
      fetchApplications()
    } catch (err) {
      showToast('Error rejecting application', 'error')
    }
    setActionLoading(null)
  }

  async function handleRevoke(app) {
    if (!confirm(`Revoke ${app.name}'s ambassador status? They will lose dashboard access.`)) return
    setActionLoading(app.id)
    try {
      await supabase.from('ambassadors').update({ status: 'revoked' }).eq('id', app.id)
      const { data: profile } = await supabase.from('profiles').select('id').eq('email', app.email).single()
      if (profile) {
        await supabase.from('profiles').update({ is_ambassador: false }).eq('id', profile.id)
      }
      showToast(`${app.name}'s access revoked`, 'error')
      fetchApplications()
    } catch (err) {
      showToast('Error revoking access', 'error')
    }
    setActionLoading(null)
  }

  const filtered = applications.filter(a => filter === 'all' ? true : a.status === filter)
  const counts = {
    pending: applications.filter(a => a.status === 'pending').length,
    approved: applications.filter(a => a.status === 'approved').length,
    rejected: applications.filter(a => a.status === 'rejected').length,
    revoked: applications.filter(a => a.status === 'revoked').length,
  }

  const statusColor = { pending: '#d4a017', approved: '#22c55e', rejected: '#ef4444', revoked: '#888' }
  const statusBg = { pending: '#1a1500', approved: '#0a1a0a', rejected: '#1a0a0a', revoked: '#111' }

  return (
    <div style={{background:'#0a0a0a',minHeight:'100vh',color:'#f0ede6',fontFamily:'Manrope, sans-serif'}}>

      {/* Toast */}
      {toast && (
        <div style={{position:'fixed',top:'20px',right:'20px',padding:'14px 20px',background: toast.type === 'error' ? '#1a0a0a' : '#0a1a0a',border:`1px solid ${toast.type === 'error' ? '#5c1e1e' : '#1e5c1e'}`,borderRadius:'8px',color: toast.type === 'error' ? '#ff6b6b' : '#4ade80',fontSize:'14px',zIndex:9999,boxShadow:'0 4px 20px rgba(0,0,0,.5)'}}>
          {toast.msg}
        </div>
      )}

      {/* Header */}
      <header style={{padding:'20px 40px',borderBottom:'1px solid #1e1e1e',display:'flex',justifyContent:'space-between',alignItems:'center'}}>
        <Link href="/admin" style={{fontFamily:'Anton, sans-serif',fontSize:'28px',color:'#f0ede6',textDecoration:'none'}}>VIBIN</Link>
        <span style={{fontFamily:'JetBrains Mono, monospace',fontSize:'11px',letterSpacing:'.15em',textTransform:'uppercase',color:'#e05c2e'}}>Admin · Ambassadors</span>
        <Link href="/admin" style={{color:'#888',textDecoration:'none',fontSize:'14px'}}>← Back to Admin</Link>
      </header>

      <div style={{maxWidth:'1100px',margin:'0 auto',padding:'40px 20px'}}>

        {/* Stats */}
        <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:'16px',marginBottom:'32px'}}>
          {Object.entries(counts).map(([status, count]) => (
            <div key={status} style={{background:'#111',border:'1px solid #1e1e1e',borderRadius:'8px',padding:'20px',textAlign:'center',cursor:'pointer',outline: filter === status ? `1px solid ${statusColor[status]}` : 'none'}} onClick={() => setFilter(status)}>
              <div style={{fontFamily:'JetBrains Mono, monospace',fontSize:'10px',letterSpacing:'.15em',textTransform:'uppercase',color:'#555',marginBottom:'8px'}}>{status}</div>
              <div style={{fontFamily:'Anton, sans-serif',fontSize:'36px',color:statusColor[status]}}>{count}</div>
            </div>
          ))}
        </div>

        {/* Filter tabs */}
        <div style={{display:'flex',gap:'8px',marginBottom:'24px',flexWrap:'wrap'}}>
          {['pending','approved','rejected','revoked','all'].map(f => (
            <button key={f} onClick={() => setFilter(f)}
              style={{padding:'8px 16px',background: filter === f ? '#e05c2e' : '#111',border:'1px solid',borderColor: filter === f ? '#e05c2e' : '#2a2a2a',borderRadius:'4px',color: filter === f ? '#fff' : '#888',cursor:'pointer',fontSize:'12px',fontFamily:'JetBrains Mono, monospace',letterSpacing:'.05em',textTransform:'uppercase'}}>
              {f} {f !== 'all' ? `(${counts[f] ?? 0})` : ''}
            </button>
          ))}
        </div>

        {/* Table */}
        {loading ? (
          <p style={{color:'#555',textAlign:'center',padding:'60px',fontFamily:'JetBrains Mono, monospace',fontSize:'12px'}}>Loading applications...</p>
        ) : filtered.length === 0 ? (
          <div style={{textAlign:'center',padding:'80px',color:'#555'}}>
            <div style={{fontSize:'48px',marginBottom:'16px'}}>✦</div>
            <p style={{fontFamily:'JetBrains Mono, monospace',fontSize:'12px',letterSpacing:'.1em',textTransform:'uppercase'}}>No {filter} applications</p>
          </div>
        ) : (
          <div style={{display:'grid',gap:'12px'}}>
            {filtered.map(app => (
              <div key={app.id} style={{background:'#111',border:'1px solid #1e1e1e',borderRadius:'8px',padding:'24px',display:'grid',gridTemplateColumns:'1fr auto',gap:'20px',alignItems:'start'}}>
                <div>
                  <div style={{display:'flex',alignItems:'center',gap:'12px',marginBottom:'12px',flexWrap:'wrap'}}>
                    <span style={{fontFamily:'Anton, sans-serif',fontSize:'20px'}}>{app.name}</span>
                    <span style={{padding:'3px 10px',background:statusBg[app.status],border:`1px solid ${statusColor[app.status]}33`,borderRadius:'99px',fontFamily:'JetBrains Mono, monospace',fontSize:'10px',letterSpacing:'.1em',textTransform:'uppercase',color:statusColor[app.status]}}>{app.status}</span>
                    {app.code && <span style={{fontFamily:'JetBrains Mono, monospace',fontSize:'11px',color:'#555'}}>Code: <strong style={{color:'#888'}}>{app.code}</strong></span>}
                  </div>
                  <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(180px,1fr))',gap:'8px 24px',fontSize:'13px',color:'#888',marginBottom:'12px'}}>
                    <div>📧 {app.email}</div>
                    {app.instagram_handle && <div>📸 {app.instagram_handle}</div>}
                    {app.tiktok_handle && <div>🎵 {app.tiktok_handle}</div>}
                    {app.audience_size && <div>👥 {app.audience_size} followers</div>}
                    <div>🗓 Applied {new Date(app.created_at).toLocaleDateString()}</div>
                    {app.approved_at && <div>✓ Approved {new Date(app.approved_at).toLocaleDateString()}</div>}
                  </div>
                  {app.why && (
                    <div style={{padding:'12px 16px',background:'#0a0a0a',border:'1px solid #1e1e1e',borderRadius:'4px',fontSize:'13px',color:'#888',lineHeight:'1.6',fontStyle:'italic',maxWidth:'600px'}}>
                      "{app.why}"
                    </div>
                  )}
                </div>

                {/* Actions */}
                <div style={{display:'flex',flexDirection:'column',gap:'8px',minWidth:'120px'}}>
                  {app.status === 'pending' && (
                    <>
                      <button onClick={() => handleApprove(app)} disabled={actionLoading === app.id}
                        style={{padding:'10px 16px',background:'#0a1a0a',border:'1px solid #1e5c1e',borderRadius:'4px',color:'#4ade80',cursor:'pointer',fontSize:'13px',fontWeight:'bold',opacity: actionLoading === app.id ? .5 : 1}}>
                        {actionLoading === app.id ? '...' : '✓ Approve'}
                      </button>
                      <button onClick={() => handleReject(app)} disabled={actionLoading === app.id}
                        style={{padding:'10px 16px',background:'#1a0a0a',border:'1px solid #5c1e1e',borderRadius:'4px',color:'#f87171',cursor:'pointer',fontSize:'13px',fontWeight:'bold',opacity: actionLoading === app.id ? .5 : 1}}>
                        {actionLoading === app.id ? '...' : '✕ Reject'}
                      </button>
                    </>
                  )}
                  {app.status === 'approved' && (
                    <button onClick={() => handleRevoke(app)} disabled={actionLoading === app.id}
                      style={{padding:'10px 16px',background:'#111',border:'1px solid #3a3a3a',borderRadius:'4px',color:'#888',cursor:'pointer',fontSize:'13px',opacity: actionLoading === app.id ? .5 : 1}}>
                      {actionLoading === app.id ? '...' : 'Revoke Access'}
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
