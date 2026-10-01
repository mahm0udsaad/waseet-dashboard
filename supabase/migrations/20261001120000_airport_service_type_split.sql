-- Split the airport service into two separately-sold services:
--   delivery   (توصيل للمطار)
--   inspection (تفتيش)
-- Rows created before the split, and rows from old app builds that don't send
-- a service_type, keep the legacy combined value `delivery_inspection`.

alter table public.airport_inspection_requests
  add column if not exists service_type text not null default 'delivery_inspection';

alter table public.airport_inspection_requests
  drop constraint if exists airport_requests_service_type_check;

alter table public.airport_inspection_requests
  add constraint airport_requests_service_type_check
  check (service_type in ('delivery', 'inspection', 'delivery_inspection'));

create index if not exists airport_requests_service_type_idx
  on public.airport_inspection_requests (service_type, status, created_at desc);

-- Per-service prices, seeded from the old single price.
insert into public.app_settings (key, value)
select 'airport_delivery_price', value
  from public.app_settings
 where key = 'airport_service_price'
on conflict (key) do nothing;

insert into public.app_settings (key, value)
select 'airport_inspection_price', value
  from public.app_settings
 where key = 'airport_service_price'
on conflict (key) do nothing;
