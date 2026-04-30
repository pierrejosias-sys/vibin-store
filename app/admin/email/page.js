'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import supabase from '../../lib/supabase-public'

export default function AdminEmailPage() {
  const router = useRouter()
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)
  const [emailData, setEmailData] = useState({
    to: '',
    subject: '',
    template: 'custom',
    message: '',
    type: 'all' // all, signups, ambassadors, customers
  })
  const [templates] = useState([
    { id: 'welcome', name: 'Welcome Email', subject: 'Welcome to Vibin Apparel ✦' },
    { id: 'drop01', name: 'Drop 01 Launch', subject: 'Drop 01 is Live — Use Code VIBE15' },
    { id: 'ambassador', name: 'Ambassador Welcome', subject: 'Welcome to the Ambassador Program' },
    { id: 'custom', name: 'Custom Email', subject: '' }
  ])
  const [recipients, setRecipients] = useState({ signups: 0, ambassadors: 0, customers: 0 })
  const [success, setSuccess] = useState('')

  useEffect(() => {
    const savedUser = localStorage.getItem('vibin_user')
    if (!savedUser) {
      router.push('/admin/login')
      return
    }
    const parsed = JSON.parse(savedUser)
    if (!parsed.is_admin) {
      router.push('/login')
      return
    }
    setUser(parsed)
    loadRecipients()
    setLoading(false)
  }, [router])

  async function loadRecipients() {
    try {
      const { count: signups } = await supabase
        .from('vibin_signups')
        .select('*', { count: 'exact', head: true })
      const { count: ambassadors } = await supabase
        .from('ambassadors')
        .select('*', { count: 'exact', head: true })
      setRecipients({ signups: signups || 0, ambassadors: ambassadors || 0, customers: 0 })
    } catch (err) {
      console.warn('Could not load recipients:', err)
    }
  }

  function selectTemplate(templateId) {
    const template = templates.find(t => t.id === templateId)
    setEmailData({
      ...emailData,
      template: templateId,
      subject: template?.subject || ''
    })
  }

  async function sendEmail() {
    setSending(true)
    setSuccess('')

    try {
      // Call notification API
      const res = await fetch('/api/notify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: emailData.to || 'bulk',
          type: 'admin_email',
          data: {
            subject: emailData.subject,
            message: emailData.message,
            recipientType: emailData.type
          }
        })
      })

      if (res.ok) {
        setSuccess(`Email "${emailData.subject}" queued for sending`)
        setEmailData({ ...emailData, to: '', subject: '', message: '' })
      }
    } catch (err) {
      console.error('Send error:', err)
    }

    setSending(false)
  }

  if (loading) {
    return (
      <div style={{background:'#0a0a0a',minHeight:'100vh',display:'flex',alignItems:'center',justifyContent:'center',color:'#f6f1e7'}}>
        Loading...
      </div>
    )
  }

  return (
    <div style={{background:'#0a0a0a',minHeight:'100vh',color:'#f6f1e7',fontFamily:'Manrope, sans-serif'}}>
      {/* Header */}
      <header style={{padding:'20px 40px',borderBottom:'1px solid #1e1e1e',display:'flex',justifyContent:'space-between',alignItems:'center'}}>
        <Link href="/admin" style={{fontFamily:'Anton, sans-serif',fontSize:'32px',color:'#f6f1e7',textDecoration:'none'}}>VIBIN</Link>
        <span style={{fontFamily:'JetBrains Mono, monospace',fontSize:'11px',letterSpacing:'.15em',textTransform:'uppercase',color:'#e05c2e'}}>Admin Email</span>
      </header>

      <div style={{display:'flex'}}>
        {/* Sidebar */}
        <div style={{width:'240px',borderRight:'1px solid #1e1e1e',padding:'30px 20px',minHeight:'calc(100vh - 80px)'}}>
          {[
            { label: 'Dashboard', href: '/admin', icon: '◈' },
            { label: 'Orders', href: '/admin/orders', icon: '◈' },
            { label: 'Email', href: '/admin/email', icon: '✉', active: true },
            { label: 'Requisitions', href: '/admin/requisitions', icon: '◈' },
            { label: 'Support', href: '/admin/support', icon: '◈' },
            { label: 'Security', href: '/admin/security', icon: '◈' },
          ].map((item, i) => (
            <Link key={i} href={item.href} style={{
              display:'flex',alignItems:'center',gap:'12px',padding:'12px 16px',marginBottom:'4px',
              background:item.active?'#1e1e1e':'transparent',
              color:item.active?'#e05c2e':'#888',
              textDecoration:'none',fontSize:'14px',borderRadius:'4px'
            }}>
              <span>{item.icon}</span> {item.label}
            </Link>
          ))}
        </div>

        {/* Main Content */}
        <div style={{flex:1,padding:'40px'}}>
          <h1 style={{fontFamily:'Anton, sans-serif',fontSize:'36px',textTransform:'uppercase',marginBottom:'8px'}}>Email Center ✉</h1>
          <p style={{color:'#888',marginBottom:'40px'}}>Send emails to your community</p>

          {success && (
            <div style={{background:'#1a3a1a',border:'1px solid #00ff00',padding:'16px',borderRadius:'4px',marginBottom:'30px',color:'#00ff00'}}>
              ✓ {success}
            </div>
          )}

          {/* Recipients Overview */}
          <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:'20px',marginBottom:'40px'}}>
            {[
              { label: 'Signups', count: recipients.signups, color: '#00ff00' },
              { label: 'Ambassadors', count: recipients.ambassadors, color: '#e05c2e' },
              { label: 'Customers', count: recipients.customers, color: '#f6f1e7' }
            ].map((stat, i) => (
              <div key={i} style={{background:'#111',padding:'20px',borderRadius:'8px',textAlign:'center'}}>
                <div style={{fontSize:'32px',fontFamily:'Anton, sans-serif',color:stat.color}}>{stat.count}</div>
                <div style={{fontSize:'11px',color:'#888',letterSpacing:'.1em',textTransform:'uppercase'}}>{stat.label}</div>
              </div>
            ))}
          </div>

          {/* Email Form */}
          <div style={{background:'#111',padding:'30px',borderRadius:'8px'}}>
            <h2 style={{fontFamily:'Anton, sans-serif',fontSize:'24px',marginBottom:'20px'}}>Compose Email</h2>

            {/* Template Selector */}
            <div style={{marginBottom:'20px'}}>
              <label style={{display:'block',fontSize:'12px',color:'#888',marginBottom:'8px',letterSpacing:'.1em',textTransform:'uppercase'}}>Template</label>
              <div style={{display:'flex',gap:'10px',flexWrap:'wrap'}}>
                {templates.map(t => (
                  <button
                    key={t.id}
                    onClick={() => selectTemplate(t.id)}
                    style={{
                      padding:'10px 16px',
                      background: emailData.template === t.id ? '#e05c2e' : '#1e1e1e',
                      border:'1px solid ' + (emailData.template === t.id ? '#e05c2e' : '#3a3a3a'),
                      color: emailData.template === t.id ? '#fff' : '#888',
                      cursor:'pointer',fontSize:'12px',borderRadius:'4px'
                    }}
                  >
                    {t.name}
                  </button>
                ))}
              </div>
            </div>

            {/* Recipient Type */}
            <div style={{marginBottom:'20px'}}>
              <label style={{display:'block',fontSize:'12px',color:'#888',marginBottom:'8px',letterSpacing:'.1em',textTransform:'uppercase'}}>Send To</label>
              <select
                value={emailData.type}
                onChange={(e) => setEmailData({...emailData, type: e.target.value})}
                style={{width:'100%',padding:'12px',background:'#0a0a0a',border:'1px solid #3a3a3a',color:'#f6f1e7',fontSize:'14px'}}
              >
                <option value="all">All Signups ({recipients.signups})</option>
                <option value="ambassadors">Ambassadors Only ({recipients.ambassadors})</option>
                <option value="custom">Custom Email</option>
              </select>
            </div>

            {/* Custom Email Input */}
            {emailData.type === 'custom' && (
              <div style={{marginBottom:'20px'}}>
                <label style={{display:'block',fontSize:'12px',color:'#888',marginBottom:'8px',letterSpacing:'.1em',textTransform:'uppercase'}}>Recipient Email</label>
                <input
                  type="email"
                  value={emailData.to}
                  onChange={(e) => setEmailData({...emailData, to: e.target.value})}
                  placeholder="email@example.com"
                  style={{width:'100%',padding:'12px',background:'#0a0a0a',border:'1px solid #3a3a3a',color:'#f6f1e7',fontSize:'14px'}}
                />
              </div>
            )}

            {/* Subject */}
            <div style={{marginBottom:'20px'}}>
              <label style={{display:'block',fontSize:'12px',color:'#888',marginBottom:'8px',letterSpacing:'.1em',textTransform:'uppercase'}}>Subject</label>
              <input
                type="text"
                value={emailData.subject}
                onChange={(e) => setEmailData({...emailData, subject: e.target.value})}
                placeholder="Email subject"
                style={{width:'100%',padding:'12px',background:'#0a0a0a',border:'1px solid #3a3a3a',color:'#f6f1e7',fontSize:'14px'}}
              />
            </div>

            {/* Message */}
            <div style={{marginBottom:'30px'}}>
              <label style={{display:'block',fontSize:'12px',color:'#888',marginBottom:'8px',letterSpacing:'.1em',textTransform:'uppercase'}}>Message</label>
              <textarea
                value={emailData.message}
                onChange={(e) => setEmailData({...emailData, message: e.target.value})}
                placeholder="Your email message..."
                rows="8"
                style={{width:'100%',padding:'12px',background:'#0a0a0a',border:'1px solid #3a3a3a',color:'#f6f1e7',fontSize:'14px',fontFamily:'Manrope, sans-serif',resize:'vertical'}}
              />
            </div>

            {/* Send Button */}
            <button
              onClick={sendEmail}
              disabled={sending || !emailData.subject || !emailData.message}
              style={{
                padding:'14px 32px',
                background: sending ? '#3a3a3a' : '#e05c2e',
                color:'#fff',
                border:'none',
                borderRadius:'4px',
                fontSize:'14px',
                fontWeight:'bold',
                cursor: sending ? 'not-allowed' : 'pointer',
                textTransform:'uppercase',
                letterSpacing:'.1em'
              }}
            >
              {sending ? 'Sending...' : 'Send Email →'}
            </button>
          </div>

          {/* Quick Templates */}
          <div style={{marginTop:'40px'}}>
            <h3 style={{fontFamily:'Anton, sans-serif',fontSize:'18px',marginBottom:'20px'}}>Quick Templates</h3>
            <div style={{display:'grid',gap:'12px'}}>
              {templates.filter(t => t.id !== 'custom').map(t => (
                <div key={t.id} style={{background:'#111',padding:'16px',borderRadius:'4px',display:'flex',justifyContent:'space-between',alignItems:'center'}}>
                  <div>
                    <div style={{fontSize:'14px',marginBottom:'4px'}}>{t.name}</div>
                    <div style={{fontSize:'12px',color:'#888'}}>{t.subject}</div>
                  </div>
                  <button
                    onClick={() => selectTemplate(t.id)}
                    style={{padding:'8px 16px',background:'transparent',border:'1px solid #3a3a3a',color:'#888',cursor:'pointer',fontSize:'12px'}}
                  >
                    Use Template
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
