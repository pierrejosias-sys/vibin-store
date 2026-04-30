import Link from 'next/link'

export const metadata = {
  title: 'Terms of Service | Vibin Apparel',
  description: 'Vibin Apparel Terms of Service - Terms and conditions for using our website and services.'
}

export default function TermsOfService() {
  return (
    <div style={{background:'#0a0a0a',minHeight:'100vh',color:'#f6f1e7',fontFamily:'Manrope, sans-serif'}}>
      <header style={{padding:'20px 40px',borderBottom:'1px solid #1e1e1e',display:'flex',justifyContent:'space-between',alignItems:'center'}}>
        <Link href="/" style={{fontFamily:'Anton, sans-serif',fontSize:'32px',color:'#f6f1e7',textDecoration:'none'}}>VIBIN</Link>
        <Link href="/" style={{fontSize:'14px',color:'#888',textDecoration:'none'}}>← Back to Home</Link>
      </header>

      <div style={{maxWidth:'800px',margin:'0 auto',padding:'60px 20px'}}>
        <div style={{marginBottom:'40px'}}>
          <h1 style={{fontFamily:'Anton, sans-serif',fontSize:'48px',textTransform:'uppercase',marginBottom:'12px'}}>Terms of Service</h1>
          <p style={{color:'#888',fontSize:'14px',fontFamily:'JetBrains Mono, monospace',letterSpacing:'.1em'}}>
            Last Updated: April 30, 2026
          </p>
        </div>

        <div style={{lineHeight:'1.8',fontSize:'15px',color:'#ccc'}}>
          <section style={{marginBottom:'40px'}}>
            <h2 style={{fontFamily:'Anton, sans-serif',fontSize:'24px',color:'#f6f1e7',marginBottom:'16px'}}>1. Acceptance of Terms</h2>
            <p>By accessing or using vibinapparel.com ("Site"), you agree to be bound by these Terms of Service ("Terms"). If you do not agree, do not use our Site. We may update these Terms at any time, and continued use constitutes acceptance of updates.</p>
          </section>

          <section style={{marginBottom:'40px'}}>
            <h2 style={{fontFamily:'Anton, sans-serif',fontSize:'24px',color:'#f6f1e7',marginBottom:'16px'}}>2. Description of Service</h2>
            <p>Vibin Apparel provides an online platform for browsing, purchasing, and learning about our apparel products. We offer:</p>
            <ul style={{marginLeft:'20px',marginTop:'12px'}}>
              <li>E-commerce store for apparel purchases</li>
              <li>Drop 01 early access signup system</li>
              <li>Ambassador program for referral commissions</li>
              <li>Job application portal for open positions</li>
              <li>Customer support via chat and email</li>
            </ul>
          </section>

          <section style={{marginBottom:'40px'}}>
            <h2 style={{fontFamily:'Anton, sans-serif',fontSize:'24px',color:'#f6f1e7',marginBottom:'16px'}}>3. User Accounts & Responsibilities</h2>
            <p>You are responsible for:</p>
            <ul style={{marginLeft:'20px',marginTop:'12px'}}>
              <li>Maintaining the confidentiality of your account credentials</li>
              <li>All activities that occur under your account</li>
              <li>Providing accurate and complete information</li>
              <li>Notifying us immediately of unauthorized use</li>
            </ul>
            <p style={{marginTop:'16px'}}>We reserve the right to suspend or terminate accounts that violate these Terms.</p>
          </section>

          <section style={{marginBottom:'40px'}}>
            <h2 style={{fontFamily:'Anton, sans-serif',fontSize:'24px',color:'#f6f1e7',marginBottom:'16px'}}>4. Products & Orders</h2>
            <p><strong>Pricing:</strong> All prices are in USD and subject to change without notice. We strive for accuracy but errors may occur.</p>
            <p style={{marginTop:'12px'}}><strong>Availability:</strong> Products are subject to availability. We reserve the right to limit quantities or discontinue products.</p>
            <p style={{marginTop:'12px'}}><strong>Order Acceptance:</strong> Your order is an offer to purchase. We may accept or decline orders in our sole discretion.</p>
            <p style={{marginTop:'12px'}}><strong>Day One Code:</strong> Code "VIBE15" provides 15% off Drop 01 orders. Limit one per customer. Cannot be combined with other offers.</p>
          </section>

          <section style={{marginBottom:'40px'}}>
            <h2 style={{fontFamily:'Anton, sans-serif',fontSize:'24px',color:'#f6f1e7',marginBottom:'16px'}}>5. Payment & Refunds</h2>
            <p><strong>Payment:</strong> We use Stripe for secure payment processing. You agree to pay all charges incurred by you or any user of your account.</p>
            <p style={{marginTop:'12px'}}><strong>Refunds:</strong> Refund requests must be submitted within 30 days of delivery. Items must be unworn, unwashed, and in original packaging. See our <Link href="/returns" style={{color:'#e05c2e'}}>Returns Policy</Link> for details.</p>
            <p style={{marginTop:'12px'}}><strong>Disputes:</strong> Chargebacks or payment disputes must be resolved by contacting support@vibinapparel.com first.</p>
          </section>

          <section style={{marginBottom:'40px'}}>
            <h2 style={{fontFamily:'Anton, sans-serif',fontSize:'24px',color:'#f6f1e7',marginBottom:'16px'}}>6. Ambassador Program</h2>
            <p>By joining our Ambassador Program, you agree to:</p>
            <ul style={{marginLeft:'20px',marginTop:'12px'}}>
              <li>Use only your unique referral code for promotions</li>
              <li>Disclose your ambassador relationship (FTC compliance)</li>
              <li>Not engage in fraudulent or misleading marketing</li>
              <li>Maintain active social media presence</li>
            </ul>
            <p style={{marginTop:'16px'}}><strong>Commissions:</strong> Paid monthly for verified referrals. Rates: 15% (0-4 sales), 20% (5-14 sales), 25% (15+ sales).</p>
            <p style={{marginTop:'12px'}}>We reserve the right to withhold commissions for policy violations.</p>
          </section>

          <section style={{marginBottom:'40px'}}>
            <h2 style={{fontFamily:'Anton, sans-serif',fontSize:'24px',color:'#f6f1e7',marginBottom:'16px'}}>7. Intellectual Property</h2>
            <p>All content on this Site, including text, graphics, logos, and images, is the property of Vibin Apparel, LLC and protected by U.S. and international copyright laws.</p>
            <p style={{marginTop:'12px'}}>You may not:</p>
            <ul style={{marginLeft:'20px',marginTop:'12px'}}>
              <li>Reproduce, distribute, or modify any content without written permission</li>
              <li>Use our trademarks ("VIBIN", "Vibin different") without authorization</li>
              <li>Reverse engineer or attempt to extract source code</li>
            </ul>
          </section>

          <section style={{marginBottom:'40px'}}>
            <h2 style={{fontFamily:'Anton, sans-serif',fontSize:'24px',color:'#f6f1e7',marginBottom:'16px'}}>8. User-Generated Content</h2>
            <p>By submitting content (reviews, photos, social media posts), you grant Vibin Apparel a non-exclusive, royalty-free, worldwide license to use, reproduce, and display such content for marketing purposes.</p>
            <p style={{marginTop:'12px'}}>You represent that you own or have permission to share any content you submit.</p>
          </section>

          <section style={{marginBottom:'40px'}}>
            <h2 style={{fontFamily:'Anton, sans-serif',fontSize:'24px',color:'#f6f1e7',marginBottom:'16px'}}>9. Limitation of Liability</h2>
            <p>To the maximum extent permitted by law, Vibin Apparel, LLC shall not be liable for:</p>
            <ul style={{marginLeft:'20px',marginTop:'12px'}}>
              <li>Indirect, incidental, or consequential damages</li>
              <li>Lost profits or business interruption</li>
              <li>Errors or omissions in content</li>
              <li>Unauthorized access to or alteration of your data</li>
            </ul>
            <p style={{marginTop:'16px'}}>Our total liability shall not exceed the amount paid by you for products in the 12 months prior to the claim.</p>
          </section>

          <section style={{marginBottom:'40px'}}>
            <h2 style={{fontFamily:'Anton, sans-serif',fontSize:'24px',color:'#f6f1e7',marginBottom:'16px'}}>10. Indemnification</h2>
            <p>You agree to indemnify and hold harmless Vibin Apparel, LLC, its officers, directors, and employees from any claims, damages, or expenses arising from your use of the Site or violation of these Terms.</p>
          </section>

          <section style={{marginBottom:'40px'}}>
            <h2 style={{fontFamily:'Anton, sans-serif',fontSize:'24px',color:'#f6f1e7',marginBottom:'16px'}}>11. Governing Law</h2>
            <p>These Terms shall be governed by the laws of the State of Florida, without regard to conflict of law principles. Any legal action shall be brought exclusively in the courts of Jacksonville, Florida.</p>
          </section>

          <section style={{marginBottom:'40px'}}>
            <h2 style={{fontFamily:'Anton, sans-serif',fontSize:'24px',color:'#f6f1e7',marginBottom:'16px'}}>12. Contact Information</h2>
            <p>For questions about these Terms:</p>
            <p style={{marginTop:'12px'}}>
              Email: <a href="mailto:legal@vibinapparel.com" style={{color:'#e05c2e'}}>legal@vibinapparel.com</a><br />
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
