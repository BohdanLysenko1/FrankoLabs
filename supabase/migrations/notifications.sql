-- Persisted notification center. Applied remotely via Supabase MCP; kept
-- here for record. MUST be applied BEFORE payments_and_status.sql — that
-- migration's record_payment RPC calls app.notify().
--
-- user_id null = broadcast to every member. Read state reuses the existing
-- read_notifications table (notif id = this table's row id). Derived
-- notifications (overdue tasks, Pulse signals) stay client-side.

create table public.notifications (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  user_id uuid,
  kind text not null default 'system',
  title text not null,
  detail text not null default '',
  href text not null default '',
  rule_id uuid,
  created_at timestamptz not null default now()
);

create index notifications_ws_idx on public.notifications (workspace_id, created_at desc);

alter table public.notifications enable row level security;

create policy "members read own or broadcast" on public.notifications
  for select using (
    app.is_member(workspace_id)
    and (user_id is null or user_id = (select auth.uid()))
  );

alter publication supabase_realtime add table public.notifications;

-- Internal helper: everything that wants to notify goes through here.
create or replace function app.notify(
  p_workspace uuid,
  p_user uuid,
  p_kind text,
  p_title text,
  p_detail text,
  p_href text,
  p_rule uuid default null
) returns void
language sql security definer set search_path to ''
as $$
  insert into public.notifications (workspace_id, user_id, kind, title, detail, href, rule_id)
  values (p_workspace, p_user, coalesce(p_kind, 'system'), p_title,
          coalesce(p_detail, ''), coalesce(p_href, ''), p_rule);
$$;

revoke all on function app.notify(uuid, uuid, text, text, text, text, uuid)
  from public, anon, authenticated;
