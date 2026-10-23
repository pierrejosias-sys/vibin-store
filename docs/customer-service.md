# Customer service: Vibin Apparel

**Contact:** hello@vibinapparel.com · (786) 716-1673 · 1285 West 26th Street, Jacksonville, FL 32209
**Reply target:** within 1 business day.

## How tickets flow
1. **The customer writes in.** There are two ways in, and both POST to the same server route, `/api/support`:
   * **Contact form:** https://vibinapparel.com/contact. Fields: name, email, topic, optional order number, message.
   * **Help chat:** the floating **Help** button at the bottom right of every page (hidden on `/admin*` and `/support-agent`).

   Topics are `order`, `sizing`, `shipping`, `returns`, `pre-order` and `other`.
2. **The server route checks and stores it.**
   * **Checks:** it validates the email, topic, message length (4,000 max) and order number. It enforces a honeypot field, plus a rate limit of 5 customer messages per 10 minutes per email (durable, in the DB) and per IP.
   * **Storage:** it writes one `support_chats` row (ticket number like `VB-7K3QX9`, status `open`) and the first `support_messages` row. It uses the service role.
   * **Return:** it returns a one-time access token. The DB keeps only a SHA-256 hash of it. The browser keeps `{ticket, email, token}` in localStorage, and that is how the customer sees *their own* thread in the Help chat.
3. **An agent answers** in the admin inbox. A reply sets the thread to `answered`. A new customer message sets it back to `open`. **Close** sets it to `closed`. A customer message on a closed thread reopens it.
4. **The customer sees the reply** in the Help chat, which refreshes every 20 s while open, on the same device and browser.
   * **Not automatic yet:** no email goes out on reply. No email provider is connected; see `docs/preorder-readiness.md`.
   * **Workaround:** for anything time-sensitive, also email the customer. The thread view has a `mailto:` link.

**Security**
* RLS is on. Anon has **no** privileges on `support_chats` / `support_messages`. Signed-in users can read only threads whose email matches their account. Admins (`is_admin()`) manage all of them.
* There are no public INSERT policies: all public writes go through `/api/support`.

## Where to answer
| What | URL |
|---|---|
| Support inbox (open / answered / closed, reply, close) | https://vibinapparel.com/admin/support (sign in with an admin account at https://vibinapparel.com/admin/login) |
| Live agent console (alternative view) | https://vibinapparel.com/support-agent |
| Raw tables | https://supabase.com/dashboard/project/grbwnjnngzcsjlubcmtp/editor (`support_chats`, `support_messages`) |
| Open queue (service role / SQL editor) | https://supabase.com/dashboard/project/grbwnjnngzcsjlubcmtp/sql/new, then `select * from support_queue_open;` |
| Orders lookup | https://vibinapparel.com/admin (orders), or the `orders` table by id = order number |
| Stripe payment lookup | https://dashboard.stripe.com/payments (search by customer email) |

`support_queue_open` is a read-only view of open tickets, oldest activity first. Columns: `ticket`, `email`, `name`, `topic`, `order_number`, `created_at`, `last_message_at`, `message_count`, `last_message`, `last_sender`. Only `service_role` can select it. From code:

```js
const { data } = await createClient(URL, SERVICE_ROLE_KEY).from('support_queue_open').select('*')
```

## Canned answers (FAQ)
Copy, then adjust the name and order number.

**When does Drop 01 open?**
> Drop 01 pre-orders open **Thursday, Nov 12 at 7 PM ET** and close **Sunday, Nov 15 at 11:59 PM ET**. Waitlist members get an early hour from **6 to 7 PM ET** on Nov 12 using the private link we email them. Join the waitlist at https://vibinapparel.com/drop/01.

**I'm on the waitlist but my early-access link doesn't work.**
> Each early-access link is personal and works for one checkout during the 6–7 PM ET hour on Nov 12. Open it on the device you'll check out on. If it says it's already been used or isn't valid, reply with the email you signed up with and we'll check it. From 7 PM ET the drop is open to everyone, no link needed.

**When will my pre-order ship?**
> Drop 01 is made to order after the window closes. Pre-orders ship **Dec 11–17**, and you'll get tracking by email when your order leaves us.

**How much is shipping?**
> Shipping is a flat **$8** in the US, and **free on orders of $125 or more**. We currently ship to US addresses only.

**What sizes does the hoodie come in?**
> The Drop 01 hoodie comes in **S, M, L, XL, 2X and 3X**. Need help choosing? Tell us your height and usual size and we'll suggest one.

**I ordered a hoodie and a tee/snapback. Why two packages?**
> The hoodie is produced and shipped separately from the tee and snapback, so a mixed order **ships in two packages**, each with its own tracking. You pay shipping once.

**Where's my order?** (topic `order` / `shipping`)
> Thanks, I've looked up order #[ORDER]. [Status: paid, and it ships Dec 11–17 / shipped with tracking …]. You'll get an email with tracking as soon as it ships.

**I didn't get a confirmation email.**
> Your payment receipt comes from Stripe. Check spam or promotions for "Vibin Apparel". If your order number showed on the confirmation page, your order is in. Reply with it and I'll confirm.

**Returns and exchanges**
> We're happy to help. Reply with your order number, the item, and whether you'd like an exchange (size) or a return, and we'll send next steps. [Policy details: TBD by Josias]
> *(Return policy for made-to-order pieces is not set yet: confirm with Josias before promising anything.)*

**Can I change or cancel my pre-order?**
> Yes, while the pre-order window is open (until Nov 15, 11:59 PM ET). Reply with your order number and the change. After the window closes, production starts and changes may not be possible.

**Contact info**
> Email hello@vibinapparel.com, call (786) 716-1673, or use the Help chat on any page of vibinapparel.com.
