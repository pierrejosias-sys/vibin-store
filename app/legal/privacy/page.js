import Link from 'next/link'

export const metadata = {
  title: 'Privacy Policy | Vibin Apparel',
  description: 'Vibin Apparel Privacy Policy - How we collect, use, and protect your data.'
}

export default function PrivacyPolicy() {
  return (
    <div style={{background:'#0a0a0a',minHeight:'100vh',color:'#f6f1e7',fontFamily:'Manrope, sans-serif'}}>
      <header style={{padding:'20px 40px',borderBottom:'1px solid #1e1e1e',display:'flex',justifyContent:'space-between',alignItems:'center'}}>
        <Link href="/" style={{fontFamily:'Anton, sans-serif',fontSize:'32px',color:'#f6f1e7',textDecoration:'none'}}>VIBIN</Link>
        <Link href="/" style={{fontSize:'14px',color:'#888',textDecoration:'none'}}>← Back to Home</Link>
      </header>

      <div style={{maxWidth:'800px',margin:'0 auto',padding:'60px 20px'}}>
        <div style={{marginBottom:'40px'}}>
          <h1 style={{fontFamily:'Anton, sans-serif',fontSize:'48px',textTransform:'uppercase',marginBottom:'12px'}}>Privacy Policy</h1>
          <p style={{color:'#888',fontSize:'14px',fontFamily:'JetBrains Mono, monospace',letterSpacing:'.1em'}}>
            Last Updated: April 30, 2026
          </p>
        </div>

        <div style={{lineHeight:'1.8',fontSize:'15px',color:'#ccc'}}>
          <section style={{marginBottom:'40px'}}>
            <h2 style={{fontFamily:'Anton, sans-serif',fontSize:'24px',color:'#f6f1e7',marginBottom:'16px'}}>1. Information We Collect</h2>
            <p>We collect information you provide directly when you:</p>
            <ul style={{marginLeft:'20px',marginTop:'12px'}}>
              <li>Sign up for Drop 01 notifications (email address)</li>
              <li>Apply to be an ambassador (name, email, social handles)</li>
              <li>Apply for job positions (name, email, portfolio, experience)</li>
              <li>Contact support (email, message content)</li>
              <li>Make a purchase (shipping address, payment info via Stripe)</li>
            </ul>
            <p style={{marginTop:'16px'}}>Automatically collected information:</p>
            <ul style={{marginLeft:'20px',marginTop:'12px'}}>
              <li>IP address and location (city-level)</li>
              <li>Browser type and device information</li>
              <li>Pages visited and time spent on site</li>
              <li>Referral source (how you found us)</li>
            </ul>
          </section>

          <section style={{marginBottom:'40px'}}>
            <h2 style={{fontFamily:'Anton, sans-serif',fontSize:'24px',color:'#f6f1e7',marginBottom:'16px'}}>2. How We Use Your Information</h2>
            <p>We use your information to:</p>
            <ul style={{marginLeft:'20px',marginTop:'12px'}}>
              <li>Send Drop 01 launch notifications and promotional emails</li>
              <li>Process ambassador applications and track referrals</li>
              <li>Review job applications and contact candidates</li>
              <li>Provide customer support and process orders</li>
              <li>Improve our website and user experience</li>
              <li>Prevent fraud and ensure security</li>
            </ul>
          </section>

          <section style={{marginBottom:'40px'}}>
            <h2 style={{fontFamily:'Anton, sans-serif',fontSize:'24px',color:'#f6f1e7',marginBottom:'16px'}}>3. Information Sharing</h2>
            <p>We do NOT sell your personal information. We share data only with:</p>
            <ul style={{marginLeft:'20px',marginTop:'12px'}}>
              <li><strong>Stripe</strong> — Payment processing (PCI-compliant)</li>
              <li><strong>Supabase</strong> — Secure database hosting</li>
              <li><strong>Vercel</strong> — Website hosting and analytics</li>
              <li><strong>Email service provider</strong> — For sending notifications (when configured)</li>
            </ul>
            <p style={{marginTop:'16px'}}>We may disclose information if required by law or to protect our rights.</p>
          </section>

          <section style={{marginBottom:'40px'}}>
            <h2 style={{fontFamily:'Anton, sans-serif',fontSize:'24px',color:'#f6f1e7',marginBottom:'16px'}}>4. Data Security</h2>
            <p>Your data is protected using:</p>
            <ul style={{marginLeft:'20px',marginTop:'12px'}}>
              <li>Supabase Row Level Security (RLS) policies</li>
              <li>HTTPS encryption for all data transmission</li>
              <li>Stripe's secure payment infrastructure (we never store card details)</li>
              <li>Regular security audits and updates</li>
            </ul>
          </section>

          <section style={{marginBottom:'40px'}}>
            <h2 style={{fontFamily:'Anton, sans-serif',fontSize:'24px',color:'#f6f1e7',marginBottom:'16px'}}>5. Your Rights (GDPR/CCPA)</h2>
            <p>You have the right to:</p>
            <ul style={{marginLeft:'20px',marginTop:'12px'}}>
              <li><strong>Access</strong> — Request a copy of your data</li>
              <li><strong>Delete</strong> — Request deletion of your account and data</li>
              <li><strong>Update</strong> — Correct inaccurate information</li>
              <li><strong>Opt-out</strong> — Unsubscribe from marketing emails anytime</li>
              <li><strong>Portability</strong> — Receive your data in a structured format</li>
            </ul>
            <p style={{marginTop:'16px'}}>To exercise these rights, email us at <a href="mailto:privacy@vibinapparel.com" style={{color:'#e05c2e'}}>privacy@vibinapparel.com</a></p>
          </section>

          <section style={{marginBottom:'40px'}}>
            <h2 style={{fontFamily:'Anton, sans-serif',fontSize:'24px',color:'#f6f1e7',marginBottom:'16px'}}>6. Cookies & Tracking</h2>
            <p>We use minimal cookies for:</p>
            <ul style={{marginLeft:'20px',marginTop:'12px'}}>
              <li>Remembering your cart items</li>
              <li>Tracking referral codes (ambassador programs)</li>
              <li>Essential site functionality (no tracking/ads)</li>
            </ul>
            <p style={{marginTop:'16px'}}>We do NOT use third-party tracking cookies or sell data to advertisers.</p>
          </section>

          <section style={{marginBottom:'40px'}}>
            <h2 style={{fontFamily:'Anton, sans-serif',fontSize:'24px',color:'#f6f1e7',marginBottom:'16px'}}>7. Children's Privacy</h2>
            <p>Vibin Apparel is not intended for children under 16. We do not knowingly collect data from children. If you believe a child has provided us information, contact us immediately.</p>
          </section>

          <section style={{marginBottom:'40px'}}>
            <h2 style={{fontFamily:'Anton, sans-serif',fontSize:'24px',color:'#f6f1e7',marginBottom:'16px'}}>8. Changes to This Policy</h2>
            <p>We may update this policy occasionally. Changes will be posted here with a new "Last Updated" date. Continued use of our site constitutes acceptance of the updated policy.</p>
          </section>

          <section style={{marginBottom:'60px'}}>
            <h2 style={{fontFamily:'Anton, sans-serif',fontSize:'24px',color:'#f6f1e7',marginBottom:'16px'}}>9. Contact Us</h2>
            <p>For privacy-related questions:</p>
            <p style={{marginTop:'12px'}}>
              Email: <a href="mailto:privacy@vibinapparel.com" style={{color:'#e05c2e'}}>privacy@vibinapparel.com</a><br />
              Mail: Vibin Apparel, LLC (c/o HVD Holdings, LLC)<br />
              10151 Deerwood Park Blvd, Building 100, Suite 250<br />
              Jacksonville, FL 32256
            </p>
          </section>

          <div style={{borderTop:'1px solid #1e1e1e',paddingTop:'30px',textAlign:'center'}}>
            <p style={{fontSize:'12px',color:'#555',fontFamily:'JetBrains Mono, monospace',letterSpacing:'.1em'}}>
              VIBIN APPAREL, LLC · A SUBSIDIARY OF HVD HOLDINGS, LLC · FLORIDA
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
