'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
export default function AdminLoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);
    setError('');

    // Sign-in goes through POST /api/admin/login (server-side allowlist + IP rate limit).
    // Supabase Auth also rate-limits. The password is not logged or stored in state beyond this request.
    const res = await fetch('/api/admin/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      setError(data.error || 'Invalid email or password.');
      setLoading(false);
      return;
    }

    setLoading(false);
    router.push('/admin');
  }

  return (
    <>
      <nav>
        <a href="/" className="logo">VIBIN ADMIN</a>
      </nav>

      <div style={{ 
        minHeight: 'calc(100vh - 80px)', 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center',
        padding: '40px 20px',
        background: 'var(--ink)'
      }}>
        <div style={{ 
          maxWidth: '400px', 
          width: '100%',
          background: 'var(--ink2)',
          border: '1px solid var(--line)',
          padding: '40px 32px'
        }}>
          <div style={{ 
            fontFamily: 'JetBrains Mono, monospace',
            fontSize: '11px',
            letterSpacing: '.2em',
            textTransform: 'uppercase',
            color: 'var(--coral)',
            marginBottom: '12px',
            textAlign: 'center'
          }}>
            Admin Access Only
          </div>

          <h1 style={{ 
            fontFamily: 'Anton, sans-serif',
            fontSize: '32px',
            textTransform: 'uppercase',
            letterSpacing: '.02em',
            marginBottom: '8px',
            textAlign: 'center'
          }}>
            Sign <em style={{ fontStyle: 'italic', color: 'var(--coral)' }}>In</em>
          </h1>

          <p style={{ 
            fontSize: '13px',
            color: 'var(--muted)',
            textAlign: 'center',
            marginBottom: '32px',
            lineHeight: '1.6'
          }}>
            Access the admin dashboard, orders, support, and security auditor.
          </p>

          <form onSubmit={handleSubmit}>
            <div style={{ marginBottom: '16px' }}>
              <div style={{ 
                fontFamily: 'JetBrains Mono, monospace',
                fontSize: '10px',
                letterSpacing: '.15em',
                textTransform: 'uppercase',
                color: 'var(--muted)',
                marginBottom: '8px'
              }}>
                Email
              </div>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@vibinapparel.com"
                required
                style={{
                  width: '100%',
                  padding: '12px 16px',
                  background: 'var(--ink)',
                  border: '1px solid var(--line)',
                  color: 'var(--cream)',
                  fontSize: '14px',
                  fontFamily: 'Manrope, sans-serif'
                }}
              />
            </div>

            <div style={{ marginBottom: '24px' }}>
              <div style={{ 
                fontFamily: 'JetBrains Mono, monospace',
                fontSize: '10px',
                letterSpacing: '.15em',
                textTransform: 'uppercase',
                color: 'var(--muted)',
                marginBottom: '8px'
              }}>
                Password
              </div>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter password"
                required
                style={{
                  width: '100%',
                  padding: '12px 16px',
                  background: 'var(--ink)',
                  border: '1px solid var(--line)',
                  color: 'var(--cream)',
                  fontSize: '14px',
                  fontFamily: 'Manrope, sans-serif'
                }}
              />
            </div>

            {error && (
              <div style={{ 
                padding: '12px',
                background: 'rgba(255, 74, 61, 0.15)',
                border: '1px solid rgba(255, 74, 61, 0.4)',
                color: '#ff8b8b',
                fontSize: '12px',
                marginBottom: '16px',
                textAlign: 'center'
              }}>
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              style={{
                width: '100%',
                padding: '14px',
                background: 'var(--coral)',
                color: 'var(--cream)',
                border: 'none',
                cursor: loading ? 'not-allowed' : 'pointer',
                fontFamily: 'Manrope, sans-serif',
                fontSize: '12px',
                fontWeight: 700,
                letterSpacing: '.1em',
                textTransform: 'uppercase'
              }}
            >
              {loading ? 'Signing in...' : 'Sign In →'}
            </button>
          </form>

          <div style={{ 
            marginTop: '24px',
            textAlign: 'center',
            fontSize: '12px',
            color: 'var(--muted)'
          }}>
            Not an admin? <a href="/login" style={{ color: 'var(--coral)', textDecoration: 'none' }}>Customer login →</a>
          </div>
        </div>
      </div>

      <footer>
        <div className="foot-logo">VIBIN</div>
        <div className="foot-tag">© 2026 Vibin Apparel · USA</div>
      </footer>
    </>
  );
}
