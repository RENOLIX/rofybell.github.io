-- Rofybell Supabase schema
-- A coller dans Supabase SQL Editor, puis creer le premier compte dans Authentication.

create table if not exists public.products (
  id text primary key,
  name text not null,
  name_ar text,
  category text not null check (category in ('Femme', 'Homme')),
  age text not null,
  price integer not null check (price >= 0),
  old_price integer check (old_price is null or old_price >= 0),
  rating numeric(2,1) not null default 5,
  reviews integer not null default 0 check (reviews >= 0),
  badge text,
  color text not null default '#A8CFA5',
  image_url text,
  sprite integer not null default 0,
  stock integer not null default 0 check (stock >= 0),
  description text not null default '',
  description_ar text,
  skills jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists public.admin_users (
  id uuid primary key references auth.users(id) on delete cascade,
  name text not null,
  email text not null unique,
  role text not null check (role in ('admin', 'employe')),
  active boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists public.orders (
  id text primary key,
  customer_name text not null,
  phone text not null,
  wilaya text not null,
  address text not null,
  commune text,
  delivery_method text not null check (delivery_method in ('domicile', 'bureau')),
  subtotal integer not null check (subtotal >= 0),
  shipping integer not null check (shipping >= 0),
  total integer not null check (total >= 0),
  status text not null default 'new' check (status in ('new', 'progress', 'done', 'return', 'cancelled')),
  items jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists public.shipping_rates (
  wilaya text primary key,
  domicile_price integer not null default 500 check (domicile_price >= 0),
  bureau_price integer not null default 350 check (bureau_price >= 0),
  updated_at timestamptz not null default now()
);

alter table public.products enable row level security;
alter table public.admin_users enable row level security;
alter table public.orders enable row level security;
alter table public.shipping_rates enable row level security;

create or replace function public.is_rofybell_staff()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.admin_users au
    where au.id = auth.uid()
      and au.active = true
  );
$$;

create or replace function public.is_rofybell_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.admin_users au
    where au.id = auth.uid()
      and au.role = 'admin'
      and au.active = true
  );
$$;

grant execute on function public.is_rofybell_staff() to authenticated;
grant execute on function public.is_rofybell_admin() to authenticated;

drop policy if exists "public products read" on public.products;
drop policy if exists "authenticated products management" on public.products;
drop policy if exists "authenticated users read" on public.admin_users;
drop policy if exists "admin users management" on public.admin_users;
drop policy if exists "public orders insert" on public.orders;
drop policy if exists "authenticated orders read" on public.orders;
drop policy if exists "authenticated orders update" on public.orders;
drop policy if exists "authenticated orders delete" on public.orders;
drop policy if exists "public shipping rates read" on public.shipping_rates;
drop policy if exists "authenticated shipping rates management" on public.shipping_rates;

create policy "public products read"
on public.products for select
using (true);

create policy "authenticated products management"
on public.products for all to authenticated
using (public.is_rofybell_staff())
with check (public.is_rofybell_staff());

create policy "authenticated users read"
on public.admin_users for select to authenticated
using (
  id = auth.uid()
  or public.is_rofybell_admin()
);

create policy "admin users management"
on public.admin_users for all to authenticated
using (public.is_rofybell_admin())
with check (public.is_rofybell_admin());

create policy "public orders insert"
on public.orders for insert to public
with check (true);

create policy "authenticated orders read"
on public.orders for select to authenticated
using (public.is_rofybell_staff());

create policy "authenticated orders update"
on public.orders for update to authenticated
using (public.is_rofybell_staff())
with check (public.is_rofybell_staff());

create policy "authenticated orders delete"
on public.orders for delete to authenticated
using (public.is_rofybell_staff());

create policy "public shipping rates read"
on public.shipping_rates for select
using (true);

create policy "authenticated shipping rates management"
on public.shipping_rates for all to authenticated
using (public.is_rofybell_staff())
with check (public.is_rofybell_staff());

grant usage on schema public to anon, authenticated;
grant select on table public.products to anon, authenticated;
grant insert on table public.orders to public;
grant select on table public.shipping_rates to anon, authenticated;
grant select, insert, update, delete on table public.products to authenticated;
grant select, insert, update, delete on table public.admin_users to authenticated;
grant select, update, delete on table public.orders to authenticated;
grant select, insert, update, delete on table public.shipping_rates to authenticated;

insert into storage.buckets (id, name, public)
values ('product-images', 'product-images', true)
on conflict (id) do update set public = true;

drop policy if exists "public product images read" on storage.objects;
drop policy if exists "authenticated product images insert" on storage.objects;
drop policy if exists "authenticated product images update" on storage.objects;
drop policy if exists "authenticated product images delete" on storage.objects;

create policy "public product images read"
on storage.objects for select
using (bucket_id = 'product-images');

create policy "authenticated product images insert"
on storage.objects for insert to authenticated
with check (bucket_id = 'product-images');

create policy "authenticated product images update"
on storage.objects for update to authenticated
using (bucket_id = 'product-images')
with check (bucket_id = 'product-images');

create policy "authenticated product images delete"
on storage.objects for delete to authenticated
using (bucket_id = 'product-images');

insert into public.products (
  id, name, category, age, price, old_price, rating, reviews, badge, color,
  image_url, sprite, stock, description, skills
) values
(
  'rofybell-hydra-cream',
  'Rofybell Hydra Cream',
  'Femme',
  '50 ml',
  5200,
  6200,
  4.9,
  142,
  'Best-seller',
  '#f5f1ed',
  '["https://images.unsplash.com/photo-1620916566398-39f1143ab7be?auto=format&fit=crop&w=1200&q=88","https://images.unsplash.com/photo-1598440947619-2c35fc9aa908?auto=format&fit=crop&w=1200&q=88"]',
  0,
  24,
  'Creme hydratante riche, fini propre et lumineux. Elle nourrit la peau, adoucit les zones seches et garde une texture confortable toute la journee.',
  '["Hydratation","Confort","Eclat"]'::jsonb
),
(
  'rofybell-glow-serum',
  'Rofybell Glow Serum',
  'Femme',
  '30 ml',
  6900,
  null,
  4.8,
  96,
  'Glow',
  '#f7eadc',
  '["https://images.unsplash.com/photo-1608248543803-ba4f8c70ae0b?auto=format&fit=crop&w=1200&q=88","https://images.unsplash.com/photo-1571781926291-c477ebfd024b?auto=format&fit=crop&w=1200&q=88"]',
  1,
  18,
  'Serum leger pour reveiller le teint et donner un effet peau fraiche. Il s''integre facilement dans une routine matin ou soir.',
  '["Teint lumineux","Texture legere","Routine quotidienne"]'::jsonb
),
(
  'rofybell-signature-perfume',
  'Rofybell Signature Perfume',
  'Homme',
  'Eau de parfum 50 ml',
  9900,
  11900,
  5,
  173,
  'Signature',
  '#f2e2cf',
  '["https://images.unsplash.com/photo-1541643600914-78b084683601?auto=format&fit=crop&w=1200&q=88","https://images.unsplash.com/photo-1592945403244-b3fbafd7f539?auto=format&fit=crop&w=1200&q=88"]',
  2,
  12,
  'Parfum elegant aux notes de jasmin, ambre clair et musc propre. Un sillage moderne et facile a porter.',
  '["Jasmin","Ambre clair","Musc propre"]'::jsonb
)
on conflict (id) do update set
  name = excluded.name,
  category = excluded.category,
  age = excluded.age,
  price = excluded.price,
  old_price = excluded.old_price,
  rating = excluded.rating,
  reviews = excluded.reviews,
  badge = excluded.badge,
  color = excluded.color,
  image_url = excluded.image_url,
  sprite = excluded.sprite,
  stock = excluded.stock,
  description = excluded.description,
  skills = excluded.skills;

-- Apres creation du premier utilisateur dans Authentication > Users,
-- remplacer l'email ci-dessous si besoin puis relancer uniquement ce bloc.
update auth.users
set raw_user_meta_data = coalesce(raw_user_meta_data, '{}'::jsonb)
  || '{"role":"admin","name":"Administrateur Rofybell"}'::jsonb
where email = 'admin@rofybell.dz';

insert into public.admin_users (id, name, email, role, active)
select id, 'Administrateur Rofybell', email, 'admin', true
from auth.users
where email = 'admin@rofybell.dz'
on conflict (id) do update set
  name = excluded.name,
  email = excluded.email,
  role = excluded.role,
  active = excluded.active;
