'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import styles from '../styles.css'

export default function AmbassadorPage() {
  const [stats, setStats] = useState({
    clicks: 1247,
    sales: 23,
    earnings: 1104,
    pending: 150
  })
  const [copied, setCopied] = useState(false)

  const shareLink = 'https://vibin-store.vercel.app/?ref=ambassador'

  const shareLinkQR = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(shareLink)}`

  const copyLink = () => {
    navigator.clipboard.writeText(shareLink)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: styles }} />
      
      <header>
        <Link href="/" className="hdr-logo">VIBIN</Link>
        <div className="hdr-portal">Ambassador Portal</div>
        <nav className="hdr-nav">
          <Link href="/" className="hn">Dashboard</Link>
          <Link href="/" className="hn on">Links</Link>
          <Link href="/" className="hn">Payouts</Link>
          <Link href="/" className="hn">Settings</Link>
        </nav>
      </header>

      <div className="amb-hero">
        <div className="amb-hero-content">
          <h1>Earn for <em>sharing.</em></h1>
          <p>Share your unique link and earn 15% commission on every sale. Early access to drops, exclusive merch, and more.</p>
        </div>
      </div>

      <div className="amb-stats">
        <div className="amb-stat">
          <div className="amb-stat-label">Total Clicks</div>
          <div className="amb-stat-value">{stats.clicks}</div>
        </div>
        <div className="amb-stat">
          <div className="amb-stat-label">Sales Generated</div>
          <div className="amb-stat-value">{stats.sales}</div>
        </div>
        <div className="amb-stat">
          <div className="amb-stat-label">Earnings</div>
          <div className="amb-stat-value">${stats.earnings}</div>
        </div>
        <div className="amb-stat">
          <div className="amb-stat-label">Pending Payout</div>
          <div className="amb-stat-value">${stats.pending}</div>
        </div>
      </div>

      <div className="amb-share">
        <h2>Your Share Link</h2>
        <div className="amb-link-box">
          <input type="text" value={shareLink} readOnly />
          <button onClick={copyLink}>{copied ? 'Copied!' : 'Copy'}</button>
        </div>
        <div style={{ marginTop: '20px', textAlign: 'center' }}>
          <img src={shareLinkQR} alt="QR Code" style={{ borderRadius: '8px' }} />
          <p style={{ fontSize: '12px', color: '#888', marginTop: '10px' }}>Scan to share</p>
        </div>
        <p className="amb-tip">Share on social media, with friends, or embed on your site.</p>
      </div>

      <div className="amb-tiers">
        <h2>Commission Tiers</h2>
        <div className="amb-tier-grid">
          <div className="amb-tier">
            <div className="tier-badge">Bronze</div>
            <div className="tier-comm">15%</div>
            <div className="tier-req">0-9 sales</div>
          </div>
          <div className="amb-tier on">
            <div className="tier-badge">Silver</div>
            <div className="tier-comm">18%</div>
            <div className="tier-req">10-24 sales</div>
          </div>
          <div className="amb-tier">
            <div className="tier-badge">Gold</div>
            <div className="tier-comm">20%</div>
            <div className="tier-req">25-49 sales</div>
          </div>
          <div className="amb-tier">
            <div className="tier-badge">Platinum</div>
            <div className="tier-comm">25%</div>
            <div className="tier-req">50+ sales</div>
          </div>
        </div>
      </div>

      <footer>
        <div className="foot-logo">VIBIN</div>
        <div className="foot-tag">Ambassador program · Jacksonville, FL</div>
      </footer>
    </>
  )
}