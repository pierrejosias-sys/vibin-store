/**
 * Campaign tracking tests: Drop 01 waitlist.
 * Fake in-memory Supabase client, node:test. No network, no real Supabase, no Brevo.
 */
import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { upsertSignup } from '../app/lib/waitlist.mjs'
import { readCampaignFromUrl } from '../app/lib/campaign.mjs'
import { signupsToCsv } from '../app/lib/early-access.mjs'

// Minimal fake Supabase client: enough for upsertSignup's select/insert/update paths.
// `raceOnce` simulates another request inserting the same email between our read and insert.
function fakeSupabase({ raceOnce = null } = {}) {
  const rows = []
  let raced = false
  const table = {
    select: () => ({
      ilike: () => ({ maybeSingle: async () => ({ data: rows[0] || null, error: null }) }),
    }),
    insert: (row) => ({
      select: () => ({
        single: async () => {
          if (raceOnce && !raced) { raced = true; rows.push({ id: 'id-race', ...raceOnce }) }
          if (rows.some((r) => r.email.toLowerCase() === row.email.toLowerCase())) {
            return { data: null, error: { code: '23505', message: 'duplicate' } }
          }
          const saved = { id: `id-${rows.length + 1}`, ...row }
          rows.push(saved)
          return { data: saved, error: null }
        },
      }),
    }),
    update: (patch) => ({
      eq: () => ({
        select: () => ({
          single: async () => {
            Object.assign(rows[0], patch)
            return { data: rows[0], error: null }
          },
        }),
      }),
    }),
  }
  return { from: () => table, _rows: rows }
}

const base = { firstName: null, source: 'd01-waitlist', style: null, consent: true }

describe('campaign tracking', () => {
  it('saves valid UTM on a new sign-up, plus the composite source tag', async () => {
    const supabase = fakeSupabase()
    const { row, created } = await upsertSignup(supabase, {
      ...base, email: 'a@example.com', utm_source: 'ig', utm_campaign: 'teaser-hoodie', utm_medium: 'organic',
    })
    assert.equal(created, true)
    assert.equal(row.utm_source, 'ig')
    assert.equal(row.utm_campaign, 'teaser-hoodie')
    assert.equal(row.utm_medium, 'organic')
    assert.ok(row.sources.includes('d01-waitlist'))
    assert.ok(row.sources.includes('d01-waitlist-ig-teaser-hoodie'))
  })

  it('first-touch wins: re-signup from a new campaign keeps the original utm_*', async () => {
    const supabase = fakeSupabase()
    await upsertSignup(supabase, { ...base, email: 'a@example.com', utm_source: 'ig', utm_campaign: 'teaser-hoodie', utm_medium: 'organic' })
    const { row, created } = await upsertSignup(supabase, {
      ...base, email: 'a@example.com', utm_source: 'tt', utm_campaign: 'teaser-countdown', utm_medium: 'organic',
    })
    assert.equal(created, false)
    assert.equal(row.utm_source, 'ig')
    assert.equal(row.utm_campaign, 'teaser-hoodie')
    // ...but the new journey step is still visible in sources[]
    assert.ok(row.sources.includes('d01-waitlist-tt-teaser-countdown'))
  })

  it('re-signup fills utm_* when the first sign-up had none', async () => {
    const supabase = fakeSupabase()
    await upsertSignup(supabase, { ...base, email: 'c@example.com' })
    const { row } = await upsertSignup(supabase, { ...base, email: 'c@example.com', utm_source: 'ig', utm_campaign: 'ad-drop01-a', utm_medium: 'ad' })
    assert.equal(row.utm_campaign, 'ad-drop01-a')
  })

  it('sign-up without a campaign stores plain d01-waitlist and null utm_*', async () => {
    const supabase = fakeSupabase()
    const { row } = await upsertSignup(supabase, {
      ...base, email: 'b@example.com', utm_source: null, utm_campaign: null, utm_medium: null,
    })
    assert.deepEqual(row.sources, ['d01-waitlist'])
    assert.equal(row.utm_source, null)
  })

  it('23505 concurrent-insert retry keeps the campaign', async () => {
    const supabase = fakeSupabase({ raceOnce: { email: 'r@example.com', sources: ['homepage-newsletter'], styles: [] } })
    const { row, created } = await upsertSignup(supabase, {
      ...base, email: 'r@example.com', utm_source: 'ig', utm_campaign: 'ad-drop01-b', utm_medium: 'ad',
    })
    assert.equal(created, false)
    assert.equal(row.utm_campaign, 'ad-drop01-b')
    assert.ok(row.sources.includes('d01-waitlist-ig-ad-drop01-b'))
  })

  it('composite tag is capped at 40 chars with no trailing hyphen', async () => {
    const supabase = fakeSupabase()
    const { row } = await upsertSignup(supabase, {
      ...base, email: 'l@example.com', utm_source: 'ig', utm_campaign: 'a'.repeat(23) + '-bbbb', utm_medium: null,
    })
    const tag = row.sources.find((s) => s !== 'd01-waitlist')
    assert.ok(tag.length <= 40)
    assert.match(tag, /^[a-z0-9-]{1,40}$/)
    assert.ok(!tag.endsWith('-'))
  })

  it('readCampaignFromUrl parses UTM and rejects bad values', () => {
    assert.deepEqual(
      readCampaignFromUrl('?utm_source=ig&utm_campaign=teaser-hoodie&utm_medium=organic'),
      { utm_source: 'ig', utm_campaign: 'teaser-hoodie', utm_medium: 'organic' },
    )
    // Spaces + punctuation are dropped, not stored raw; uppercase is lowered.
    assert.deepEqual(
      readCampaignFromUrl('?utm_source=IG%20Ads!&utm_campaign=OK-Campaign'),
      { utm_source: null, utm_campaign: 'ok-campaign', utm_medium: null },
    )
    assert.equal(readCampaignFromUrl('?foo=bar'), null)
    assert.equal(readCampaignFromUrl(''), null)
  })

  it('CSV export includes the utm columns', () => {
    const csv = signupsToCsv([{ email: 'a@b.co', first_name: null, sources: ['d01-waitlist'], utm_source: 'ig', utm_campaign: 'ad-drop01-a', utm_medium: 'ad', styles: [], consent_email: true, early_access_token: 'tok_tok_tok_tok_tok_tok', created_at: 'c', synced_at: null }])
    const [head, line] = csv.trim().split('\n')
    assert.ok(head.startsWith('email,first_name,sources,utm_source,utm_campaign,utm_medium,styles'))
    assert.ok(line.includes('ig,ad-drop01-a,ad'))
  })
})
