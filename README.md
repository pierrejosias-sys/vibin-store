# Vibin Apparel — vibinapparel.com

Lifestyle streetwear brand site. A subsidiary of HVD Holdings, LLC.  
Built in Jacksonville, FL. SS26 Drop 01 live.

---

## Stack
<!-- Update this section based on what's actually in the repo -->
- Next.js / React / JavaScript
- Hosted on: Vercel
- Email: Mailchimp
- Payments: Stripe

## Branch Strategy
| Branch    | Purpose                        | Auto-deploys to       |
|-----------|--------------------------------|-----------------------|
| `main`    | Production — live site         | vibinapparel.com      |
| `staging` | Pre-production QA              | staging.vibinapparel.com (if configured) |
| `dev`     | Active development             | —                     |

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
Pushes to main trigger auto-deploy via GitHub Actions.  
See `.github/workflows/deploy.yml` and `.github/SECRETS_REQUIRED.md` for setup.

## Environment Variables
Never hardcode secrets. See `.github/SECRETS_REQUIRED.md` for required secrets.

## Pages
| Route        | Description                          |
|--------------|--------------------------------------|
| `/`          | Homepage — SS26 hero, shop grid      |
| `/shop`      | Full product catalog                  |
| `/lookbook`  | Editorial SS26 photography            |
| `/about`     | Brand story + values                 |
| `/ambassador`| Ambassador hub + dashboard            |
| `/shipping`  | Shipping information                  |
| `/returns`   | Returns policy                       |
| `/qa`        | FAQ                                  |
| `/contact`   | Contact + Wholesale + Stockists       |
| `/admin`     | Admin dashboard                      |
| `/admin/support` | Support verification            |

## Contact
- hello@vibinapparel.com
- ambassador@vibinapparel.com

© 2026 Vibin Apparel · HVD Holdings, LLC · Jacksonville, FL
