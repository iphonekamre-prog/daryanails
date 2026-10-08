-- Run once in Supabase → SQL editor. Roles: 'super' (full) and 'editor' (edit content, cannot delete / manage admins).
create table if not exists admins(id uuid primary key references auth.users on delete cascade, email text, role text not null default 'editor', created_at timestamptz default now());
alter table admins enable row level security;
drop policy if exists "admins read" on admins; create policy "admins read" on admins for select to authenticated using (true);
create or replace function is_super() returns boolean language sql security definer set search_path=public as $$ select exists(select 1 from admins where id=auth.uid() and role='super') $$;
create or replace function register_admin(p_id uuid, p_email text, p_role text) returns void language plpgsql security definer set search_path=public as $$
begin if not is_super() then raise exception 'not allowed'; end if;
  insert into admins(id,email,role) values(p_id,p_email,case when p_role='super' then 'super' else 'editor' end) on conflict do nothing; end $$;
create or replace function remove_admin(p_id uuid) returns void language plpgsql security definer set search_path=public as $$
begin if not is_super() then raise exception 'not allowed'; end if; delete from admins where id=p_id and role<>'super'; end $$;
-- FIRST: make yourself the main super admin (replace the email), then sign in:
-- insert into admins(id,email,role) select id,email,'super' from auth.users where email='YOUR_EMAIL';
