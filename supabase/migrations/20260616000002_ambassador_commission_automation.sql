-- Ambassador commission automation
-- Depends on: 20260616000001_initial_schema.sql (ambassadors table)

begin;

-- 1) Commission ledger table
create table if not exists public.ambassador_commissions (
  id uuid primary key default gen_random_uuid(),
  ambassador_row_id uuid not null references public.ambassadors(id) on delete restrict,
  order_id uuid,
  order_number text,
  referral_code text,
  order_subtotal numeric(12,2) not null default 0,
  commission_rate numeric(5,4) not null default 0.10,
  commission_amount numeric(12,2) generated always as
    (round(order_subtotal * commission_rate, 2)) stored,
  status text not null default 'pending',
  -- pending | approved | payable | paid | cancelled
  notes text,
  created_at timestamptz not null default now(),
  approved_at timestamptz,
  payable_at timestamptz,
  paid_at timestamptz,
  updated_at timestamptz not null default now(),
  constraint ambassador_commissions_status_check
    check (status in ('pending','approved','payable','paid','cancelled')),
  constraint ambassador_commissions_order_unique unique (order_id)
);

create index if not exists idx_ambassador_commissions_ambassador_row_id
  on public.ambassador_commissions(ambassador_row_id);
create index if not exists idx_ambassador_commissions_status
  on public.ambassador_commissions(status);
create index if not exists idx_ambassador_commissions_order_id
  on public.ambassador_commissions(order_id);
create index if not exists idx_ambassador_commissions_referral_code
  on public.ambassador_commissions(referral_code);

-- 2) Updated-at trigger
create or replace function public.touch_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists trg_ambassador_commissions_updated_at
  on public.ambassador_commissions;
create trigger trg_ambassador_commissions_updated_at
before update on public.ambassador_commissions
for each row execute function public.touch_updated_at();

-- 3) Auto-create a commission when an order with a referral_code is inserted
create or replace function public.handle_order_commission_insert()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_ambassador_id uuid;
  v_rate numeric(5,4);
begin
  -- only proceed if order has a referral code
  if new.referral_code is null or new.referral_code = '' then
    return new;
  end if;

  -- look up ambassador by code
  select id, commission_rate
  into v_ambassador_id, v_rate
  from public.ambassadors
  where ambassador_id = new.referral_code
    and is_active = true
  limit 1;

  if v_ambassador_id is null then
    return new;
  end if;

  insert into public.ambassador_commissions (
    ambassador_row_id,
    order_id,
    order_number,
    referral_code,
    order_subtotal,
    commission_rate,
    status
  ) values (
    v_ambassador_id,
    new.id,
    new.order_number,
    new.referral_code,
    coalesce(new.subtotal_price, 0),
    coalesce(v_rate, 0.10),
    'pending'
  )
  on conflict (order_id) do nothing;

  return new;
end;
$$;

drop trigger if exists trg_order_commission_insert on public.orders;
create trigger trg_order_commission_insert
after insert on public.orders
for each row execute function public.handle_order_commission_insert();

-- 4) Auto-approve commission when order status becomes 'paid'
create or replace function public.handle_order_commission_status_change()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.status = 'paid' and old.status != 'paid' then
    update public.ambassador_commissions
    set
      status = 'payable',
      approved_at = coalesce(approved_at, now()),
      payable_at = now()
    where order_id = new.id
      and status in ('pending', 'approved');
  end if;

  if new.status = 'cancelled' then
    update public.ambassador_commissions
    set
      status = 'cancelled',
      notes = coalesce(notes, 'Order cancelled')
    where order_id = new.id
      and status not in ('paid', 'cancelled');
  end if;

  return new;
end;
$$;

drop trigger if exists trg_order_commission_status_change on public.orders;
create trigger trg_order_commission_status_change
after update of status on public.orders
for each row execute function public.handle_order_commission_status_change();

-- 5) Reporting view
create or replace view public.ambassador_commission_summary as
select
  a.id as ambassador_row_id,
  a.ambassador_id,
  a.name,
  a.email,
  count(c.id) as total_orders,
  coalesce(sum(c.order_subtotal), 0)::numeric(12,2) as total_order_value,
  coalesce(sum(c.commission_amount), 0)::numeric(12,2) as total_commission_earned,
  coalesce(sum(c.commission_amount) filter (where c.status = 'pending'), 0)::numeric(12,2) as pending_amount,
  coalesce(sum(c.commission_amount) filter (where c.status = 'payable'), 0)::numeric(12,2) as payable_amount,
  coalesce(sum(c.commission_amount) filter (where c.status = 'paid'), 0)::numeric(12,2) as paid_amount
from public.ambassadors a
left join public.ambassador_commissions c on c.ambassador_row_id = a.id
group by a.id, a.ambassador_id, a.name, a.email;

commit;
