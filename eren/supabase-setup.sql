-- Run once in Supabase → SQL Editor.

-- 1) Columns for sections and duration (already there if you ran this before)
alter table public.items add column if not exists cat text default '';
alter table public.items add column if not exists dur integer default 0;

-- 2) Safe booking from the website.
--    Visitors call this function instead of reading/writing the clients and bookings tables directly,
--    so the site no longer needs public read access to your clients' names and phone numbers.
--    Assumes clients.photos, bookings.refs and bookings.ref are text[] / text, and bookings.date is a date.
create or replace function public.create_booking(
  p_name text, p_phone text, p_design text, p_date date,
  p_time text, p_note text, p_photos text[]
) returns bigint
language plpgsql
security definer
set search_path = public
as $$
declare
  v_client bigint;
  v_booking bigint;
  v_photos text[] := coalesce(p_photos, '{}');
begin
  if length(trim(coalesce(p_name, ''))) < 2
     or length(regexp_replace(coalesce(p_phone, ''), '\D', '', 'g')) < 10 then
    raise exception 'invalid name or phone';
  end if;

  select id into v_client from public.clients where phone = trim(p_phone) limit 1;

  if v_client is null then
    insert into public.clients (name, phone, note, photos)
    values (trim(p_name), trim(p_phone), '', v_photos)
    returning id into v_client;
  elsif array_length(v_photos, 1) > 0 then
    update public.clients set photos = coalesce(photos, '{}') || v_photos where id = v_client;
  end if;

  insert into public.bookings (client_id, design, date, time, note, ref, refs, status, price)
  values (v_client, p_design, p_date, coalesce(p_time, ''), coalesce(p_note, ''),
          coalesce(v_photos[1], ''), v_photos, 'new', 0)
  returning id into v_booking;

  return v_booking;
end;
$$;

grant execute on function public.create_booking(text, text, text, date, text, text, text[]) to anon, authenticated;
