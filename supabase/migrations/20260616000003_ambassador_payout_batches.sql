-- Ambassador payout batches
-- Depends on: 20260616000002_ambassador_commission_automation.sql

begin;

create extension if not exists pgcrypto;

-- 1) Payout batch header
create table if not exists public.ambassador_payout_batches (
  id uuid primary key default gen_random_uuid(),
  batch_number text not null unique,
  payout_period_start date,
  payout_period_end date,
  currency text not null default 'USD',
  status text not null default 'open',
  -- open | locked | processing | paid | failed | cancelled
  total_ambassadors integer not null default 0,
  total_commissions integer not null default 0,
  gross_amount numeric(12,2) not null default 0,
  notes text,
  created_by uuid,
  created_at timestamptz not null default now(),
  locked_at timestamptz,
  processed_at timestamptz,
  paid_at timestamptz,
  updated_at timestamptz not null default now(),
  constraint ambassador_payout_batches_status_check
    check (status in ('open','locked','processing','paid','failed','cancelled'))
);

create index if not exists idx_ambassador_payout_batches_status
  on public.ambassador_payout_batches(status);

-- 2) Per-ambassador payout row inside a batch
create table if not exists public.ambassador_payouts (
  id uuid primary key default gen_random_uuid(),
  batch_id uuid not null references public.ambassador_payout_batches(id) on delete cascade,
  ambassador_row_id uuid not null references public.ambassadors(id) on delete restrict,
  ambassador_id text,
  payout_method text,
  -- paypal | wise | bank_transfer | store_credit
  payout_reference text,
  payout_email text,
  payout_currency text not null default 'USD',
  gross_amount numeric(12,2) not null,
  fees_amount numeric(12,2) not null default 0,
  net_amount numeric(12,2) generated always as (gross_amount - fees_amount) stored,
  status text not null default 'pending',
  -- pending | processing | paid | failed | cancelled
  notes text,
  created_at timestamptz not null default now(),
  processed_at timestamptz,
  paid_at timestamptz,
  updated_at timestamptz not null default now(),
  constraint ambassador_payouts_status_check
    check (status in ('pending','processing','paid','failed','cancelled')),
  constraint ambassador_payouts_batch_ambassador_unique
    unique (batch_id, ambassador_row_id)
);

create index if not exists idx_ambassador_payouts_batch_id
  on public.ambassador_payouts(batch_id);
create index if not exists idx_ambassador_payouts_ambassador_row_id
  on public.ambassador_payouts(ambassador_row_id);
create index if not exists idx_ambassador_payouts_status
  on public.ambassador_payouts(status);

-- 3) Line items linking commissions to a payout
create table if not exists public.ambassador_payout_items (
  id uuid primary key default gen_random_uuid(),
  payout_id uuid not null references public.ambassador_payouts(id) on delete cascade,
  commission_id uuid not null references public.ambassador_commissions(id) on delete restrict,
  amount numeric(12,2) not null,
  created_at timestamptz not null default now(),
  constraint ambassador_payout_items_payout_commission_unique unique (payout_id, commission_id),
  constraint ambassador_payout_items_commission_unique unique (commission_id)
);

create index if not exists idx_ambassador_payout_items_payout_id
  on public.ambassador_payout_items(payout_id);
create index if not exists idx_ambassador_payout_items_commission_id
  on public.ambassador_payout_items(commission_id);

-- 4) Updated-at triggers
drop trigger if exists trg_ambassador_payout_batches_updated_at
  on public.ambassador_payout_batches;
create trigger trg_ambassador_payout_batches_updated_at
before update on public.ambassador_payout_batches
for each row execute function public.touch_updated_at();

drop trigger if exists trg_ambassador_payouts_updated_at
  on public.ambassador_payouts;
create trigger trg_ambassador_payouts_updated_at
before update on public.ambassador_payouts
for each row execute function public.touch_updated_at();

-- 5) Create a batch from all payable commissions in a date range
create or replace function public.create_ambassador_payout_batch(
  p_period_start date default null,
  p_period_end date default null,
  p_batch_number text default null,
  p_notes text default null,
  p_created_by uuid default null
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_batch_id uuid;
  v_batch_number text;
begin
  v_batch_number := coalesce(
    p_batch_number,
    'APB-' || to_char(now(), 'YYYYMMDD-HH24MISS')
  );

  insert into public.ambassador_payout_batches (
    batch_number, payout_period_start, payout_period_end,
    notes, created_by, status
  ) values (
    v_batch_number, p_period_start, p_period_end,
    p_notes, p_created_by, 'open'
  )
  returning id into v_batch_id;

  insert into public.ambassador_payouts (
    batch_id, ambassador_row_id, ambassador_id,
    payout_email, gross_amount, status
  )
  select
    v_batch_id, a.id, a.ambassador_id, a.email,
    sum(c.commission_amount)::numeric(12,2), 'pending'
  from public.ambassador_commissions c
  join public.ambassadors a on a.id = c.ambassador_row_id
  where c.status = 'payable'
    and (p_period_start is null or c.payable_at::date >= p_period_start)
    and (p_period_end is null or c.payable_at::date <= p_period_end)
  group by a.id, a.ambassador_id, a.email;

  insert into public.ambassador_payout_items (payout_id, commission_id, amount)
  select p.id, c.id, c.commission_amount
  from public.ambassador_commissions c
  join public.ambassador_payouts p
    on p.batch_id = v_batch_id
   and p.ambassador_row_id = c.ambassador_row_id
  where c.status = 'payable'
    and (p_period_start is null or c.payable_at::date >= p_period_start)
    and (p_period_end is null or c.payable_at::date <= p_period_end);

  update public.ambassador_payout_batches b
  set
    total_ambassadors = (select count(*) from public.ambassador_payouts p where p.batch_id = v_batch_id),
    total_commissions = (select count(*) from public.ambassador_payout_items i join public.ambassador_payouts p on p.id = i.payout_id where p.batch_id = v_batch_id),
    gross_amount = coalesce((select sum(gross_amount) from public.ambassador_payouts p where p.batch_id = v_batch_id), 0)
  where b.id = v_batch_id;

  return v_batch_id;
end;
$$;

-- 6) Mark a single ambassador payout as paid and flip commissions to paid
create or replace function public.mark_ambassador_payout_paid(
  p_payout_id uuid,
  p_payout_reference text default null,
  p_notes text default null
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_now timestamptz := now();
  v_batch_id uuid;
begin
  update public.ambassador_payouts
  set
    status = 'paid',
    payout_reference = coalesce(p_payout_reference, payout_reference),
    notes = coalesce(p_notes, notes),
    processed_at = coalesce(processed_at, v_now),
    paid_at = v_now
  where id = p_payout_id
    and status in ('pending', 'processing');

  update public.ambassador_commissions c
  set status = 'paid', paid_at = v_now, updated_at = v_now
  where c.id in (
    select i.commission_id from public.ambassador_payout_items i
    where i.payout_id = p_payout_id
  )
  and c.status = 'payable';

  select batch_id into v_batch_id
  from public.ambassador_payouts where id = p_payout_id;

  update public.ambassador_payout_batches b
  set
    status = case
      when exists (select 1 from public.ambassador_payouts p where p.batch_id = v_batch_id and p.status in ('pending','processing')) then 'processing'
      when exists (select 1 from public.ambassador_payouts p where p.batch_id = v_batch_id and p.status = 'failed') then 'failed'
      else 'paid'
    end,
    processed_at = coalesce(processed_at, v_now),
    paid_at = case
      when not exists (select 1 from public.ambassador_payouts p where p.batch_id = v_batch_id and p.status in ('pending','processing','failed','cancelled'))
      then v_now else paid_at
    end
  where b.id = v_batch_id;
end;
$$;

commit;
