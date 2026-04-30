'use client';

import { useState, useEffect } from 'react';
import styles from '../styles.css';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'YOUR_PROJECT_URL_HERE';
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'YOUR_ANON_KEY_HERE';

export default function Drop01Page() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');
  const [couponCode, setCouponCode] = useState('VIBE15');
  const [signupCount, setSignupCount] = useState(1247);
  const [countdown, setCountdown] = useState({ days: 14, hours: 6, minutes: 23, seconds: 47 });
  const [openFaq, setOpenFaq] = useState(0);

  useEffect(() => {
    const dropDate = new Date();
    dropDate.setDate(dropDate.getDate() + 14);

    const timer = setInterval(() => {
      const now = new Date();
      const diff = dropDate - now;
      if (diff > 0) {
        const days = Math.floor(diff / (1000 * 60 * 60 * 24));
        const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
        const minutes = Math.floor((diff / (1000 * 60)) % 60);
        const seconds = Math.floor((diff / 1000) % 60);
        setCountdown({ days, hours, minutes, seconds });
      }
    }, 1000);

    loadSignupCount();
    return () => clearInterval(timer);
  }, []);

  async function loadSignupCount() {
    try {
      const supabase = createSupabaseClient();
      if (!supabase) return;
      const { count } = await supabase
        .from('vibin_signups')
        .select('*', { count: 'exact', head: true });
      if (count !== null) setSignupCount(1247 + count);
    } catch (err) {
      console.warn('Could not load signup count:', err);
    }
  }

  function createSupabaseClient() {
    if (typeof window === 'undefined') return null;
    if (SUPABASE_URL === 'YOUR_PROJECT_URL_HERE') return null;
    const { createClient } = require('@supabase/supabase-js');
    return createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');

    if (!email.includes('@')) {
      setError('Please enter a valid email address.');
      return;
    }

    setLoading(true);

    try {
      const supabase = createSupabaseClient();
      if (!supabase) {
        // Test mode
        console.log('[Test mode] Email captured:', email);
        setSuccess(true);
        setLoading(false);
        return;
      }

      const code = 'VIBE' + Math.random().toString(36).substring(2, 6).toUpperCase();
      const { error: insertError } = await supabase
        .from('vibin_signups')
        .insert({
          email,
          coupon_code: code,
          source: 'drop-01-page',
          metadata: { page: '/drop-01' }
        })
        .select()
        .single();

      if (insertError) {
        if (insertError.code === '23505') {
          const { data } = await supabase
            .from('vibin_signups')
            .select('coupon_code')
            .eq('email', email)
            .single();
          setCouponCode(data?.coupon_code || 'VIBE15');
        } else {
          throw insertError;
        }
      } else {
        setCouponCode(code);
      }

      setSuccess(true);
      loadSignupCount();
    } catch (err) {
      console.error('Signup error:', err);
      setError('Something went wrong. Please try again.');
    }

    setLoading(false);
  }

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: styles }} />

      <div className="promo">
        ✦ Drop 01 launching soon · <strong>Sign up for 15% off + early access</strong> ✦
      </div>

      <section className="hero">
        <div className="hero-bg"></div>
        <div className="hero-grain"></div>

        <div className="hero-content">
          <div className="logo-mark">VIBIN</div>
          <div className="eyebrow">SS26 · Drop 01 · Coming Soon</div>
          <h1 className="headline">Vibin <em>Different.</em></h1>
          <p className="tagline">
            A lifestyle streetwear brand for those who move with intention. Heavyweight cotton, bold graphics, built to outlast the season. Drop 01 launches in:
          </p>

          <div className="countdown">
            <div className="cd">
              <div className="cd-num">{String(countdown.days).padStart(2, '0')}</div>
              <div className="cd-lbl">Days</div>
            </div>
            <div className="cd">
              <div className="cd-num">{String(countdown.hours).padStart(2, '0')}</div>
              <div className="cd-lbl">Hours</div>
            </div>
            <div className="cd">
              <div className="cd-num">{String(countdown.minutes).padStart(2, '0')}</div>
              <div className="cd-lbl">Minutes</div>
            </div>
            <div className="cd">
              <div className="cd-num">{String(countdown.seconds).padStart(2, '0')}</div>
              <div className="cd-lbl">Seconds</div>
            </div>
          </div>

          {!success ? (
            <div className="form-section">
              <div className="form-eye">Be First In Line</div>
              <h3 className="form-title">Get <em>15% off</em> Drop 01</h3>

              <form className="form-row" onSubmit={handleSubmit}>
                <input
                  type="email"
                  className="form-input"
                  placeholder="your@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
                <button type="submit" className="form-btn" disabled={loading}>
                  {loading ? 'Saving...' : 'Get Access →'}
                </button>
              </form>

              {error && <div className="form-error show">{error}</div>}

              <div className="form-perks">
                <div className="form-perk">Early Access</div>
                <div className="form-perk">15% Off First Order</div>
                <div className="form-perk">Free Shipping $75+</div>
              </div>
            </div>
          ) : (
            <div className="form-success show">
              <div className="form-success-icon">✦</div>
              <h3>You're <em>in.</em></h3>
              <p>Welcome to the circle. Save this 15% off code for Drop 01:</p>
              <div className="form-success-code">{couponCode}</div>
              <span className="form-success-code-lbl">Use at checkout when Drop 01 goes live</span>
            </div>
          )}

          <div className="proof-bar">
            <div><strong>240</strong>GSM Heavy Cotton</div>
            <div><strong>{signupCount.toLocaleString()}</strong>Already Signed Up</div>
            <div><strong>JAX, FL</strong>Founder Owned</div>
          </div>
        </div>

        <div className="scroll-hint">↓ Scroll for preview</div>
      </section>

      <section className="preview-section">
        <div className="section-eye">First Look · Drop 01</div>
        <h2 className="section-title">The <em>Foundation.</em></h2>
        <p className="section-desc">
          Eight founding pieces. Heavyweight cotton tees, hoodies, and headwear designed for everyday wear, built to outlast the trend that birthed them.
        </p>

        <div className="preview-grid">
          <div className="prev prev-1">
            <div className="prev-tag">Coming Soon</div>
            <div className="prev-graphic">VIBIN<em>different.</em></div>
            <div className="prev-name"><span>Foundation Tee</span><span className="prev-price">$48</span></div>
          </div>
          <div className="prev prev-2">
            <div className="prev-tag">Coming Soon</div>
            <div className="prev-graphic">VOL<em>01.</em></div>
            <div className="prev-name"><span>Vol 01 Hoodie</span><span className="prev-price">$98</span></div>
          </div>
          <div className="prev prev-3">
            <div className="prev-tag">Coming Soon</div>
            <div className="prev-graphic">MOVE<em>different.</em></div>
            <div className="prev-name"><span>Move Different Tee</span><span className="prev-price">$48</span></div>
          </div>
        </div>
      </section>

      <section className="manifesto">
        <div className="manifesto-text">
          Vibin <em>different</em> isn't a tagline.<br />
          It's a posture. <em>Confident.</em> Calm. Community.
        </div>
      </section>

      <section className="faq">
        <div className="faq-wrap">
          <div className="faq-hdr">
            <div className="section-eye">Common Questions</div>
            <h2 className="section-title">FA<em>Q.</em></h2>
          </div>

          {[
            {
              q: "When does Drop 01 launch?",
              a: "Drop 01 launches in 14 days. Email signups get 24-hour early access before the public launch. We'll text and email you the moment it's live."
            },
            {
              q: "What's in Drop 01?",
              a: "Eight founding pieces — including the Foundation Tee, Vol 01 Hoodie, Mark Hoodie, and Move Different Tee. Heavyweight 240 GSM cotton, embroidered chest mark, screen-printed graphics. Sizes XS to XL."
            },
            {
              q: "How is Vibin different?",
              a: "We're not chasing trends — we're building the uniform of people who already moved past them. Heavyweight, well-made pieces with intentional design. No fast fashion. Founder-owned out of Jacksonville, FL."
            },
            {
              q: "What does the 15% off cover?",
              a: "Email signups get a 15% off code valid on your first Drop 01 order. Plus 24-hour early access before the public launch — drops typically sell out in size, so early access locks your piece."
            },
            {
              q: "Where do you ship?",
              a: "US-wide for Drop 01. International shipping coming with Drop 02. Free standard shipping on orders over $75."
            },
            {
              q: "How can I become a Vibin Ambassador?",
              a: "Ambassador applications open the day after Drop 01 launches. Earn 12% commission per sale, get early drops, and 24-hour access to new pieces. Sign up with your email above to be notified when applications open."
            }
          ].map((faq, i) => (
            <div key={i} className={`faq-item ${openFaq === i ? 'open' : ''}`}>
              <button className="faq-q" onClick={() => setOpenFaq(openFaq === i ? -1 : i)}>
                <span>{faq.q}</span>
                <span className="arrow">+</span>
              </button>
              <div className="faq-a">{faq.a}</div>
            </div>
          ))}
        </div>
      </section>

      <footer>
        <div className="foot-logo">VIBIN</div>
        <div className="foot-social">
          <a href="#">Instagram</a>
          <a href="#">TikTok</a>
          <a href="#">Twitter / X</a>
        </div>
        <div className="foot-tag">© 2026 Vibin Apparel · Jacksonville, FL · A subsidiary of HVD Holdings</div>
      </footer>
    </>
  );
}
