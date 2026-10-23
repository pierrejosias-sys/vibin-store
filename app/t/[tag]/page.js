import { notFound } from 'next/navigation'
import { cache } from 'react'
import { createClient } from '@supabase/supabase-js'
import { parseTag, DROPS, STYLE_NAMES } from '../../lib/drops'

export const dynamic = 'force-dynamic'

const lookup = cache(async (tag) => {
  const parsed = parseTag(tag)
  if (!parsed) return null
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  if (!url || !key) return null
  const supabase = createClient(url, key, { auth: { persistSession: false } })
  // Public RPC: returns the piece only if drop, style, number AND secret code all match.
  const { data, error } = await supabase.rpc('piece_by_tag', {
    p_drop_id: parsed.dropId,
    p_style_code: parsed.style,
    p_number: parsed.number,
    p_code: parsed.code,
  })
  if (error || !data?.length) return null
  return data[0]
})

export async function generateMetadata({ params }) {
  const { tag } = await params
  const piece = await lookup(tag)
  if (!piece) return { title: 'Tag not found — Vibin Apparel', robots: { index: false } }
  const styleName = piece.style_name || STYLE_NAMES[piece.style_code] || piece.style_code
  return {
    title: `${styleName} ${piece.number}/${piece.total} — ${piece.drop_name} — Vibin Apparel`,
    robots: { index: false, follow: false },
  }
}

export default async function TagPage({ params }) {
  const { tag } = await params
  const piece = await lookup(tag)
  if (!piece) notFound()

  const styleName = piece.style_name || STYLE_NAMES[piece.style_code] || piece.style_code
  const drop = DROPS[piece.drop_id]
  const n = String(piece.number).padStart(3, '0')

  return (
    <main style={{ background: '#0a0a0a', color: '#f5f5f5', minHeight: '100vh', padding: '64px 20px' }}>
      <div style={{ maxWidth: 640, margin: '0 auto' }}>
        <div style={{ letterSpacing: 4, fontSize: 12, textTransform: 'uppercase', opacity: 0.6 }}>
          {piece.drop_name || drop?.name}
        </div>
        <h1 style={{ fontSize: 'clamp(40px, 9vw, 80px)', margin: '12px 0 4px', lineHeight: 1 }}>No. {n}</h1>
        <p style={{ fontSize: 22, margin: 0 }}>{piece.number} of {piece.total} · {styleName}{piece.size ? ` · ${piece.size}` : ''}</p>

        <section style={{ marginTop: 32, padding: 20, border: '1px solid #2a5', background: '#0f1a12' }}>
          <strong>✓ Authentic Vibin Apparel piece</strong>
          <p style={{ margin: '8px 0 0', opacity: 0.8, fontSize: 14 }}>
            This tag matches a numbered piece in our registry
            {piece.status === 'sold' && piece.sold_at ? `, first sold ${new Date(piece.sold_at).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}` : ''}.
            Each tag code is unique — if the code on your tag doesn&apos;t open this page, it isn&apos;t ours.
          </p>
        </section>

        <section style={{ marginTop: 32 }}>
          <h2 style={{ fontSize: 16, letterSpacing: 2, textTransform: 'uppercase' }}>The drop</h2>
          {/* PLACEHOLDER: drop story copy (drops.story) */}
          <p style={{ opacity: 0.8 }}>{piece.drop_story || drop?.story}</p>
        </section>

        <section style={{ marginTop: 32 }}>
          <h2 style={{ fontSize: 16, letterSpacing: 2, textTransform: 'uppercase' }}>Care</h2>
          {/* PLACEHOLDER: care info copy (drop_styles.care_info) */}
          <p style={{ opacity: 0.8 }}>{piece.care_info || 'PLACEHOLDER care info.'}</p>
        </section>
      </div>
    </main>
  )
}
