-- Applied July 15 2026 via MCP apply_migration (name: protect_owner_membership).
-- Owner membership rows become immutable via the Data API: admins can manage
-- teammates but can never demote, promote-to-owner, or remove the workspace
-- owner. Ownership transfer, when built, will be a SECURITY DEFINER RPC.
-- The app-side role editor (SettingsView TeamTab) already excludes owner rows;
-- this closes the same door at the RLS layer.

drop policy "admins update" on public.workspace_members;
create policy "admins update" on public.workspace_members
  for update
  using (app.is_admin(workspace_id) and role <> 'owner')
  with check (app.is_admin(workspace_id) and role <> 'owner');

drop policy "admins delete or leave" on public.workspace_members;
create policy "admins delete or leave" on public.workspace_members
  for delete
  using (
    role <> 'owner'
    and (app.is_admin(workspace_id) or user_id = (select auth.uid()))
  );
