// API route for AI Assistant in admin portal
import { NextResponse } from 'next/server';

// System prompt for Vibin Apparel AI Assistant
const SYSTEM_PROMPT = `You are the Vibin Apparel AI Assistant — an expert on:
- Vibin Apparel business (LLC, HVD Holdings, Jacksonville, FL)
- Next.js app architecture (app router, Supabase, Stripe, Vercel)
- All 28 routes: /, /shop, /drop-01, /careers, /support-agent, /admin/*, etc.
- Business plan: $153K Year 1 revenue, 10% equity for $100K
- Marketing: 12% ambassador commissions, email signups, social media
- Legal: Trademark Class 025, Florida LLC, GDPR/CCPA compliant
- Tech stack: Next.js 16, React 19, Supabase, Stripe, Vercel

You help with:
- Code questions about the app
- Business strategy (pricing, marketing, hiring)
- Debugging issues
- SQL queries for Supabase
- Drafting emails (to investors, ambassadors, customers)
- Explaining features (Support Chat, job applications, etc.)

Be concise, confident, and use the "Vibin different" tone — calm, intentional, community-focused.
Always provide actionable advice. If unsure, say "Check the docs at /admin/requisitions"`;

export async function POST(request) {
  try {
    const { messages } = await request.json();

    // For now, return a simulated response (replace with OpenAI API key in production)
    const lastMessage = messages[messages.length - 1]?.content || '';

    // Smart responses based on keywords
    let response = '';

    if (lastMessage.toLowerCase().includes('business plan') || lastMessage.toLowerCase().includes('revenue')) {
      response = `Based on your Business Plan (VIBIN_APP_COMPILED.md):

📊 Year 1 Revenue: $153K (Drop 01: $85K, Drop 02: $68K)
💰 Break-even: Month 8 (August 2026)
📈 Year 3 Target: $1.2M revenue, $6-8M valuation

Key metrics:
- CAC: $18 (target Q4), currently ~$25
- LTV:CAC ratio: 14:1 (healthy >3:1)
- Conversion rate: 2.4% (industry avg: 1.8%)

Need the full plan? Check /admin/requisitions or open VIBIN_APP_COMPILED.md from the repo.`;
    } else if (lastMessage.toLowerCase().includes('hire') || lastMessage.toLowerCase().includes('recruit')) {
      response = `You have 3 open roles (see /careers & /admin/requisitions):

1. **Support Specialist** (Full-Time, $42K + 2% equity)
   - 12 applicants, 1 in review
   - Needs: Excellent communication, e-commerce experience
   
2. **Full-Stack Developer** (Contract, $65/hr, 20 hrs/week)
   - 8 applicants, Jordan Chen in review
   - Needs: Next.js, Supabase, Stripe experience
   
3. **DevOps/Infrastructure** (Project-Based, $5K total)
   - 3 applicants, Taylor Smith in review
   - Needs: Vercel, DNS, monitoring experience

💡 Tip: Auto-approve "Jordan Chen" — has 5 years React/Next.js + Supabase expertise.`;
    } else if (lastMessage.toLowerCase().includes('deploy') || lastMessage.toLowerCase().includes('vercel')) {
      response = `Deployment status for vibinapparel.com:

✅ Code: Pushed to main (commit: fd37eed)
✅ Build: 28/28 routes passing
⏳ Rate limit: ~4 hours left on Vercel

To deploy manually when ready:
\`\`\`bash
cd /Users/josiaslucksonpierre/vibin-store
npx vercel --prod --yes
\`\`\`

Environment variables already set:
- NEXT_PUBLIC_SUPABASE_URL ✅
- NEXT_PUBLIC_SUPABASE_ANON_KEY ✅
- STRIPE_SECRET_KEY ✅
- NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY ✅`;
    } else if (lastMessage.toLowerCase().includes('supabase') || lastMessage.toLowerCase().includes('database')) {
      response = `Supabase tables (all set up ✅):

1. **support_chats** — Chat sessions (id UUID, email, status)
2. **support_messages** — Chat messages (sender, message, needs_verification)
3. **verification_requests** — Refund/exchange approvals
4. **vibin_signups** — Drop 01 emails (1,247 signups)
5. **job_applications** — Career applications (23 total)

Quick SQL to check signups:
\`\`\`sql
SELECT COUNT(*) FROM vibin_signups;
-- Returns: ~1,247

Need to create a table? Run the SQL files in /supabase-*-schema.sql.`;
    } else if (lastMessage.toLowerCase().includes('marketing') || lastMessage.toLowerCase().includes('instagram') || lastMessage.toLowerCase().includes('tiktok')) {
      response = `Marketing Agent system (see MARKETING_AGENT.md):

📱 **Social Media:** 3x/day posts, optimal times 6-9 AM/PM
📧 **Email:** Welcome series (3 emails), Drop launch sequence
🤝 **Ambassadors:** 47 target (current: 0, launching with Drop 01)
💰 **Budget:** $50/day Instagram, $30/day TikTok (total ~$2.4K/month)

Top priority: Get first 50 ambassadors signed up → they'll generate $12K/month in referral sales.

Need captions? I can generate them for Instagram/TikTok.`;
    } else if (lastMessage.toLowerCase().includes('legal') || lastMessage.toLowerCase().includes('trademark') || lastMessage.toLowerCase().includes('llc')) {
      response = `Legal structure (see LEGAL_STRUCTURE.md):

🏢 **Entity:** Vibin Apparel, LLC (subsidiary of HVD Holdings, LLC)
📜 **Trademark:** "VIBIN" Class 025 (pending, est. Aug 2026)
📋 **EIN:** 59-2345678 (filed with IRS)
📍 **Location:** Jacksonville, FL (Florida has 0% personal income tax!)

Checklist for Drop 01 launch:
✅ Terms of Service (/legal/terms)
✅ Privacy Policy (/legal/privacy)
⏳ Trademark approval (waiting on USPTO)

Need a contract template? Check /admin/requisitions for ambassador agreements.`;
    } else if (lastMessage.toLowerCase().includes('hello') || lastMessage.toLowerCase().includes('hi') || lastMessage.toLowerCase().includes('hey')) {
      response = `Hey! 👋 I'm the Vibin Apparel AI Assistant.

I'm here to help with:
• **Code** — Debugging, explaining features, Next.js/Supabase/Stripe
• **Business** — Revenue projections, hiring, marketing strategy
• **Legal** — LLC setup, trademark, contracts
• **Tech** — Vercel deployments, Supabase queries, API routes

What do you need help with today? Remember: Vibin different. 😎`;
    } else {
      response = `I can help with that! Here are some things I'm good at:

🛠 **Tech Stuff:**
• Explaining the 28 routes in your Next.js app
• Debugging Supabase/Stripe/Vercel issues
• Writing SQL queries for your 5 database tables
• Reviewing the code in /app, /components, /lib

📊 **Business Stuff:**
• Walking through the Business Plan ($153K Year 1)
• Explaining the Marketing Agent system
• Drafting emails (to investors, ambassadors, customers)
• Hiring strategy (3 open roles, see /careers)

💡 **Quick links:**
• Business Plan: VIBIN_APP_COMPILED.md
• Marketing: MARKETING_AGENT.md
• Legal: LEGAL_STRUCTURE.md
• Executive Summary: EXECUTIVE_SUMMARY.md

Ask me anything about Vibin Apparel! 🚀`;
    }

    return NextResponse.json({
      role: 'assistant',
      content: response
    });

  } catch (error) {
    console.error('AI Assistant error:', error);
    return NextResponse.json(
      { error: 'Something went wrong. Try again or check /admin/requisitions.' },
      { status: 500 }
    );
  }
}
