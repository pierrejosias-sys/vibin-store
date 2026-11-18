import SiteHeader from '../../components/SiteHeader'
import SiteFooter from '../../components/SiteFooter'

export const metadata = {
  title: 'Privacy Policy',
  description: 'Vibin Apparel Privacy Policy - How we collect, use, and protect your data.'
}

const section = { marginBottom: '40px' }
const h2 = { fontFamily: 'Anton, sans-serif', fontSize: '24px', color: '#f6f1e7', marginBottom: '16px' }
const list = { marginLeft: '20px', marginTop: '12px' }
const mt = { marginTop: '16px' }

export default function PrivacyPolicy() {
  return (
    <div style={{background:'#0a0a0a',minHeight:'100vh',color:'#f6f1e7',fontFamily:'Manrope, sans-serif'}}>
      <SiteHeader dark />

      <div style={{maxWidth:'800px',margin:'0 auto',padding:'60px 20px'}}>
        <div style={{marginBottom:'40px'}}>
          <h1 style={{fontFamily:'Anton, sans-serif',fontSize:'48px',textTransform:'uppercase',marginBottom:'12px'}}>Privacy Policy</h1>
          <p style={{color:'#888',fontSize:'14px',fontFamily:'JetBrains Mono, monospace',letterSpacing:'.1em'}}>
            Last Updated: November 18, 2026
          </p>
        </div>

        <div style={{lineHeight:'1.8',fontSize:'15px',color:'#ccc'}}>
          <section style={section}>
            <h2 style={h2}>1. Information We Collect</h2>
            <p>We collect information you give us when you:</p>
            <ul style={list}>
              <li>Create an account or sign in (name, email, and a password, which our sign-in provider stores only in scrambled, hashed form)</li>
              <li>Place or pre-order an order (name, email, shipping address, and the items you order; payment details go straight to Stripe)</li>
              <li>Join the Drop 01 waitlist or sign up for updates (email, first name, the styles you are interested in, and your consent to get emails)</li>
              <li>Contact support or use the Help chat (email, name, topic, order number, and your messages)</li>
              <li>Use Vibin Verify (the code on your tag, and your email if you claim points, plus your points balance and the rewards you redeem)</li>
              <li>Apply to be an ambassador (name, email, phone, social handles) and, once you earn commission, your payout details</li>
              <li>Apply for a job (name, email, portfolio, experience, cover letter)</li>
            </ul>
            <p style={mt}>Collected automatically:</p>
            <ul style={list}>
              <li>IP address and browser or device type, which our hosting and sign-in providers log when you visit or sign in, and which we use briefly to rate-limit our forms and Vibin Verify to prevent abuse</li>
              <li>The ambassador referral code from a link you opened, saved in your browser and attached to your order so the ambassador gets credit</li>
              <li>Standard server logs kept by our hosting provider (such as pages requested and time)</li>
            </ul>
          </section>

          <section style={section}>
            <h2 style={h2}>2. How We Use Your Information</h2>
            <p>We use your information to:</p>
            <ul style={list}>
              <li>Create and secure your account</li>
              <li>Process, print, ship, and support your orders and returns</li>
              <li>Send account and order emails (sign-up confirmation, password reset, shipping updates)</li>
              <li>Send Drop 01 launch and early-access emails to people who joined the waitlist (you can unsubscribe at any time)</li>
              <li>Run Vibin Verify, award points, and fulfill rewards</li>
              <li>Run the ambassador program: track referrals and calculate and pay commissions</li>
              <li>Review job applications and contact candidates</li>
              <li>Keep the website working and improve it</li>
              <li>Prevent fraud, abuse, and spam</li>
            </ul>
          </section>

          <section style={section}>
            <h2 style={h2}>3. Information Sharing</h2>
            <p>We do NOT sell your personal information. We share data only with the services that help us run the store:</p>
            <ul style={list}>
              <li><strong>Stripe</strong> — Payment processing (PCI-compliant); we never see or store your full card number</li>
              <li><strong>Printful</strong> — Prints and ships orders (receives your name, shipping address, email, and the items ordered)</li>
              <li><strong>Supabase</strong> — Secure database hosting and sign-in</li>
              <li><strong>Vercel</strong> — Website hosting</li>
              <li><strong>Resend</strong> — Delivers account and order emails</li>
              <li><strong>Brevo</strong> — Delivers Drop 01 waitlist and launch emails</li>
            </ul>
            <p style={mt}>We may disclose information if required by law or to protect our rights.</p>
          </section>

          <section style={section}>
            <h2 style={h2}>4. Data Security</h2>
            <p>Your data is protected using:</p>
            <ul style={list}>
              <li>Supabase Row Level Security (RLS) policies on our database tables</li>
              <li>HTTPS encryption for all data transmission</li>
              <li>Stripe's secure payment infrastructure (we never store card details)</li>
              <li>Access to customer records limited to authorized staff accounts</li>
              <li>Software updates to keep our systems current</li>
            </ul>
          </section>

          <section style={section}>
            <h2 style={h2}>5. Your Rights (GDPR/CCPA)</h2>
            <p>You have the right to:</p>
            <ul style={list}>
              <li><strong>Access</strong> — Request a copy of your data</li>
              <li><strong>Delete</strong> — Request deletion of your account and data</li>
              <li><strong>Update</strong> — Correct inaccurate information</li>
              <li><strong>Opt-out</strong> — Unsubscribe from marketing emails anytime</li>
              <li><strong>Portability</strong> — Receive your data in a structured format</li>
            </ul>
            <p style={mt}>To exercise these rights, email us at <a href="mailto:privacy@vibinapparel.com" style={{color:'#e05c2e'}}>privacy@vibinapparel.com</a></p>
          </section>

          <section style={section}>
            <h2 style={h2}>6. Cookies & Tracking</h2>
            <p>We use only the cookies and browser storage the site needs to work:</p>
            <ul style={list}>
              <li>Sign-in cookie — keeps you logged in</li>
              <li>Early-access cookie — if you open your waitlist link, it is saved for up to 60 days so the Drop 01 page recognizes you</li>
              <li>Cart — your cart items are kept in your browser</li>
              <li>Referral code — if you arrive through an ambassador link, the code is saved so they get credit for your order</li>
              <li>Help chat — your open support conversation is remembered on your device</li>
            </ul>
            <p style={mt}>We do NOT use advertising cookies, third-party tracking, or analytics trackers, and we do not sell data to advertisers.</p>
            <p style={mt}>A few pages load fonts, images, or QR codes from other services (Fontshare, Unsplash, QR Server). Those services can see your IP address and browser type when your browser asks them for the file.</p>
          </section>

          <section style={section}>
            <h2 style={h2}>7. Children's Privacy</h2>
            <p>Vibin Apparel is not intended for children under 16. We do not knowingly collect data from children. If you believe a child has provided us information, contact us immediately.</p>
          </section>

          <section style={section}>
            <h2 style={h2}>8. Changes to This Policy</h2>
            <p>We may update this policy occasionally. Changes will be posted here with a new "Last Updated" date. Continued use of our site constitutes acceptance of the updated policy.</p>
          </section>

          <section style={{marginBottom:'60px'}}>
            <h2 style={h2}>9. Contact Us</h2>
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

      <SiteFooter />
    </div>
  )
}
