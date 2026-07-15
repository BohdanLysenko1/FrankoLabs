-- Payments: partial payment records against invoices, due|partial|paid status,
-- receipt emails. Applied remotely via Supabase MCP; kept here for record.
-- Requires notifications.sql first (record_payment calls app.notify).
--
-- Writes go through SECURITY DEFINER RPCs only (record_payment / delete_payment /
-- pay_invoice) so invoice status can never drift from the payment ledger.
-- The old email_invoice_paid trigger is dropped: the payment receipt supersedes
-- the invoice-paid email (final receipt says the invoice is settled).

-- 1. Table -------------------------------------------------------------------

create table public.payments (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  invoice_id uuid not null references public.invoices(id) on delete cascade,
  -- Denormalized from the invoice: keeps client RLS and portal reads one-table.
  company_id uuid not null references public.companies(id) on delete cascade,
  amount numeric not null check (amount > 0),
  method text not null default 'other'
    check (method in ('bank-transfer', 'card', 'cash', 'other')),
  paid_on date not null default current_date,
  reference text not null default '',
  recorded_by uuid,
  created_at timestamptz not null default now()
);

create index payments_workspace_idx on public.payments (workspace_id);
create index payments_invoice_idx on public.payments (invoice_id);
create index payments_company_idx on public.payments (company_id);

alter table public.payments enable row level security;

create policy "members read" on public.payments
  for select using (app.is_member(workspace_id));

-- Direct inserts exist only for the bulk importer (which carries invoice
-- status verbatim); the app records payments via the record_payment RPC.
create policy "members insert" on public.payments
  for insert with check (app.is_member(workspace_id));

create policy "clients read via billing tool" on public.payments
  for select using (
    app.is_client_of(company_id) and app.client_has_tool(company_id, 'billing')
  );

alter publication supabase_realtime add table public.payments;

-- 2. Invoice status gains 'partial' ------------------------------------------

alter table public.invoices drop constraint invoices_status_check;
alter table public.invoices add constraint invoices_status_check
  check (status in ('due', 'partial', 'paid'));

-- 3. Core: record a payment, recompute status, queue the receipt --------------

create or replace function app.record_payment_core(
  p_id uuid,
  p_invoice uuid,
  p_amount numeric,
  p_method text,
  p_paid_on date,
  p_reference text,
  p_recorded_by uuid
) returns uuid
language plpgsql security definer set search_path to ''
as $$
declare
  inv public.invoices;
  cname text;
  total numeric;
  balance numeric;
  pay_id uuid;
begin
  select * into inv from public.invoices where id = p_invoice for update;
  if inv.id is null then
    raise exception 'invoice not found';
  end if;
  if inv.status = 'paid' then
    raise exception 'invoice is already paid';
  end if;
  if p_amount is null or p_amount <= 0 then
    raise exception 'amount must be positive';
  end if;

  insert into public.payments
    (id, workspace_id, invoice_id, company_id, amount, method, paid_on, reference, recorded_by)
  values
    (coalesce(p_id, gen_random_uuid()), inv.workspace_id, p_invoice, inv.company_id,
     p_amount, coalesce(p_method, 'other'), coalesce(p_paid_on, current_date),
     coalesce(p_reference, ''), p_recorded_by)
  returning id into pay_id;

  select coalesce(sum(amount), 0) into total
  from public.payments where invoice_id = p_invoice;
  balance := inv.amount - total;

  if balance <= 0 then
    update public.invoices set status = 'paid', paid_at = now() where id = p_invoice;
  else
    update public.invoices set status = 'partial', paid_at = null where id = p_invoice;
  end if;

  insert into public.activities (workspace_id, type, summary, deal_id, company_id, client_visible)
  values (inv.workspace_id, 'system',
    case when balance <= 0
      then 'Invoice ' || inv.number || ' paid — ' || inv.label || '.'
      else 'Payment received for ' || inv.number || ' — $' || to_char(p_amount, 'FM999,999,990')
           || ', $' || to_char(balance, 'FM999,999,990') || ' remaining.'
    end,
    inv.deal_id, inv.company_id, true);

  perform app.notify(inv.workspace_id, null, 'payment',
    case when balance <= 0 then 'Invoice paid' else 'Payment received' end,
    inv.number || ' · $' || to_char(p_amount, 'FM999,999,990')
      || case when balance <= 0 then ' — paid in full'
              else ' — $' || to_char(balance, 'FM999,999,990') || ' remaining' end,
    '/crm/billing');

  select name into cname from public.companies where id = inv.company_id;
  perform app.enqueue_email(inv.workspace_id, 'payment-receipt',
    app.client_recipient_emails(inv.company_id) || app.workspace_admin_emails(inv.workspace_id),
    jsonb_build_object(
      'company', cname,
      'invoiceNumber', inv.number,
      'label', inv.label,
      'amount', p_amount,
      'method', coalesce(p_method, 'other'),
      'paidOn', coalesce(p_paid_on, current_date),
      'invoiceTotal', inv.amount,
      'balance', greatest(balance, 0),
      'settled', balance <= 0));

  -- Legacy automations hook; replaced by the event engine in a later migration.
  if balance <= 0 then
    perform app.run_automations(
      inv.workspace_id, array['invoice-paid'], inv.label, inv.deal_id, null, inv.company_id, null);
  end if;

  return pay_id;
end;
$$;

revoke all on function app.record_payment_core(uuid, uuid, numeric, text, date, text, uuid)
  from public, anon, authenticated;

-- 4. Member-facing wrappers ---------------------------------------------------

create or replace function public.record_payment(
  p_id uuid,
  p_invoice uuid,
  p_amount numeric,
  p_method text,
  p_paid_on date,
  p_reference text
) returns uuid
language plpgsql security definer set search_path to ''
as $$
declare
  inv public.invoices;
begin
  select * into inv from public.invoices where id = p_invoice;
  if inv.id is null or not app.is_member(inv.workspace_id) then
    raise exception 'not allowed';
  end if;
  return app.record_payment_core(
    p_id, p_invoice, p_amount, p_method, p_paid_on, p_reference, auth.uid());
end;
$$;

create or replace function public.delete_payment(p_payment uuid) returns void
language plpgsql security definer set search_path to ''
as $$
declare
  pay public.payments;
  inv public.invoices;
  total numeric;
begin
  select * into pay from public.payments where id = p_payment;
  if pay.id is null or not app.is_member(pay.workspace_id) then
    raise exception 'not allowed';
  end if;
  delete from public.payments where id = p_payment;

  select * into inv from public.invoices where id = pay.invoice_id for update;
  select coalesce(sum(amount), 0) into total
  from public.payments where invoice_id = pay.invoice_id;

  update public.invoices set
    status = case
      when total >= inv.amount then 'paid'
      when total > 0 then 'partial'
      else 'due'
    end,
    paid_at = case when total >= inv.amount then coalesce(inv.paid_at, now()) else null end
  where id = pay.invoice_id;

  insert into public.activities (workspace_id, type, summary, deal_id, company_id, client_visible)
  values (pay.workspace_id, 'system',
    'Payment of $' || to_char(pay.amount, 'FM999,999,990') || ' removed from ' || inv.number || '.',
    inv.deal_id, inv.company_id, false);
end;
$$;

-- 5. pay_invoice becomes a full-settle wrapper --------------------------------
-- Members only now: the portal's fake pay button is gone, clients get a
-- read-only payment history instead.

create or replace function public.pay_invoice(p_invoice uuid) returns void
language plpgsql security definer set search_path to ''
as $$
declare
  inv public.invoices;
  total numeric;
  balance numeric;
begin
  select * into inv from public.invoices where id = p_invoice;
  if inv.id is null or not app.is_member(inv.workspace_id) then
    raise exception 'not allowed';
  end if;
  if inv.status = 'paid' then
    return;
  end if;

  select coalesce(sum(amount), 0) into total
  from public.payments where invoice_id = p_invoice;
  balance := inv.amount - total;

  if balance <= 0 then
    -- Ledger already covers it (e.g. imported data) — just settle the status.
    update public.invoices set status = 'paid', paid_at = now() where id = p_invoice;
    return;
  end if;

  perform app.record_payment_core(
    null, p_invoice, balance, 'other', current_date, 'Marked as paid', auth.uid());
end;
$$;

-- 6. Receipt supersedes the invoice-paid email --------------------------------

drop trigger if exists email_invoice_paid on public.invoices;
drop function if exists app.trg_email_invoice_paid();

-- 7. Reminders now also allowed for partially paid invoices --------------------

create or replace function public.send_invoice_reminder(p_invoice uuid) returns void
language plpgsql security definer set search_path to ''
as $$
declare
  inv public.invoices%rowtype;
  cname text;
begin
  select * into inv from public.invoices where id = p_invoice;
  if inv.id is null then
    raise exception 'invoice not found';
  end if;
  if not exists (
    select 1 from public.workspace_members m
    where m.workspace_id = inv.workspace_id
      and m.user_id = auth.uid()
      and m.role in ('owner','admin')
  ) then
    raise exception 'not allowed';
  end if;
  if inv.status = 'paid' then
    raise exception 'invoice is already paid';
  end if;
  select name into cname from public.companies where id = inv.company_id;
  perform app.enqueue_email(inv.workspace_id, 'invoice-reminder',
    app.client_recipient_emails(inv.company_id),
    jsonb_build_object(
      'company', cname,
      'invoiceNumber', inv.number,
      'label', inv.label,
      'amount', inv.amount,
      'dueAt', inv.due_at));
end;
$$;
