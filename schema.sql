-- JP Sports | Supabase schema
-- Execute no SQL Editor do Supabase. Configure o usuário admin no Auth antes de usar o painel.
create extension if not exists pgcrypto;

create table if not exists public.events (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  event_date date not null,
  location text not null,
  gathering text default '05:00',
  start_time text default '05:30',
  price_no_shirt numeric(10,2) not null default 59.90 check (price_no_shirt >= 0),
  price_with_shirt numeric(10,2) not null default 99.90 check (price_with_shirt >= 0),
  status text not null default 'draft' check (status in ('draft','active','paused','closed')),
  created_at timestamptz not null default now()
);

create table if not exists public.site_settings (
  id integer primary key check (id = 1),
  pix_key text not null default '52.244.653/0001-10',
  whatsapp text not null default '(81) 99951-0223',
  card_checkout_url text
);
insert into public.site_settings(id) values(1) on conflict(id) do nothing;

create table if not exists public.registrations (
  id uuid primary key default gen_random_uuid(),
  registration_code text not null unique default upper(substr(encode(gen_random_bytes(6),'hex'),1,10)),
  event_id uuid not null references public.events(id),
  full_name text not null,
  phone text not null,
  email text not null,
  distance text not null check (distance in ('3 km','5 km')),
  package_type text not null check (package_type in ('no_shirt','with_shirt')),
  shirt_size text,
  payment_method text not null check (payment_method in ('pix','card')),
  payment_status text not null default 'pending' check (payment_status in ('pending','confirmed','cancelled')),
  amount numeric(10,2) not null check (amount >= 0),
  consent boolean not null default false check (consent = true),
  created_at timestamptz not null default now()
);

alter table public.events enable row level security;
alter table public.site_settings enable row level security;
alter table public.registrations enable row level security;

create or replace function public.is_jp_admin()
returns boolean language sql stable security definer set search_path = public
as $$
  select coalesce(auth.jwt()->>'email','') = 'joaopedrotfuncional@gmail.com';
$$;

drop policy if exists "Public can view active events" on public.events;
create policy "Public can view active events" on public.events for select to anon, authenticated using (status='active' or public.is_jp_admin());
drop policy if exists "Admin manages events" on public.events;
create policy "Admin manages events" on public.events for all to authenticated using (public.is_jp_admin()) with check (public.is_jp_admin());

drop policy if exists "Public can read safe settings" on public.site_settings;
create policy "Public can read safe settings" on public.site_settings for select to anon, authenticated using (true);
drop policy if exists "Admin manages settings" on public.site_settings;
create policy "Admin manages settings" on public.site_settings for all to authenticated using (public.is_jp_admin()) with check (public.is_jp_admin());

drop policy if exists "Admin reads registrations" on public.registrations;
create policy "Admin reads registrations" on public.registrations for select to authenticated using (public.is_jp_admin());
drop policy if exists "Admin updates registrations" on public.registrations;
create policy "Admin updates registrations" on public.registrations for update to authenticated using (public.is_jp_admin()) with check (public.is_jp_admin());

create or replace function public.register_participant(
  p_full_name text,
  p_phone text,
  p_email text,
  p_distance text,
  p_package text,
  p_shirt_size text,
  p_payment_method text,
  p_consent boolean
)
returns table(registration_code text, amount numeric, pix_key text, checkout_url text)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_event public.events%rowtype;
  v_settings public.site_settings%rowtype;
  v_amount numeric(10,2);
  v_code text;
begin
  if coalesce(trim(p_full_name),'')='' or length(p_full_name)>120 then raise exception 'Informe seu nome completo.'; end if;
  if coalesce(trim(p_phone),'')='' or length(p_phone)>30 then raise exception 'Informe um WhatsApp válido.'; end if;
  if coalesce(trim(p_email),'')='' or length(p_email)>180 or position('@' in p_email)=0 then raise exception 'Informe um e-mail válido.'; end if;
  if p_distance not in ('3 km','5 km') then raise exception 'Distância inválida.'; end if;
  if p_package not in ('no_shirt','with_shirt') then raise exception 'Pacote inválido.'; end if;
  if p_package='with_shirt' and coalesce(trim(p_shirt_size),'') not in ('PP','P','M','G','GG','XG') then raise exception 'Selecione o tamanho da camisa.'; end if;
  if p_package='no_shirt' then p_shirt_size := null; end if;
  if p_payment_method not in ('pix','card') then raise exception 'Forma de pagamento inválida.'; end if;
  if p_consent is distinct from true then raise exception 'É necessário aceitar o aviso de privacidade.'; end if;

  select * into v_event from public.events where status='active' order by created_at desc limit 1;
  if not found then raise exception 'Não há evento com inscrições abertas.'; end if;
  select * into v_settings from public.site_settings where id=1;
  if p_payment_method='card' and coalesce(v_settings.card_checkout_url,'')='' then raise exception 'Pagamento por cartão ainda não está configurado.'; end if;
  v_amount := case when p_package='with_shirt' then v_event.price_with_shirt else v_event.price_no_shirt end;
  insert into public.registrations(event_id,full_name,phone,email,distance,package_type,shirt_size,payment_method,amount,consent)
  values(v_event.id,trim(p_full_name),trim(p_phone),lower(trim(p_email)),p_distance,p_package,p_shirt_size,p_payment_method,v_amount,true)
  returning registrations.registration_code into v_code;
  return query select v_code,v_amount,v_settings.pix_key,v_settings.card_checkout_url;
end;
$$;

revoke all on function public.register_participant(text,text,text,text,text,text,text,boolean) from public;
grant execute on function public.register_participant(text,text,text,text,text,text,text,boolean) to anon, authenticated;
grant select on public.events, public.site_settings to anon, authenticated;
grant select, update on public.registrations to authenticated;
grant insert, update, delete on public.events to authenticated;
grant insert, update on public.site_settings to authenticated;

-- Evento inicial: Treinão Novembro Azul do JP
insert into public.events(name,event_date,location,gathering,start_time,price_no_shirt,price_with_shirt,status)
select 'Treinão Novembro Azul do JP','2026-11-29','Mercado da Torre – Live','05:00','05:30',59.90,99.90,'active'
where not exists(select 1 from public.events);
