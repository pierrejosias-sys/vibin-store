# Supabase Auth email templates (Vibin)

Paste into https://supabase.com/dashboard/project/grbwnjnngzcsjlubcmtp/auth/templates

| Template | Subject | File |
|---|---|---|
| Confirm signup | Confirm your Vibin account | `confirmation.html` |
| Reset password | Reset your Vibin password | `recovery.html` |
| Magic link | Your Vibin sign-in link | `magic_link.html` |

All links go to `{{ .SiteURL }}/auth/confirm?token_hash={{ .TokenHash }}&type=…` (app/auth/confirm/route.js),
which verifies the token server-side. Recovery lands on `/reset-password`. This needs Site URL = https://vibinapparel.com.
