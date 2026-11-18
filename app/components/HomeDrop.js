'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { DROP_01 } from '../lib/drop-public.mjs'
import { dropPhase, countdownTarget } from '../lib/drop-window.mjs'
import { dropBlockCopy, countdownParts } from '../lib/drop-copy.mjs'

const pad = n => String(n).padStart(2, '0')

/**
 * Home page "Drop 01" block: wording and countdown follow the pre-order window. Until the page has
 * loaded in the browser it shows a line that is true in every phase and "--" placeholders, so the
 * server HTML and the first client render match (the old inline script rewrote the numbers before
 * the page finished loading, which caused a React hydration error on the home page).
 */
export default function HomeDrop() {
  const [now, setNow] = useState(null)
  useEffect(() => {
    setNow(Date.now())
    const t = setInterval(() => setNow(Date.now()), 1000)
    return () => clearInterval(t)
  }, [])

  const phase = now == null ? null : dropPhase(DROP_01.opensAt, DROP_01.closesAt, now)
  const copy = dropBlockCopy(DROP_01, phase)
  const target = phase ? countdownTarget(phase, DROP_01.opensAt, DROP_01.closesAt) : null
  const t = target ? countdownParts(new Date(target).getTime() - now) : null
  const show = v => (t ? pad(v) : '--')

  return (
    <section className="drop-block">
      <div className="drop-left">
        <div className="drop-eye">{copy.eyebrow}</div>
        <h2 className="drop-title">Drop <em>01</em></h2>
        <p className="drop-info">{copy.body}</p>
        {copy.cta.href.startsWith('/')
          ? <Link href={copy.cta.href} className="btn" style={{ borderColor: 'var(--cream)', color: 'var(--cream)' }}>{copy.cta.label}</Link>
          : <a href={copy.cta.href} className="btn" style={{ borderColor: 'var(--cream)', color: 'var(--cream)' }}>{copy.cta.label}</a>}
      </div>
      {phase === 'closed' ? (
        <div className="countdown" id="countdown" style={{ display: 'block', background: 'transparent' }}>
          <div className="drop-closed">Pre-order closed</div>
        </div>
      ) : (
        <div className="countdown" id="countdown" aria-label={copy.counting || 'Countdown'}>
          <div className="cd"><div className="cd-num" id="cd-d">{show(t?.d)}</div><div className="cd-lbl">Days</div></div>
          <div className="cd"><div className="cd-num" id="cd-h">{show(t?.h)}</div><div className="cd-lbl">Hours</div></div>
          <div className="cd"><div className="cd-num" id="cd-m">{show(t?.m)}</div><div className="cd-lbl">Minutes</div></div>
          <div className="cd"><div className="cd-num" id="cd-s">{show(t?.s)}</div><div className="cd-lbl">Seconds</div></div>
        </div>
      )}
    </section>
  )
}
