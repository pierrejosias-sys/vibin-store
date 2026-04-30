'use client';

import { useState } from 'react';
import { supabase } from '../../lib/supabase';
import styles from '../../styles.css';

export default function JobApplicationPage({ params }) {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    portfolio: '',
    experience: '',
    cover_letter: ''
  });
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');

  const jobTitles = {
    '1': 'Support Specialist',
    '2': 'Full-Stack Developer',
    '3': 'DevOps / Infrastructure'
  };

  const jobTitle = jobTitles[params.id] || 'Unknown Position';

  function handleChange(e) {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);
    setError('');

    if (!formData.name || !formData.email || !formData.experience) {
      setError('Please fill in all required fields.');
      setLoading(false);
      return;
    }

    try {
      const { error: insertError } = await supabase
        .from('job_applications')
        .insert([{
          job_id: parseInt(params.id),
          job_title: jobTitle,
          name: formData.name,
          email: formData.email,
          portfolio: formData.portfolio,
          experience: formData.experience,
          cover_letter: formData.cover_letter,
          status: 'pending',
          applied_at: new Date()
        }]);

      if (insertError) throw insertError;

      setSubmitted(true);
    } catch (err) {
      console.error('Application error:', err);
      setError('Something went wrong. Please try again or email hello@vibinapparel.com');
    }

    setLoading(false);
  }

  if (submitted) {
    return (
      <>
        <style dangerouslySetInnerHTML={{ __html: styles }} />
        <nav>
          <a href="/" className="logo">VIBIN</a>
          <div className="nav-links">
            <a href="/careers" style={{ color: 'var(--coral)' }}>Careers</a>
          </div>
        </nav>

        <div style={{
          minHeight: 'calc(100vh - 160px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '40px 20px'
        }}>
          <div style={{
            maxWidth: '500px',
            width: '100%',
            textAlign: 'center',
            padding: '60px 40px',
            background: 'var(--ink2)',
            border: '1px solid var(--line)'
          }}>
            <div style={{ fontSize: '48px', marginBottom: '16px' }}>✓</div>
            <h2 style={{
              fontFamily: 'Anton, sans-serif',
              fontSize: '32px',
              textTransform: 'uppercase',
              marginBottom: '12px'
            }}>
              Application <em style={{ fontStyle: 'italic', color: 'var(--coral)' }}>Submitted</em>
            </h2>
            <p style={{
              fontSize: '14px',
              color: 'var(--muted)',
              lineHeight: '1.7',
              marginBottom: '24px'
            }}>
              Thanks for applying to the <strong>{jobTitle}</strong> position.
              We'll review your application and get back to you within 48 hours.
            </p>
            <a
              href="/careers"
              style={{
                display: 'inline-block',
                padding: '12px 24px',
                background: 'var(--coral)',
                color: 'var(--cream)',
                textDecoration: 'none',
                fontFamily: 'Manrope, sans-serif',
                fontSize: '12px',
                fontWeight: 700,
                letterSpacing: '.1em',
                textTransform: 'uppercase'
              }}
            >
              Back to Careers →
            </a>
          </div>
        </div>

        <footer>
          <div className="foot-logo">VIBIN</div>
          <div className="foot-tag">© 2026 Vibin Apparel · Jacksonville, FL</div>
        </footer>
      </>
    );
  }

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: styles }} />

      <nav>
        <a href="/" className="logo">VIBIN</a>
        <div className="nav-links">
          <a href="/shop">Shop</a>
          <a href="/careers" style={{ color: 'var(--coral)' }}>Careers</a>
        </div>
      </nav>

      <section style={{ padding: '120px 32px 60px', maxWidth: '800px', margin: '0 auto' }}>
        <div style={{ textAlign: 'center', marginBottom: '40px' }}>
          <div style={{
            fontFamily: 'JetBrains Mono, monospace',
            fontSize: '11px',
            letterSpacing: '.2em',
            textTransform: 'uppercase',
            color: 'var(--coral)',
            marginBottom: '12px'
          }}>
            Apply Now
          </div>
          <h1 style={{
            fontFamily: 'Anton, sans-serif',
            fontSize: 'clamp(36px, 5vw, 56px)',
            lineHeight: '.9',
            letterSpacing: '-.005em',
            textTransform: 'uppercase',
            marginBottom: '12px'
          }}>
            {jobTitle}
          </h1>
          <p style={{
            fontSize: '14px',
            color: 'var(--muted)',
            lineHeight: '1.7'
          }}>
            Fill out the form below. We'll review and get back to you within 48 hours.
          </p>
        </div>

        <form onSubmit={handleSubmit} style={{
          background: 'var(--ink2)',
          border: '1px solid var(--line)',
          padding: '32px'
        }}>
          <div style={{ marginBottom: '16px' }}>
            <div style={{
              fontFamily: 'JetBrains Mono, monospace',
              fontSize: '10px',
              letterSpacing: '.15em',
              textTransform: 'uppercase',
              color: 'var(--muted)',
              marginBottom: '8px'
            }}>
              Full Name *
            </div>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              required
              placeholder="John Doe"
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

          <div style={{ marginBottom: '16px' }}>
            <div style={{
              fontFamily: 'JetBrains Mono, monospace',
              fontSize: '10px',
              letterSpacing: '.15em',
              textTransform: 'uppercase',
              color: 'var(--muted)',
              marginBottom: '8px'
            }}>
              Email *
            </div>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              required
              placeholder="john@email.com"
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

          <div style={{ marginBottom: '16px' }}>
            <div style={{
              fontFamily: 'JetBrains Mono, monospace',
              fontSize: '10px',
              letterSpacing: '.15em',
              textTransform: 'uppercase',
              color: 'var(--muted)',
              marginBottom: '8px'
            }}>
              Portfolio / LinkedIn / GitHub
            </div>
            <input
              type="url"
              name="portfolio"
              value={formData.portfolio}
              onChange={handleChange}
              placeholder="https://yourportfolio.com"
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

          <div style={{ marginBottom: '16px' }}>
            <div style={{
              fontFamily: 'JetBrains Mono, monospace',
              fontSize: '10px',
              letterSpacing: '.15em',
              textTransform: 'uppercase',
              color: 'var(--muted)',
              marginBottom: '8px'
            }}>
              Experience * (relevant to this role)
            </div>
            <textarea
              name="experience"
              value={formData.experience}
              onChange={handleChange}
              required
              rows="4"
              placeholder="Tell us about your relevant experience..."
              style={{
                width: '100%',
                padding: '12px 16px',
                background: 'var(--ink)',
                border: '1px solid var(--line)',
                color: 'var(--cream)',
                fontSize: '14px',
                fontFamily: 'Manrope, sans-serif',
                resize: 'vertical',
                minHeight: '100px'
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
              Cover Letter (optional)
            </div>
            <textarea
              name="cover_letter"
              value={formData.cover_letter}
              onChange={handleChange}
              rows="6"
              placeholder="Why do you want to work at Vibin? What makes you different?"
              style={{
                width: '100%',
                padding: '12px 16px',
                background: 'var(--ink)',
                border: '1px solid var(--line)',
                color: 'var(--cream)',
                fontSize: '14px',
                fontFamily: 'Manrope, sans-serif',
                resize: 'vertical',
                minHeight: '150px'
              }}
            />
          </div>

          {error && (
            <div style={{
              padding: '12px 16px',
              background: 'rgba(255, 74, 61, 0.15)',
              border: '1px solid rgba(255, 74, 61, 0.4)',
              color: '#ff8b8b',
              fontSize: '12px',
              marginBottom: '16px'
            }}>
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            style={{
              width: '100%',
              padding: '14px 24px',
              background: loading ? 'var(--ink3)' : 'var(--coral)',
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
            {loading ? 'Submitting...' : 'Submit Application →'}
          </button>
        </form>
      </section>

      <footer>
        <div className="foot-logo">VIBIN</div>
        <div className="foot-tag">© 2026 Vibin Apparel · Jacksonville, FL</div>
      </footer>
    </>
  );
}
