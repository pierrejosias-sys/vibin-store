# Vibin Apparel — vibinapparel.com

Lifestyle streetwear brand site. A subsidiary of HVD Holdings, LLC.  
Built in Jacksonville, FL. SS26 Drop 01 live.

---

## Stack
- Next.js 16 / React 19 / JavaScript
- Hosted on: Vercel
- Payments: Stripe
- Database: Supabase
- Analytics: Vercel Speed Insights

## Branch Strategy
| Branch    | Purpose                        | Auto-deploys to       |
|-----------|--------------------------------|-----------------------|
| `main`    | Production — live site         | vibinapparel.com      |

## Local Development
```bash
# Clone the repo
git clone https://github.com/pierrejosias-sys/vibin-store.git
cd vibin-store

# Install dependencies
npm install

# Run development server
npm run dev

# Open http://localhost:3000
```

## Deployment
Pushes to `main` trigger auto-deploy to Vercel → vibinapparel.com

Required environment variables in Vercel:
- `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`
- `STRIPE_SECRET_KEY`
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`

## Environment Variables
Never hardcode secrets. Set them in Vercel project settings.

## Pages (25 routes)
| Route              | Description                          |
|--------------------|--------------------------------------|
| `/`                | Homepage — SS26 hero, shop grid      |
| `/shop`            | Full product catalog                  |
| `/product/[id]`    | Individual product page               |
| `/cart`            | Shopping cart                        |
| `/checkout`        | Checkout with Stripe                  |
| `/lookbook`        | Editorial SS26 photography            |
| `/about`           | Brand story + values                  |
| `/ambassador`      | Ambassador hub + dashboard            |
| `/login`           | Login/register                       |
| `/profile`         | User profile                         |
| `/qa`              | FAQ                                  |
| `/returns`         | Returns policy                       |
| `/shipping`        | Shipping information                  |
| `/print`           | Custom print service                  |
| `/drop-01`        | Drop 01 coming soon page              |
| `/careers`        | Job openings (Support, Dev, DevOps)  |
| `/support-agent`   | Support agent portal (admin only)     |
| `/admin`           | Admin dashboard                      |
| `/admin/orders`    | Order management                     |
| `/admin/support`   | Support verification                 |
| `/admin/security`  | Security auditor                     |

## Project Structure
```
app/
├── components/     # Reusable components (Support Chat)
├── lib/           # Utilities (Supabase, cart context, search)
├── api/           # API routes (checkout, webhook, notify)
└── [pages]/       # Route pages
```

## Contact
- hello@vibinapparel.com
- ambassador@vibinapparel.com

© 2026 Vibin Apparel · HVD Holdings, LLC · Jacksonville, FL
