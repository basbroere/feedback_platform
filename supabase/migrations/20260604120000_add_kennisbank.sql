-- Kennisbank: artikelen die iedereen kan lezen, HR (is_admin = true) beheert.

create table if not exists kennisbank_articles (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  content_html text not null default '',
  cover_image_url text,
  created_by uuid references users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists kennisbank_articles_created_at_idx
  on kennisbank_articles (created_at desc);

alter table kennisbank_articles disable row level security;

-- Public bucket voor cover-afbeeldingen.
insert into storage.buckets (id, name, public)
values ('kennisbank-covers', 'kennisbank-covers', true)
on conflict (id) do nothing;

-- Storage RLS staat standaard aan op storage.objects. In demo-modus zonder
-- auth willen we lezen/schrijven via de anon-key toestaan voor deze bucket.
drop policy if exists "kennisbank covers public read" on storage.objects;
create policy "kennisbank covers public read"
  on storage.objects for select
  to public
  using (bucket_id = 'kennisbank-covers');

drop policy if exists "kennisbank covers public insert" on storage.objects;
create policy "kennisbank covers public insert"
  on storage.objects for insert
  to public
  with check (bucket_id = 'kennisbank-covers');

drop policy if exists "kennisbank covers public update" on storage.objects;
create policy "kennisbank covers public update"
  on storage.objects for update
  to public
  using (bucket_id = 'kennisbank-covers')
  with check (bucket_id = 'kennisbank-covers');

drop policy if exists "kennisbank covers public delete" on storage.objects;
create policy "kennisbank covers public delete"
  on storage.objects for delete
  to public
  using (bucket_id = 'kennisbank-covers');
