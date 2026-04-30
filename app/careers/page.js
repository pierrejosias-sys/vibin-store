'use client';

import { useState } from 'react';
import Link from 'next/link';
import styles from '../styles.css';

export default function CareersPage() {
  const [selectedRole, setSelectedRole] = useState(null);

  const roles = [
    {
      id: 1,
      title: 'Support Specialist',
      type: 'Customer Support',
      location: 'Remote / Jacksonville, FL',
      type_label: 'Full-Time',
      description: 'Be the frontline of Vibin Apparel. Help customers with orders, returns, sizing, and keep the vibe calm and confident.',
      responsibilities: [
        'Respond to customer emails (returns@vibinapparel.com) within 24hrs',
        'Handle returns, exchanges, and order tracking via Supabase admin',
        'Monitor and respond via the Support Chat system',
        'Flag urgent issues to the operations team',
        'Maintain the calm, confident Vibin tone in all replies'
      ],
      requirements: [
        'Excellent written communication skills',
        'Familiarity with e-commerce (Shopify/Stripe preferred)',
        'Based in US (for payment processing)',
        'Available to work flexible hours'
      ],
      nice_to_have: [
        'Experience with Supabase or similar databases',
        'Familiarity with Next.js / React',
        'Streetwear or fashion background'
      ]
    },
    {
      id: 2,
      title: 'Full-Stack Developer',
      type: 'Engineering',
      location: 'Remote / Jacksonville, FL',
      type_label: 'Contract / Part-Time',
      description: 'Help build and maintain vibinapparel.com. Work with Next.js, Supabase, Stripe, and Vercel to keep the store running smooth.',
      responsibilities: [
        'Maintain and update the Next.js e-commerce application',
        'Integrate new features (drop pages, ambassador tools, analytics)',
        'Manage Supabase database (schema, RLS policies, functions)',
        'Configure Vercel deployments and environment variables',
        'Debug payment issues with Stripe integration'
      ],
      requirements: [
        'Proficiency with React / Next.js (app router)',
        'Experience with Supabase (PostgreSQL, RLS, JS client)',
        'Familiarity with Stripe payments and webhooks',
        'Git / GitHub workflow experience'
      ],
      nice_to_have: [
        'Experience with Vercel deployments and speed insights',
        'Familiarity with Tailwind CSS or similar',
        'E-commerce domain knowledge'
      ]
    },
    {
      id: 3,
      title: 'DevOps / Infrastructure',
      type: 'Engineering',
      location: 'Remote',
      type_label: 'Contract / Project-Based',
      description: 'Set up and maintain the infrastructure behind vibinapparel.com. Domains, deployments, monitoring, and security.',
      responsibilities: [
        'Manage Vercel project settings, domains, and environment variables',
        'Configure DNS for vibinapparel.com and potential secondary domains',
        'Set up monitoring and alerts (Vercel Speed Insights, error tracking)',
        'Maintain security best practices (RLS policies, API keys, env vars)',
        'Document deployment processes and troubleshooting steps'
      ],
      requirements: [
        'Experience with Vercel platform and deployments',
        'DNS management (A, CNAME, MX records)',
        'Understanding of environment variables and secrets management',
        'Familiarity with Git and CI/CD concepts'
      ],
      nice_to_have: [
        'Supabase project management experience',
        'SSL/TLS certificate management',
        'Scripting / automation skills'
      ]
    }
  ];

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: styles }} />

      <nav>
        <a href="/" className="logo">VIBIN</a>
        <div className="nav-links">
          <a href="/shop">Shop</a>
          <a href="/drop-01" className="new" style={{color:'var(--coral)'}}>Drop 01 ★</a>
          <a href="/lookbook">Lookbook</a>
          <a href="/about">About</a>
          <a href="/careers" style={{color:'var(--coral)'}}>Careers</a>
        </div>
      </nav>

      <section style={{padding:'120px 32px 60px', maxWidth:'1100px', margin:'0 auto'}}>
        <div style={{textAlign:'center', marginBottom:'60px'}}>
          <div style={{fontFamily:'JetBrains Mono, monospace', fontSize:'11px', letterSpacing:'.2em', textTransform:'uppercase', color:'var(--coral)', marginBottom:'16px'}}>
            Join The Team
          </div>
          <h1 style={{fontFamily:'Anton, sans-serif', fontSize:'clamp(40px, 6vw, 72px)', lineHeight:'.9', letterSpacing:'-.005em', textTransform:'uppercase', marginBottom:'16px'}}>
            Work at <em style={{fontStyle:'italic', color:'var(--coral)'}}>Vibin.</em>
          </h1>
          <p style={{fontSize:'15px', color:'var(--muted)', lineHeight:'1.7', maxWidth:'540px', margin:'0 auto'}}>
            We're a small, intentional team building lifestyle streetwear. Remote-friendly, Jacksonville-based. Help us move different.
          </p>
        </div>

        <div style={{display:'grid', gap:'16px'}}>
          {roles.map(role => (
            <div key={role.id} style={{background:'var(--ink2)', border:'1px solid var(--line)', borderRadius:'4px', overflow:'hidden'}}>
              <div
                style={{padding:'24px', cursor:'pointer', display:'flex', justifyContent:'space-between', alignItems:'center'}}
                onClick={() => setSelectedRole(selectedRole === role.id ? null : role.id)}
              >
                <div>
                  <div style={{fontFamily:'JetBrains Mono, monospace', fontSize:'10px', letterSpacing:'.15em', textTransform:'uppercase', color:'var(--coral)', marginBottom:'8px'}}>
                    {role.type}
                  </div>
                  <h3 style={{fontFamily:'Anton, sans-serif', fontSize:'24px', textTransform:'uppercase', letterSpacing:'.02em'}}>
                    {role.title}
                  </h3>
                  <div style={{fontSize:'12px', color:'var(--muted)', marginTop:'4px'}}>
                    {role.location} · {role.type_label}
                  </div>
                </div>
                <div style={{fontSize:'24px', color:'var(--coral)', transition:'transform .25s', transform: selectedRole === role.id ? 'rotate(45deg)' : 'rotate(0)'}}>
                  +
                </div>
              </div>

              {selectedRole === role.id && (
                <div style={{padding:'0 24px 24px', borderTop:'1px solid var(--line)', paddingTop:'24px'}}>
                  <p style={{fontSize:'14px', lineHeight:'1.7', color:'var(--muted)', marginBottom:'24px'}}>
                    {role.description}
                  </p>

                  <div style={{display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(280px, 1fr))', gap:'24px', marginBottom:'24px'}}>
                    <div>
                      <h4 style={{fontFamily:'JetBrains Mono, monospace', fontSize:'10px', letterSpacing:'.15em', textTransform:'uppercase', color:'var(--coral)', marginBottom:'12px'}}>
                        Responsibilities
                      </h4>
                      {role.responsibilities.map((item, i) => (
                        <div key={i} style={{fontSize:'13px', marginBottom:'8px', paddingLeft:'16px', position:'relative'}}>
                          <span style={{position:'absolute', left:'0', color:'var(--coral)'}}>▸</span>
                          {item}
                        </div>
                      ))}
                    </div>

                    <div>
                      <h4 style={{fontFamily:'JetBrains Mono, monospace', fontSize:'10px', letterSpacing:'.15em', textTransform:'uppercase', color:'var(--coral)', marginBottom:'12px'}}>
                        Requirements
                      </h4>
                      {role.requirements.map((item, i) => (
                        <div key={i} style={{fontSize:'13px', marginBottom:'8px', paddingLeft:'16px', position:'relative'}}>
                          <span style={{position:'absolute', left:'0', color:'var(--coral)'}}>▸</span>
                          {item}
                        </div>
                      ))}
                    </div>
                  </div>

                  {role.nice_to_have && (
                    <div style={{marginBottom:'24px'}}>
                      <h4 style={{fontFamily:'JetBrains Mono, monospace', fontSize:'10px', letterSpacing:'.15em', textTransform:'uppercase', color:'var(--muted)', marginBottom:'12px'}}>
                        Nice to Have
                      </h4>
                      <div style={{display:'flex', gap:'8px', flexWrap:'wrap'}}>
                        {role.nice_to_have.map((item, i) => (
                          <span key={i} style={{fontSize:'11px', padding:'6px 12px', background:'var(--ink3)', border:'1px solid var(--line)', fontFamily:'JetBrains Mono, monospace', letterSpacing:'.05em'}}>
                            {item}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  <Link
                    href={`/careers/${role.id}`}
                    style={{display:'inline-block', padding:'14px 28px', background:'var(--coral)', color:'var(--cream)', textDecoration:'none', fontFamily:'Manrope, sans-serif', fontSize:'12px', fontWeight:700, letterSpacing:'.1em', textTransform:'uppercase', cursor:'pointer'}}
                  >
                    Apply Now →
                  </Link>
                </div>
              )}
            </div>
          ))}
        </div>

        <div style={{textAlign:'center', marginTop:'80px', padding:'40px', background:'var(--ink2)', border:'1px solid var(--line)'}}>
          <h3 style={{fontFamily:'Anton, sans-serif', fontSize:'28px', textTransform:'uppercase', marginBottom:'12px'}}>
            Don't see your <em style={{fontStyle:'italic', color:'var(--coral)'}}>role?</em>
          </h3>
          <p style={{fontSize:'14px', color:'var(--muted)', lineHeight:'1.7', marginBottom:'24px', maxWidth:'480px', margin:'0 auto 24px'}}>
            We're always looking for creative, technical, and operational talent. Send us your info and we'll keep you in mind.
          </p>
          <Link
            href="/careers/1"
            style={{display:'inline-block', padding:'14px 28px', background:'transparent', color:'var(--cream)', border:'2px solid var(--cream)', textDecoration:'none', fontFamily:'Manrope, sans-serif', fontSize:'12px', fontWeight:700, letterSpacing:'.1em', textTransform:'uppercase'}}
          >
            Send General Application →
          </Link>
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
