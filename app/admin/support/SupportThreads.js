'use client'
// Admin support inbox: lists threads by status and lets an admin reply / close. Uses /api/admin/support.
import { useCallback, useEffect, useState } from 'react'

const TABS = ['open', 'answered', 'closed', 'all']
const COLORS = { open: '#e2553c', answered: '#01696f', closed: '#6b6b6b' }
const box = { border: '1px solid var(--line, #ddd5c4)', background: 'var(--cream, #f6f1e7)' }
const fmt = d => d ? new Date(d).toLocaleString('en-US', { timeZone: 'America/New_York', month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' }) + ' ET' : ''

export default function SupportThreads() {
  const [tab, setTab] = useState('open')
  const [chats, setChats] = useState([])
  const [counts, setCounts] = useState({})
  const [sel, setSel] = useState(null)
  const [reply, setReply] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState(null)

  const list = useCallback(async () => {
    setError(null)
    const r = await fetch(`/api/admin/support?status=${tab}`, { cache: 'no-store' })
    const d = await r.json().catch(() => ({}))
    if (!r.ok) { setError(d.error || `Error ${r.status}`); return }
    setChats(d.chats || []); setCounts(d.counts || {})
  }, [tab])
  useEffect(() => { list() }, [list])

  async function openThread(id) {
    const r = await fetch(`/api/admin/support?id=${id}`, { cache: 'no-store' })
    if (r.ok) setSel(await r.json())
  }

  async function send(close = false) {
    if (!sel || (!reply.trim() && !close)) return
    setBusy(true); setError(null)
    try {
      const r = reply.trim()
        ? await fetch('/api/admin/support', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: sel.chat.id, message: reply, close }) })
        : await fetch('/api/admin/support', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: sel.chat.id, status: 'closed' }) })
      if (!r.ok) throw new Error((await r.json().catch(() => ({}))).error || 'Failed')
      setReply(''); await openThread(sel.chat.id); await list()
    } catch (e) { setError(e.message) } finally { setBusy(false) }
  }

  async function setStatus(status) {
    await fetch('/api/admin/support', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: sel.chat.id, status }) })
    await openThread(sel.chat.id); await list()
  }

  return (
    <section style={{ marginBottom: '48px' }}>
      <h1 style={{ fontFamily: 'Anton,sans-serif', fontSize: '48px', textTransform: 'uppercase' }}>
        Support <em style={{ fontStyle: 'italic', color: 'var(--coral)' }}>Inbox</em>
      </h1>
      <div style={{ display: 'flex', gap: '8px', margin: '16px 0', flexWrap: 'wrap' }}>
        {TABS.map(t => (
          <button key={t} onClick={() => { setTab(t); setSel(null) }}
            style={{ padding: '8px 14px', border: '1px solid var(--ink)', background: tab === t ? 'var(--ink)' : 'transparent', color: tab === t ? 'var(--cream)' : 'var(--ink)', cursor: 'pointer', textTransform: 'uppercase', fontSize: '12px' }}>
            {t}{counts[t] != null ? ` (${counts[t]})` : ''}
          </button>
        ))}
        <button onClick={list} style={{ padding: '8px 14px', border: 'none', background: 'none', cursor: 'pointer', textDecoration: 'underline' }}>Refresh</button>
      </div>
      {error && <p role="alert" style={{ color: 'var(--coral)' }}>{error}</p>}
      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(260px, 1fr) 2fr', gap: '16px' }}>
        <div>
          {chats.length === 0 && <div style={{ ...box, padding: '24px', color: 'var(--muted)' }}>No {tab === 'all' ? '' : tab} threads.</div>}
          {chats.map(c => (
            <button key={c.id} onClick={() => openThread(c.id)}
              style={{ ...box, display: 'block', width: '100%', textAlign: 'left', padding: '12px', marginBottom: '8px', cursor: 'pointer', outline: sel?.chat.id === c.id ? '2px solid var(--ink)' : 'none' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px' }}>
                <strong>{c.chat_id}</strong>
                <span style={{ color: COLORS[c.status], textTransform: 'uppercase', fontWeight: 700 }}>{c.status}</span>
              </div>
              <div style={{ fontSize: '14px', margin: '4px 0' }}>{c.email}</div>
              <div style={{ fontSize: '12px', color: 'var(--muted)' }}>{c.topic}{c.order_number ? ` · #${c.order_number}` : ''} · {fmt(c.last_message_at)}</div>
            </button>
          ))}
        </div>
        <div style={{ ...box, padding: '16px', minHeight: '240px' }}>
          {!sel ? <p style={{ color: 'var(--muted)' }}>Select a thread.</p> : (
            <>
              <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: '8px', marginBottom: '12px' }}>
                <div>
                  <strong>{sel.chat.chat_id}</strong> · {sel.chat.name ? `${sel.chat.name} · ` : ''}<a href={`mailto:${sel.chat.email}?subject=${encodeURIComponent(`Re: Vibin support ${sel.chat.chat_id}`)}`}>{sel.chat.email}</a>
                  <div style={{ fontSize: '12px', color: 'var(--muted)' }}>{sel.chat.topic}{sel.chat.order_number ? ` · order #${sel.chat.order_number}` : ''} · via {sel.chat.source || 'site'} · opened {fmt(sel.chat.created_at)}</div>
                </div>
                <select aria-label="Status" value={sel.chat.status} onChange={e => setStatus(e.target.value)}>
                  {TABS.slice(0, 3).map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
              {sel.messages.map(m => (
                <div key={m.id} style={{ padding: '10px', marginBottom: '8px', background: m.sender === 'agent' ? '#fff' : 'transparent', border: '1px solid var(--line, #ddd5c4)', whiteSpace: 'pre-wrap' }}>
                  <div style={{ fontSize: '11px', color: 'var(--muted)', marginBottom: '4px' }}>{m.sender === 'agent' ? `Agent${m.sender_email ? ` (${m.sender_email})` : ''}` : 'Customer'} · {fmt(m.created_at)}</div>
                  {m.message}
                </div>
              ))}
              <textarea aria-label="Reply" rows={4} maxLength={4000} value={reply} onChange={e => setReply(e.target.value)} placeholder="Reply to the customer (shows in their Help chat)…"
                style={{ width: '100%', padding: '10px', boxSizing: 'border-box', marginTop: '8px', font: 'inherit' }} />
              <div style={{ display: 'flex', gap: '8px', marginTop: '8px' }}>
                <button disabled={busy || !reply.trim()} onClick={() => send(false)} style={{ padding: '8px 16px', background: 'var(--coral)', color: 'var(--cream)', border: 'none', cursor: 'pointer' }}>Send reply</button>
                <button disabled={busy} onClick={() => send(true)} style={{ padding: '8px 16px', background: 'var(--ink)', color: 'var(--cream)', border: 'none', cursor: 'pointer' }}>{reply.trim() ? 'Send & close' : 'Close thread'}</button>
              </div>
            </>
          )}
        </div>
      </div>
    </section>
  )
}
