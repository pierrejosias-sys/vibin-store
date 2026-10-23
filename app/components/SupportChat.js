'use client'
// Floating "Help" chat. Uses the same server route as /contact (/api/support); the customer sees
// only their own thread, identified by email + a token kept in localStorage. No direct table access.
import { useEffect, useRef, useState, useCallback } from 'react'
import { usePathname } from 'next/navigation'
import { TOPIC_OPTIONS, getSavedThread, saveThread, forgetThread, createTicket, sendFollowUp, fetchThread } from '../lib/support-client'

const HIDE_ON = ['/admin', '/support-agent']
const C = { ink: '#111', cream: '#f6f1e7', coral: '#e2553c', muted: '#6b6b6b', line: '#ddd5c4' }
const input = { width: '100%', padding: '10px', border: `1px solid ${C.ink}`, background: '#fff', font: 'inherit', fontSize: '14px', marginBottom: '10px', boxSizing: 'border-box', borderRadius: 0 }
const btn = { padding: '10px 14px', background: C.ink, color: C.cream, border: 'none', cursor: 'pointer', font: 'inherit', fontSize: '13px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.06em' }
const STATUS_TEXT = { open: 'Waiting for our reply', answered: 'We replied', closed: 'Closed — send a message to reopen' }

export default function SupportChat() {
  const pathname = usePathname() || ''
  const [open, setOpen] = useState(false)
  const [saved, setSaved] = useState(null)
  const [thread, setThread] = useState(null)
  const [form, setForm] = useState({ email: '', topic: '', orderNumber: '', message: '', website: '' })
  const [reply, setReply] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState(null)
  const endRef = useRef(null)

  useEffect(() => {
    const sync = () => setSaved(getSavedThread())
    sync()
    window.addEventListener('vibin-support-thread', sync)
    window.addEventListener('storage', sync)
    return () => { window.removeEventListener('vibin-support-thread', sync); window.removeEventListener('storage', sync) }
  }, [])

  const load = useCallback(async () => {
    if (!saved) { setThread(null); return }
    try { setThread((await fetchThread(saved)).thread) }
    catch (e) { if (e.status === 404) { forgetThread(); setSaved(null); setThread(null) } }
  }, [saved])

  useEffect(() => {
    if (!open || !saved) return
    load()
    const t = setInterval(load, 20000)
    return () => clearInterval(t)
  }, [open, saved, load])

  useEffect(() => { endRef.current?.scrollIntoView({ block: 'end' }) }, [thread, open])

  if (HIDE_ON.some(p => pathname.startsWith(p))) return null
  const set = k => e => setForm(f => ({ ...f, [k]: e.target.value }))

  async function start(e) {
    e.preventDefault(); setBusy(true); setError(null)
    try {
      const r = await createTicket({ ...form, source: 'chat' })
      if (r.ticket && r.token) { saveThread(r); setSaved({ ticket: r.ticket, email: r.email, token: r.token }) }
      setForm({ email: '', topic: '', orderNumber: '', message: '', website: '' })
    } catch (err) { setError(err.message) } finally { setBusy(false) }
  }

  async function send(e) {
    e.preventDefault(); if (!reply.trim()) return
    setBusy(true); setError(null)
    try { await sendFollowUp(saved, reply); setReply(''); await load() }
    catch (err) { setError(err.message) } finally { setBusy(false) }
  }

  return (
    <div style={{ position: 'fixed', right: '16px', bottom: '16px', zIndex: 9999, fontFamily: 'Manrope, system-ui, sans-serif', color: C.ink }}>
      {open && (
        <div role="dialog" aria-label="Vibin help chat" style={{ width: 'min(360px, calc(100vw - 32px))', maxHeight: 'min(560px, calc(100vh - 100px))', display: 'flex', flexDirection: 'column', background: C.cream, border: `1px solid ${C.ink}`, boxShadow: '0 10px 30px rgba(0,0,0,.2)', marginBottom: '10px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 14px', background: C.ink, color: C.cream }}>
            <strong style={{ letterSpacing: '.08em', textTransform: 'uppercase', fontSize: '13px' }}>Vibin Help{thread ? ` · ${thread.ticket}` : ''}</strong>
            <button onClick={() => setOpen(false)} aria-label="Close help" style={{ background: 'none', border: 'none', color: C.cream, fontSize: '20px', cursor: 'pointer', lineHeight: 1 }}>×</button>
          </div>
          <div style={{ padding: '14px', overflowY: 'auto', flex: 1 }}>
            {!saved ? (
              <form onSubmit={start}>
                <p style={{ fontSize: '13px', margin: '0 0 12px', color: C.muted }}>Ask us anything. We reply within 1 business day, right here. Or call (786) 716-1673.</p>
                <input aria-label="Email" type="email" required placeholder="Your email" maxLength={254} style={input} value={form.email} onChange={set('email')} autoComplete="email" />
                <select aria-label="Topic" required style={input} value={form.topic} onChange={set('topic')}>
                  <option value="" disabled>Topic</option>
                  {TOPIC_OPTIONS.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                </select>
                <input aria-label="Order number (optional)" placeholder="Order # (optional)" maxLength={40} style={input} value={form.orderNumber} onChange={set('orderNumber')} />
                <textarea aria-label="Message" required rows={4} maxLength={4000} placeholder="How can we help?" style={input} value={form.message} onChange={set('message')} />
                <input aria-hidden="true" tabIndex={-1} autoComplete="off" value={form.website} onChange={set('website')} style={{ position: 'absolute', left: '-10000px', width: '1px', height: '1px' }} />
                <button type="submit" style={{ ...btn, width: '100%' }} disabled={busy}>{busy ? 'Sending…' : 'Send'}</button>
              </form>
            ) : !thread ? (
              <p style={{ fontSize: '13px', color: C.muted }}>Loading your conversation…</p>
            ) : (
              <>
                <p style={{ fontSize: '12px', color: C.muted, margin: '0 0 10px' }}>{STATUS_TEXT[thread.status] || thread.status}</p>
                {thread.messages.map((m, i) => (
                  <div key={i} style={{ display: 'flex', justifyContent: m.from === 'you' ? 'flex-end' : 'flex-start', marginBottom: '8px' }}>
                    <div style={{ maxWidth: '85%', padding: '8px 10px', whiteSpace: 'pre-wrap', fontSize: '14px', background: m.from === 'you' ? C.ink : '#fff', color: m.from === 'you' ? C.cream : C.ink, border: `1px solid ${m.from === 'you' ? C.ink : C.line}` }}>
                      {m.from === 'agent' && <div style={{ fontSize: '11px', fontWeight: 700, color: C.coral, marginBottom: '2px' }}>Vibin Support</div>}
                      {m.message}
                    </div>
                  </div>
                ))}
                <div ref={endRef} />
              </>
            )}
            {error && <p role="alert" style={{ color: C.coral, fontSize: '13px', margin: '8px 0 0' }}>{error}</p>}
          </div>
          {saved && thread && (
            <form onSubmit={send} style={{ borderTop: `1px solid ${C.line}`, padding: '10px 14px' }}>
              <textarea aria-label="Reply" rows={2} maxLength={4000} placeholder="Write a message…" style={{ ...input, marginBottom: '8px' }} value={reply} onChange={e => setReply(e.target.value)} />
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <button type="button" onClick={() => { forgetThread(); setSaved(null); setThread(null) }} style={{ background: 'none', border: 'none', color: C.muted, fontSize: '12px', textDecoration: 'underline', cursor: 'pointer', padding: 0 }}>New conversation</button>
                <button type="submit" style={btn} disabled={busy || !reply.trim()}>{busy ? 'Sending…' : 'Send'}</button>
              </div>
            </form>
          )}
        </div>
      )}
      <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
        <button onClick={() => setOpen(o => !o)} aria-expanded={open} style={{ ...btn, borderRadius: '999px', padding: '12px 18px', boxShadow: '0 4px 14px rgba(0,0,0,.25)' }}>
          {open ? 'Close' : 'Help'}
        </button>
      </div>
    </div>
  )
}
