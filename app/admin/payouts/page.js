'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import supabase from '../../lib/supabase-public'

const STATUS_COLORS = {
  open: { bg: '#e0f2fe', color: '#0369a1' },
  locked: { bg: '#fef9c3', color: '#854d0e' },
  processing: { bg: '#ede9fe', color: '#5b21b6' },
  paid: { bg: '#dcfce7', color: '#166534' },
  failed: { bg: '#fee2e2', color: '#991b1b' },
  cancelled: { bg: '#f3f4f6', color: '#374151' },
  pending: { bg: '#fef3c7', color: '#92400e' },
}

const COMMISSION_COLORS = {
  pending: { bg: '#fef9c3', color: '#854d0e' },
  approved: { bg: '#dbeafe', color: '#1e40af' },
  payable: { bg: '#d1fae5', color: '#065f46' },
  paid: { bg: '#dcfce7', color: '#166534' },
  cancelled: { bg: '#f3f4f6', color: '#374151' },
}

const fmt = (n) => '$' + Number(n || 0).toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',')
const fmtDate = (d) => d ? new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '—'

export default function PayoutsPage() {
  const router = useRouter()
  const [view, setView] = useState('overview') // overview | batches | commissions | ambassadors
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [toast, setToast] = useState(null)

  // Data
  const [summary, setSummary] = useState([])
  const [batches, setBatches] = useState([])
  const [selectedBatch, setSelectedBatch] = useState(null)
  const [batchPayouts, setBatchPayouts] = useState([])
  const [commissions, setCommissions] = useState([])
  const [commissionFilter, setCommissionFilter] = useState('all')
  const [pendingVerifications, setPendingVerifications] = useState(0)

  // Modals
  const [showCreateBatch, setShowCreateBatch] = useState(false)
  const [batchForm, setBatchForm] = useState({ period_start: '', period_end: '', notes: '' })
  const [showMarkPaid, setShowMarkPaid] = useState(null) // payout row
  const [payoutRef, setPayoutRef] = useState('')
  const [payoutNotes, setPayoutNotes] = useState('')
  const [showCommissionModal, setShowCommissionModal] = useState(null)

  useEffect(() => {
    const saved = localStorage.getItem('vibin_user')
    if (!saved) { router.push('/admin/login'); return }
    const user = JSON.parse(saved)
    if (!user.is_admin) { router.push('/login'); return }
    fetchAll()
    fetchPendingVerifications()
  }, [])

  async function fetchPendingVerifications() {
    try {
      const { count } = await supabase.from('verification_requests').select('*', { count: 'exact', head: true }).eq('status', 'pending')
      if (count !== null) setPendingVerifications(count)
    } catch (e) {}
  }

  async function fetchAll() {
    setLoading(true)
    await Promise.all([fetchSummary(), fetchBatches(), fetchCommissions()])
    setLoading(false)
  }

  async function fetchSummary() {
    const { data } = await supabase.from('ambassador_commission_summary').select('*').order('total_commission_earned', { ascending: false })
    setSummary(data || [])
  }

  async function fetchBatches() {
    const { data } = await supabase.from('ambassador_payout_batches').select('*').order('created_at', { ascending: false })
    setBatches(data || [])
  }

  async function fetchCommissions() {
    const { data } = await supabase
      .from('ambassador_commissions')
      .select('*, ambassadors(name, ambassador_id, email)')
      .order('created_at', { ascending: false })
      .limit(200)
    setCommissions(data || [])
  }

  async function fetchBatchPayouts(batchId) {
    const { data } = await supabase
      .from('ambassador_payouts')
      .select('*, ambassador_payout_items(count)')
      .eq('batch_id', batchId)
      .order('gross_amount', { ascending: false })
    setBatchPayouts(data || [])
  }

  function showToast(msg, type = 'success') {
    setToast({ msg, type })
    setTimeout(() => setToast(null), 3500)
  }

  // Create batch via DB function
  async function handleCreateBatch() {
    setSaving(true)
    try {
      const { data, error } = await supabase.rpc('create_ambassador_payout_batch', {
        p_period_start: batchForm.period_start || null,
        p_period_end: batchForm.period_end || null,
        p_notes: batchForm.notes || null,
      })
      if (error) throw error
      showToast('Payout batch created!')
      setShowCreateBatch(false)
      setBatchForm({ period_start: '', period_end: '', notes: '' })
      await fetchBatches()
      await fetchSummary()
    } catch (e) {
      showToast(e.message || 'Failed to create batch', 'error')
    }
    setSaving(false)
  }

  // Lock a batch
  async function handleLockBatch(batchId) {
    if (!confirm('Lock this batch? No new commissions will be added.')) return
    const { error } = await supabase.from('ambassador_payout_batches').update({ status: 'locked', locked_at: new Date().toISOString() }).eq('id', batchId)
    if (error) { showToast(error.message, 'error'); return }
    showToast('Batch locked')
    await fetchBatches()
  }

  // Mark a single payout as paid
  async function handleMarkPaid() {
    if (!showMarkPaid) return
    setSaving(true)
    try {
      const { error } = await supabase.rpc('mark_ambassador_payout_paid', {
        p_payout_id: showMarkPaid.id,
        p_payout_reference: payoutRef || null,
        p_notes: payoutNotes || null,
      })
      if (error) throw error
      showToast('Payout marked as paid & commissions updated!')
      setShowMarkPaid(null)
      setPayoutRef('')
      setPayoutNotes('')
      await fetchBatchPayouts(showMarkPaid.batch_id)
      await fetchBatches()
      await fetchSummary()
      await fetchCommissions()
    } catch (e) {
      showToast(e.message || 'Failed', 'error')
    }
    setSaving(false)
  }

  // Approve a single commission manually
  async function handleApproveCommission(id) {
    const { error } = await supabase.from('ambassador_commissions').update({ status: 'payable', approved_at: new Date().toISOString(), payable_at: new Date().toISOString() }).eq('id', id).in('status', ['pending', 'approved'])
    if (error) { showToast(error.message, 'error'); return }
    showToast('Commission marked payable')
    await fetchCommissions()
    await fetchSummary()
  }

  // Cancel a commission
  async function handleCancelCommission(id) {
    if (!confirm('Cancel this commission?')) return
    const { error } = await supabase.from('ambassador_commissions').update({ status: 'cancelled' }).eq('id', id).not('status', 'eq', 'paid')
    if (error) { showToast(error.message, 'error'); return }
    showToast('Commission cancelled')
    await fetchCommissions()
    await fetchSummary()
  }

  const filteredCommissions = commissionFilter === 'all' ? commissions : commissions.filter(c => c.status === commissionFilter)

  const totalPayable = summary.reduce((s, a) => s + Number(a.payable_amount || 0), 0)
  const totalPaid = summary.reduce((s, a) => s + Number(a.paid_amount || 0), 0)
  const totalPending = summary.reduce((s, a) => s + Number(a.pending_amount || 0), 0)
  const openBatches = batches.filter(b => ['open', 'locked', 'processing'].includes(b.status)).length

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: `
        .pay-page { display: flex; min-height: 100vh; font-family: 'Inter', sans-serif; background: #f9fafb; }
        .pay-sidebar { width: 220px; background: #000; color: #fff; padding: 24px 0; flex-shrink: 0; position: sticky; top: 0; height: 100vh; }
        .pay-logo { font-family: 'Anton', sans-serif; font-size: 28px; padding: 0 24px 24px; letter-spacing: 2px; }
        .pay-nav a { display: block; padding: 10px 24px; color: #aaa; text-decoration: none; font-size: 14px; font-weight: 500; transition: all .15s; }
        .pay-nav a:hover, .pay-nav a.on { color: #fff; background: rgba(255,255,255,.08); }
        .pay-content { flex: 1; padding: 32px; overflow-y: auto; }
        .pay-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 28px; }
        .pay-title { font-family: 'Anton', sans-serif; font-size: 28px; text-transform: uppercase; letter-spacing: 1px; }
        .stats-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 16px; margin-bottom: 28px; }
        .stat-card { background: #fff; border-radius: 10px; padding: 20px; box-shadow: 0 1px 3px rgba(0,0,0,.06); }
        .stat-label { font-size: 12px; color: #6b7280; text-transform: uppercase; letter-spacing: .5px; margin-bottom: 6px; }
        .stat-value { font-size: 26px; font-weight: 700; }
        .stat-value.green { color: #166534; }
        .stat-value.amber { color: #92400e; }
        .stat-value.blue { color: #1e40af; }
        .table-card { background: #fff; border-radius: 10px; box-shadow: 0 1px 3px rgba(0,0,0,.06); overflow: hidden; margin-bottom: 24px; }
        .table-card-header { padding: 16px 20px; border-bottom: 1px solid #f3f4f6; display: flex; align-items: center; justify-content: space-between; }
        .table-card-title { font-weight: 700; font-size: 16px; }
        table.pay-table { width: 100%; border-collapse: collapse; }
        table.pay-table th { background: #f9fafb; padding: 10px 16px; text-align: left; font-size: 11px; text-transform: uppercase; letter-spacing: .5px; color: #6b7280; border-bottom: 1px solid #f3f4f6; }
        table.pay-table td { padding: 12px 16px; border-bottom: 1px solid #f9fafb; font-size: 14px; vertical-align: middle; }
        table.pay-table tr:last-child td { border-bottom: none; }
        table.pay-table tr:hover td { background: #f9fafb; }
        .badge { display: inline-block; padding: 3px 10px; border-radius: 9999px; font-size: 11px; font-weight: 600; text-transform: uppercase; letter-spacing: .4px; }
        .btn { padding: 8px 16px; border-radius: 6px; font-size: 13px; font-weight: 600; cursor: pointer; border: none; transition: all .15s; }
        .btn-black { background: #000; color: #fff; } .btn-black:hover { background: #222; }
        .btn-green { background: #166534; color: #fff; } .btn-green:hover { background: #14532d; }
        .btn-amber { background: #92400e; color: #fff; } .btn-amber:hover { background: #78350f; }
        .btn-ghost { background: transparent; border: 1.5px solid #d1d5db; color: #374151; } .btn-ghost:hover { background: #f3f4f6; }
        .btn-red { background: #991b1b; color: #fff; } .btn-red:hover { background: #7f1d1d; }
        .btn-sm { padding: 5px 10px; font-size: 12px; }
        .modal-overlay { position: fixed; inset: 0; background: rgba(0,0,0,.5); display: flex; align-items: center; justify-content: center; z-index: 1000; padding: 20px; }
        .modal { background: #fff; border-radius: 12px; padding: 28px; width: 100%; max-width: 480px; box-shadow: 0 20px 60px rgba(0,0,0,.2); }
        .modal-title { font-weight: 700; font-size: 18px; margin-bottom: 20px; }
        .form-group { margin-bottom: 16px; }
        .form-label { font-size: 13px; font-weight: 600; color: #374151; margin-bottom: 6px; display: block; }
        .form-input { width: 100%; padding: 9px 12px; border: 1.5px solid #d1d5db; border-radius: 6px; font-size: 14px; outline: none; transition: border .15s; box-sizing: border-box; }
        .form-input:focus { border-color: #000; }
        .modal-actions { display: flex; gap: 10px; justify-content: flex-end; margin-top: 20px; }
        .filter-tabs { display: flex; gap: 8px; margin-bottom: 16px; flex-wrap: wrap; }
        .filter-tab { padding: 5px 14px; border-radius: 9999px; font-size: 12px; font-weight: 600; cursor: pointer; border: 1.5px solid #d1d5db; background: #fff; color: #374151; transition: all .15s; }
        .filter-tab.on { background: #000; color: #fff; border-color: #000; }
        .toast { position: fixed; bottom: 24px; right: 24px; padding: 12px 20px; border-radius: 8px; font-size: 14px; font-weight: 600; z-index: 2000; box-shadow: 0 4px 20px rgba(0,0,0,.15); animation: slidein .2s ease; }
        .toast.success { background: #166534; color: #fff; }
        .toast.error { background: #991b1b; color: #fff; }
        @keyframes slidein { from { transform: translateY(20px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
        .empty-state { padding: 48px 20px; text-align: center; color: #9ca3af; }
        .empty-state-icon { font-size: 40px; margin-bottom: 12px; }
        .back-btn { display: inline-flex; align-items: center; gap: 6px; font-size: 13px; color: #6b7280; cursor: pointer; margin-bottom: 16px; background: none; border: none; }
        .back-btn:hover { color: #000; }
        .amb-avatar { width: 34px; height: 34px; border-radius: 50%; background: #000; color: #fff; display: inline-flex; align-items: center; justify-content: center; font-weight: 700; font-size: 13px; flex-shrink: 0; }
        @media (max-width: 900px) { .stats-grid { grid-template-columns: 1fr 1fr; } .pay-sidebar { width: 180px; } }
        @media (max-width: 640px) { .stats-grid { grid-template-columns: 1fr; } .pay-sidebar { display: none; } }
      `}} />

      <div className="pay-page">
        {/* Sidebar */}
        <div className="pay-sidebar">
          <div className="pay-logo">VIBIN</div>
          <nav className="pay-nav">
            <Link href="/admin" className="pay-nav-link" style={{ display:'block', padding:'10px 24px', color:'#aaa', textDecoration:'none', fontSize:'14px', fontWeight:500 }}>Dashboard</Link>
            <Link href="/admin/orders" className="pay-nav-link" style={{ display:'block', padding:'10px 24px', color:'#aaa', textDecoration:'none', fontSize:'14px', fontWeight:500 }}>Orders</Link>
            <a href="#" className="on" style={{ display:'block', padding:'10px 24px', color:'#fff', background:'rgba(255,255,255,.08)', textDecoration:'none', fontSize:'14px', fontWeight:500 }}>Payouts</a>
            <Link href="/admin/support" style={{ display:'flex', alignItems:'center', gap:'8px', padding:'10px 24px', color:'#aaa', textDecoration:'none', fontSize:'14px', fontWeight:500 }}>
              Support
              {pendingVerifications > 0 && <span style={{ background:'#ef4444', color:'#fff', borderRadius:'50%', width:18, height:18, display:'inline-flex', alignItems:'center', justifyContent:'center', fontSize:10, fontWeight:700 }}>{pendingVerifications}</span>}
            </Link>
            <Link href="/" style={{ display:'block', padding:'10px 24px', color:'#aaa', textDecoration:'none', fontSize:'14px', fontWeight:500 }}>View Store</Link>
          </nav>
        </div>

        {/* Main content */}
        <div className="pay-content">

          {/* ─── OVERVIEW ─── */}
          {view === 'overview' && (
            <>
              <div className="pay-header">
                <h1 className="pay-title">Ambassador Payouts</h1>
                <button className="btn btn-black" onClick={() => setShowCreateBatch(true)}>+ New Payout Batch</button>
              </div>

              {loading ? (
                <div className="empty-state"><div className="empty-state-icon">⏳</div>Loading...</div>
              ) : (
                <>
                  {/* KPI row */}
                  <div className="stats-grid">
                    <div className="stat-card">
                      <div className="stat-label">Ready to Pay</div>
                      <div className="stat-value amber">{fmt(totalPayable)}</div>
                    </div>
                    <div className="stat-card">
                      <div className="stat-label">Total Paid Out</div>
                      <div className="stat-value green">{fmt(totalPaid)}</div>
                    </div>
                    <div className="stat-card">
                      <div className="stat-label">Pending Approval</div>
                      <div className="stat-value blue">{fmt(totalPending)}</div>
                    </div>
                    <div className="stat-card">
                      <div className="stat-label">Active Batches</div>
                      <div className="stat-value">{openBatches}</div>
                    </div>
                  </div>

                  {/* Ambassador summary table */}
                  <div className="table-card">
                    <div className="table-card-header">
                      <span className="table-card-title">Ambassadors</span>
                      <div style={{ display:'flex', gap:8 }}>
                        <button className="btn btn-ghost btn-sm" onClick={() => setView('commissions')}>View Commissions</button>
                        <button className="btn btn-ghost btn-sm" onClick={() => setView('batches')}>View Batches</button>
                      </div>
                    </div>
                    {summary.length === 0 ? (
                      <div className="empty-state"><div className="empty-state-icon">👥</div><p>No ambassadors yet</p></div>
                    ) : (
                      <table className="pay-table">
                        <thead><tr><th>Ambassador</th><th>Code</th><th>Orders</th><th>Payable</th><th>Paid</th><th>Total Earned</th></tr></thead>
                        <tbody>
                          {summary.map(a => (
                            <tr key={a.ambassador_row_id}>
                              <td>
                                <div style={{ display:'flex', alignItems:'center', gap:10 }}>
                                  <div className="amb-avatar">{(a.name || '?')[0].toUpperCase()}</div>
                                  <div>
                                    <div style={{ fontWeight:600 }}>{a.name || '—'}</div>
                                    <div style={{ fontSize:12, color:'#6b7280' }}>{a.email}</div>
                                  </div>
                                </div>
                              </td>
                              <td><span className="badge" style={{ background:'#ede9fe', color:'#5b21b6' }}>{a.ambassador_id}</span></td>
                              <td>{a.total_orders}</td>
                              <td><span style={{ fontWeight:700, color: Number(a.payable_amount)>0 ? '#92400e' : '#374151' }}>{fmt(a.payable_amount)}</span></td>
                              <td style={{ color:'#166534', fontWeight:600 }}>{fmt(a.paid_amount)}</td>
                              <td style={{ fontWeight:700 }}>{fmt(a.total_commission_earned)}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    )}
                  </div>
                </>
              )}
            </>
          )}

          {/* ─── BATCHES LIST ─── */}
          {view === 'batches' && !selectedBatch && (
            <>
              <div className="pay-header">
                <div>
                  <button className="back-btn" onClick={() => setView('overview')}>← Back to overview</button>
                  <h1 className="pay-title">Payout Batches</h1>
                </div>
                <button className="btn btn-black" onClick={() => setShowCreateBatch(true)}>+ New Batch</button>
              </div>
              <div className="table-card">
                {batches.length === 0 ? (
                  <div className="empty-state"><div className="empty-state-icon">📦</div><p>No batches yet. Create one to group ambassador payouts.</p></div>
                ) : (
                  <table className="pay-table">
                    <thead><tr><th>Batch #</th><th>Period</th><th>Ambassadors</th><th>Commissions</th><th>Amount</th><th>Status</th><th>Created</th><th>Actions</th></tr></thead>
                    <tbody>
                      {batches.map(b => (
                        <tr key={b.id}>
                          <td style={{ fontWeight:700 }}>{b.batch_number}</td>
                          <td style={{ fontSize:13, color:'#6b7280' }}>
                            {b.payout_period_start ? `${fmtDate(b.payout_period_start)} – ${fmtDate(b.payout_period_end)}` : 'All time'}
                          </td>
                          <td>{b.total_ambassadors}</td>
                          <td>{b.total_commissions}</td>
                          <td style={{ fontWeight:700 }}>{fmt(b.gross_amount)}</td>
                          <td><span className="badge" style={STATUS_COLORS[b.status] || {}}>{b.status}</span></td>
                          <td style={{ fontSize:13, color:'#6b7280' }}>{fmtDate(b.created_at)}</td>
                          <td>
                            <div style={{ display:'flex', gap:6 }}>
                              <button className="btn btn-ghost btn-sm" onClick={async () => { setSelectedBatch(b); await fetchBatchPayouts(b.id) }}>View</button>
                              {b.status === 'open' && <button className="btn btn-amber btn-sm" onClick={() => handleLockBatch(b.id)}>Lock</button>}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            </>
          )}

          {/* ─── BATCH DETAIL ─── */}
          {view === 'batches' && selectedBatch && (
            <>
              <button className="back-btn" onClick={() => setSelectedBatch(null)}>← Back to batches</button>
              <div className="pay-header">
                <div>
                  <h1 className="pay-title">{selectedBatch.batch_number}</h1>
                  <div style={{ fontSize:14, color:'#6b7280', marginTop:4 }}>
                    <span className="badge" style={{ ...(STATUS_COLORS[selectedBatch.status] || {}), marginRight:8 }}>{selectedBatch.status}</span>
                    {selectedBatch.payout_period_start ? `${fmtDate(selectedBatch.payout_period_start)} – ${fmtDate(selectedBatch.payout_period_end)}` : 'All time'}
                    {' · '}{selectedBatch.total_ambassadors} ambassadors · {selectedBatch.total_commissions} commissions · {fmt(selectedBatch.gross_amount)} total
                  </div>
                </div>
              </div>
              <div className="table-card">
                <div className="table-card-header"><span className="table-card-title">Payout Lines</span></div>
                {batchPayouts.length === 0 ? (
                  <div className="empty-state"><div className="empty-state-icon">💸</div><p>No payouts in this batch yet.</p></div>
                ) : (
                  <table className="pay-table">
                    <thead><tr><th>Ambassador</th><th>Method</th><th>Reference</th><th>Gross</th><th>Fees</th><th>Net</th><th>Status</th><th>Actions</th></tr></thead>
                    <tbody>
                      {batchPayouts.map(p => (
                        <tr key={p.id}>
                          <td>
                            <div style={{ fontWeight:600 }}>{p.ambassador_id || '—'}</div>
                            <div style={{ fontSize:12, color:'#6b7280' }}>{p.payout_email}</div>
                          </td>
                          <td>{p.payout_method || <span style={{ color:'#9ca3af' }}>—</span>}</td>
                          <td style={{ fontSize:12 }}>{p.payout_reference || <span style={{ color:'#9ca3af' }}>—</span>}</td>
                          <td style={{ fontWeight:600 }}>{fmt(p.gross_amount)}</td>
                          <td style={{ color:'#6b7280' }}>{fmt(p.fees_amount)}</td>
                          <td style={{ fontWeight:700, color:'#166534' }}>{fmt(p.net_amount)}</td>
                          <td><span className="badge" style={STATUS_COLORS[p.status] || {}}>{p.status}</span></td>
                          <td>
                            {p.status === 'pending' && (
                              <button className="btn btn-green btn-sm" onClick={() => { setShowMarkPaid(p); setPayoutRef(''); setPayoutNotes('') }}>Mark Paid</button>
                            )}
                            {p.status === 'paid' && <span style={{ fontSize:12, color:'#166534' }}>✓ Paid {fmtDate(p.paid_at)}</span>}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            </>
          )}

          {/* ─── COMMISSIONS ─── */}
          {view === 'commissions' && (
            <>
              <div className="pay-header">
                <div>
                  <button className="back-btn" onClick={() => setView('overview')}>← Back to overview</button>
                  <h1 className="pay-title">Commissions</h1>
                </div>
              </div>
              <div className="filter-tabs">
                {['all','pending','approved','payable','paid','cancelled'].map(s => (
                  <button key={s} className={`filter-tab${commissionFilter===s?' on':''}`} onClick={() => setCommissionFilter(s)}>
                    {s.charAt(0).toUpperCase()+s.slice(1)}
                    {s !== 'all' && <span style={{ marginLeft:4, opacity:.7 }}>({commissions.filter(c=>c.status===s).length})</span>}
                  </button>
                ))}
              </div>
              <div className="table-card">
                {filteredCommissions.length === 0 ? (
                  <div className="empty-state"><div className="empty-state-icon">📋</div><p>No commissions found.</p></div>
                ) : (
                  <table className="pay-table">
                    <thead><tr><th>Order</th><th>Ambassador</th><th>Code</th><th>Subtotal</th><th>Rate</th><th>Commission</th><th>Status</th><th>Date</th><th>Actions</th></tr></thead>
                    <tbody>
                      {filteredCommissions.map(c => (
                        <tr key={c.id}>
                          <td style={{ fontWeight:600 }}>{c.order_number || '—'}</td>
                          <td>
                            <div style={{ fontWeight:500 }}>{c.ambassadors?.name || '—'}</div>
                            <div style={{ fontSize:11, color:'#9ca3af' }}>{c.ambassadors?.email}</div>
                          </td>
                          <td><span className="badge" style={{ background:'#ede9fe', color:'#5b21b6' }}>{c.referral_code}</span></td>
                          <td>{fmt(c.order_subtotal)}</td>
                          <td style={{ color:'#6b7280' }}>{(Number(c.commission_rate)*100).toFixed(0)}%</td>
                          <td style={{ fontWeight:700 }}>{fmt(c.commission_amount)}</td>
                          <td><span className="badge" style={COMMISSION_COLORS[c.status] || {}}>{c.status}</span></td>
                          <td style={{ fontSize:12, color:'#6b7280' }}>{fmtDate(c.created_at)}</td>
                          <td>
                            <div style={{ display:'flex', gap:4 }}>
                              {['pending','approved'].includes(c.status) && (
                                <button className="btn btn-green btn-sm" onClick={() => handleApproveCommission(c.id)}>Approve</button>
                              )}
                              {!['paid','cancelled'].includes(c.status) && (
                                <button className="btn btn-red btn-sm" onClick={() => handleCancelCommission(c.id)}>Cancel</button>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            </>
          )}
        </div>
      </div>

      {/* ─── CREATE BATCH MODAL ─── */}
      {showCreateBatch && (
        <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && setShowCreateBatch(false)}>
          <div className="modal">
            <div className="modal-title">Create Payout Batch</div>
            <p style={{ fontSize:13, color:'#6b7280', marginBottom:20 }}>A batch groups all <strong>payable</strong> commissions (from delivered orders) for payment. Leave dates blank to include all.</p>
            <div className="form-group">
              <label className="form-label">Period Start (optional)</label>
              <input type="date" className="form-input" value={batchForm.period_start} onChange={e => setBatchForm(f => ({...f, period_start: e.target.value}))} />
            </div>
            <div className="form-group">
              <label className="form-label">Period End (optional)</label>
              <input type="date" className="form-input" value={batchForm.period_end} onChange={e => setBatchForm(f => ({...f, period_end: e.target.value}))} />
            </div>
            <div className="form-group">
              <label className="form-label">Notes (optional)</label>
              <textarea className="form-input" rows={2} value={batchForm.notes} onChange={e => setBatchForm(f => ({...f, notes: e.target.value}))} placeholder="e.g. June 2026 cycle" />
            </div>
            <div className="modal-actions">
              <button className="btn btn-ghost" onClick={() => setShowCreateBatch(false)}>Cancel</button>
              <button className="btn btn-black" onClick={handleCreateBatch} disabled={saving}>{saving ? 'Creating...' : 'Create Batch'}</button>
            </div>
          </div>
        </div>
      )}

      {/* ─── MARK PAID MODAL ─── */}
      {showMarkPaid && (
        <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && setShowMarkPaid(null)}>
          <div className="modal">
            <div className="modal-title">Mark Payout as Paid</div>
            <p style={{ fontSize:13, color:'#6b7280', marginBottom:20 }}>
              Ambassador: <strong>{showMarkPaid.ambassador_id}</strong> ({showMarkPaid.payout_email})<br/>
              Net amount: <strong>{fmt(showMarkPaid.net_amount)}</strong>
            </p>
            <div className="form-group">
              <label className="form-label">Payment Reference (optional)</label>
              <input type="text" className="form-input" value={payoutRef} onChange={e => setPayoutRef(e.target.value)} placeholder="PayPal txn ID, check #, etc." />
            </div>
            <div className="form-group">
              <label className="form-label">Notes (optional)</label>
              <textarea className="form-input" rows={2} value={payoutNotes} onChange={e => setPayoutNotes(e.target.value)} placeholder="Any notes about this payment" />
            </div>
            <div className="modal-actions">
              <button className="btn btn-ghost" onClick={() => setShowMarkPaid(null)}>Cancel</button>
              <button className="btn btn-green" onClick={handleMarkPaid} disabled={saving}>{saving ? 'Saving...' : 'Confirm Paid'}</button>
            </div>
          </div>
        </div>
      )}

      {/* Toast */}
      {toast && <div className={`toast ${toast.type}`}>{toast.msg}</div>}
    </>
  )
}
