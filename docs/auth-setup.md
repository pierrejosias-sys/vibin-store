# Supabase Auth setup (vibinapparel.com)

Project: grbwnjnngzcsjlubcmtp. The app routes are:
* `/login` handles sign in and sign up.
* `/auth/callback` handles PKCE and OAuth codes.
* `/auth/confirm` handles email `token_hash` links.
* `/forgot-password` sends the reset email.
* `/reset-password` sets the new password.

## 1. URL configuration
https://supabase.com/dashboard/project/grbwnjnngzcsjlubcmtp/auth/url-configuration
* Site URL: `https://vibinapparel.com`
* Redirect URLs:
  * `https://vibinapparel.com/**`
  * `https://www.vibinapparel.com/**`
  * `https://*-pierrejosias-sys-projects.vercel.app/**`

## 2. SMTP (Brevo). Signups currently fail with `535 Invalid username`
Custom SMTP is already enabled, but its credentials are wrong.
1. Open https://app.brevo.com/settings/keys/smtp.
2. Copy the **Login** shown there. It looks like `xxxxxx@smtp-brevo.com`; it is *not* your account email.
3. Click **Generate a new SMTP key** and copy it. An SMTP key is not the same as an API key (`xkeysib-…`), so don't use the API key.
4. Make sure `vibinapparel.com` is an authenticated domain in Brevo (Senders, domains & dedicated IPs → Domains), or add `hello@vibinapparel.com` as a verified sender.
5. Open https://supabase.com/dashboard/project/grbwnjnngzcsjlubcmtp/auth/smtp and enter:

| Field | Value |
|---|---|
| Sender email | `hello@vibinapparel.com` |
| Sender name | `Vibin Apparel` |
| Host | `smtp-relay.brevo.com` |
| Port | `587` |
| Username | the Brevo **Login** from step 2 |
| Password | the SMTP key from step 3 |

6. Save. Then raise the email rate limit under Auth → Rate Limits (for example, 30 per hour).

## 3. Email templates
https://supabase.com/dashboard/project/grbwnjnngzcsjlubcmtp/auth/templates
Paste the subjects and HTML from `supabase/templates/` (see the README there).

## 4. Test
Sign up at https://vibinapparel.com/login, then click the confirm link and check that you land signed in.
Then go to /forgot-password, follow the email link to /reset-password, set a new password, and sign in with it.
