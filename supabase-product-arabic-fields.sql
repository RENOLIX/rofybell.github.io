alter table public.products
  add column if not exists name_ar text,
  add column if not exists description_ar text;
