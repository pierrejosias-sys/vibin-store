'use client'

import { useState, useEffect } from 'react'

// SET YOUR DROP 02 TARGET DATE HERE (YYYY, MM-1, DD, HH, MM, SS)
// Month is 0-indexed: Jan=0, Feb=1, Mar=2 ... Dec=11
const DROP02_DATE = new Date(2026, 8, 1, 0, 0, 0) // September 1, 2026

export default function CountdownTimer() {
  const [timeLeft, setTimeLeft] = useState(null)
  const [isLive, setIsLive] = useState(false)

  useEffect(() => {
    function calculate() {
      const now = new Date().getTime()
      const diff = DROP02_DATE.getTime() - now

      if (diff <= 0) {
        setIsLive(true)
        return
      }

      setTimeLeft({
        days: Math.floor(diff / (1000 * 60 * 60 * 24)),
        hours: Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
        mins: Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60)),
        secs: Math.floor((diff % (1000 * 60)) / 1000),
      })
    }

    calculate()
    const interval = setInterval(calculate, 1000)
    return () => clearInterval(interval)
  }, [])

  if (isLive) {
    return (
      <div className="countdown">
        <a
          href="/shop"
          style={{ color: '#f6f1e7', fontSize: '24px', fontFamily: 'Anton, sans-serif', textTransform: 'uppercase' }}
        >
          Drop 02 is LIVE. Shop Now →
        </a>
      </div>
    )
  }

  if (!timeLeft) return null

  const pad = (n) => String(n).padStart(2, '0')

  return (
    <div className="countdown" id="countdown">
      <div className="cd">
        <div className="cd-num">{pad(timeLeft.days)}</div>
        <div className="cd-lbl">Days</div>
      </div>
      <div className="cd">
        <div className="cd-num">{pad(timeLeft.hours)}</div>
        <div className="cd-lbl">Hours</div>
      </div>
      <div className="cd">
        <div className="cd-num">{pad(timeLeft.mins)}</div>
        <div className="cd-lbl">Minutes</div>
      </div>
      <div className="cd">
        <div className="cd-num">{pad(timeLeft.secs)}</div>
        <div className="cd-lbl">Seconds</div>
      </div>
    </div>
  )
}
