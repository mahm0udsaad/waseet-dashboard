create table if not exists public.admin_page_reads (
  user_id uuid not null references public.profiles(user_id) on delete cascade,
  page_key text not null,
  last_seen_at timestamptz not null default timezone('utc'::text, now()),
  created_at timestamptz not null default timezone('utc'::text, now()),
  updated_at timestamptz not null default timezone('utc'::text, now()),
  primary key (user_id, page_key)
);

create index if not exists admin_page_reads_page_key_idx
  on public.admin_page_reads (page_key);

create index if not exists admin_page_reads_last_seen_at_idx
  on public.admin_page_reads (last_seen_at desc);
