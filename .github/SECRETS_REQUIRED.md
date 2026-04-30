# GitHub Secrets Setup Instructions

## SECRETS REQUIRED

Add these secrets in your GitHub repository:
**Settings → Secrets and Variables → Actions → New repository secret**

---

## DEPLOYMENT SECRETS (choose one based on your host)

### Option 1: Netlify
- **NETLIFY_AUTH_TOKEN** → Your Netlify personal access token  
  Get it from: https://app.netlify.com/user/applications → Personal access tokens
  
- **NETLIFY_SITE_ID** → Your Netlify site ID  
  Get it from: Site Settings → General → Site ID

### Option 2: Vercel
- **VERCEL_TOKEN** → Your Vercel access token  
  Get it from: https://vercel.com/account/tokens
  
- **VERCEL_ORG_ID** → Your Vercel organization ID  
  Get it from: Vercel dashboard → Settings → General
  
- **VERCEL_PROJECT_ID** → Your Vercel project ID  
  Get it from: Project Settings → General

### Option 3: GitHub Pages
No additional secrets required if using `peaceiris/actions-gh-pages` - it uses the built-in `GITHUB_TOKEN`.

---

## EMAIL / MAILCHIMP

- **MAILCHIMP_API_KEY** → Your Mailchimp API key  
  Get it from: Mailchimp → Account → Extras → API keys
  
- **MAILCHIMP_AUDIENCE_ID** → Your Mailchimp audience/list ID  
  Get it from: Mailchimp → Audience → Settings → Audience ID

---

## ANALYTICS (if applicable)

- **GA_MEASUREMENT_ID** → Your Google Analytics G-tag ID  
  Format: G-XXXXXXXXXX  
  Get it from: Google Analytics → Admin → Data Streams → Measurement ID

---

## STRIPE (if applicable)

- **STRIPE_SECRET_KEY** → Your Stripe secret key  
  Get it from: Stripe Dashboard → Developers → API keys
  
- **STRIPE_PUBLISHABLE_KEY** → Your Stripe publishable key  
  Format: pk_live_... or pk_test_...

---

## ⚠️ IMPORTANT SECURITY RULES

1. **NEVER** commit any of these values directly in code files
2. **NEVER** print or log these values
3. **NEVER** include them in screenshots
4. Always use `${{ secrets.SECRET_NAME }}` in GitHub Actions workflows
5. Add `.env*.local` and `.env` to `.gitignore` to prevent accidental commits

---

## Verifying Secrets Are Set

After adding secrets, verify they're working by checking:
1. Go to **Actions** tab in your repo
2. Run a workflow that uses the secrets
3. Check that the secrets are masked in the logs (shown as `***`)

---

## Rotation Policy

Rotate these secrets every 90 days:
- Netlify/Vercel tokens
- Mailchimp API key
- Stripe keys

---

**Need help?** Contact your DevOps engineer or check:
- Netlify: https://docs.netlify.com/site-deploys/create-deploys/
- Vercel: https://vercel.com/docs/deployments
- GitHub Pages: https://pages.github.com/
