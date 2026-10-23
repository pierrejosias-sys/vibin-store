import Link from 'next/link'

export const metadata = { title: 'Admin Security — Coming soon', robots: { index: false, follow: false } }

// Previously rendered hardcoded mock data; hidden from admin nav until real data is wired up.
export default function AdminSecurityPage() {
  return (
    <main style={{ minHeight: '100vh', background: '#0a0a0a', color: '#f6f1e7', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '40px', textAlign: 'center' }}>
      <div>
        <h1 style={{ fontFamily: 'Anton, sans-serif', fontSize: '48px', textTransform: 'uppercase', margin: 0 }}>Security</h1>
        <p style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '12px', letterSpacing: '.15em', textTransform: 'uppercase', color: '#e05c2e', margin: '16px 0 32px' }}>Coming soon</p>
        <Link href="/admin" style={{ color: '#f6f1e7' }}>← Back to admin</Link>
      </div>
    </main>
  )
}
