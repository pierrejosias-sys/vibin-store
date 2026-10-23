import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'

const sql = readFileSync('supabase/migrations/20261023000008_rls_support_notifications_profiles.sql', 'utf8')

test('no always-true SELECT/INSERT policies remain in the migration', () => {
  assert.ok(!/USING \(true\)/i.test(sql))
  assert.ok(!/WITH CHECK \(true\)/i.test(sql))
  for (const t of ['support_chats', 'support_messages', 'notifications']) assert.match(sql, new RegExp(`ON public\\.${t}\\s+FOR SELECT TO authenticated`))
})

test('profiles: insert cannot grant roles; self-update cannot escalate', () => {
  assert.match(sql, /DROP POLICY IF EXISTS "Allow trigger insert"/)
  assert.match(sql, /coalesce\(is_admin, false\) = false/)
  assert.match(sql, /NEW\.is_admin := OLD\.is_admin/)
})
