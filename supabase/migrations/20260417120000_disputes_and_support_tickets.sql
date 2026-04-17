-- Migration: User-submitted disputes (tied to a conversation/order/peer) and
-- generic support tickets (raised from the in-app Help Center).
--
-- Both surfaces:
--   - create a row in their respective table
--   - notify all admins (admin_notification) so the dashboard rings
--   - send the submitter a confirmation notification (and an update notification
--     each time staff replies / resolves)
--
-- Push delivery piggybacks on the existing notifications -> trigger_push_notification
-- chain. We extend the allowed_types list so dispute_*/ticket_* types ring on the
-- recipient's device.

-- ============================================================
-- 1. Disputes
-- ============================================================
create table if not exists public.disputes (
  id uuid primary key default gen_random_uuid(),
  reporter_id uuid not null references auth.users(id) on delete cascade,
  reported_user_id uuid references auth.users(id) on delete set null,
  conversation_id uuid references public.conversations(id) on delete set null,
  order_id uuid references public.orders(id) on delete set null,
  damin_order_id uuid references public.damin_orders(id) on delete set null,
  category text not null
    check (category in (
      'fraud',
      'no_response',
      'service_not_delivered',
      'inappropriate_behavior',
      'payment_issue',
      'other'
    )),
  subject text not null,
  description text not null,
  status text not null default 'open'
    check (status in ('open', 'in_review', 'resolved', 'rejected')),
  admin_notes text,
  resolved_by uuid references auth.users(id) on delete set null,
  resolved_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists disputes_reporter_idx on public.disputes (reporter_id, created_at desc);
create index if not exists disputes_conversation_idx on public.disputes (conversation_id);
create index if not exists disputes_status_idx on public.disputes (status, created_at desc);

drop trigger if exists disputes_set_updated_at on public.disputes;
create trigger disputes_set_updated_at
before update on public.disputes
for each row execute procedure public.set_updated_at();

alter table public.disputes enable row level security;

do $$
begin
  if not exists (select 1 from pg_policies where tablename = 'disputes' and policyname = 'reporters insert disputes') then
    create policy "reporters insert disputes" on public.disputes
      for insert with check (auth.uid() = reporter_id);
  end if;

  if not exists (select 1 from pg_policies where tablename = 'disputes' and policyname = 'reporters read own disputes') then
    create policy "reporters read own disputes" on public.disputes
      for select using (auth.uid() = reporter_id);
  end if;
end$$;

-- Service role (dashboard) bypasses RLS — no separate admin policy required.

-- ============================================================
-- 2. Support tickets (Help Center)
-- ============================================================
create table if not exists public.support_tickets (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  category text not null
    check (category in ('account', 'payments', 'wallet', 'orders', 'damin', 'technical', 'other')),
  subject text not null,
  description text not null,
  contact_email text,
  contact_phone text,
  status text not null default 'open'
    check (status in ('open', 'in_progress', 'resolved', 'closed')),
  priority text not null default 'normal'
    check (priority in ('low', 'normal', 'high', 'urgent')),
  assigned_to uuid references auth.users(id) on delete set null,
  admin_response text,
  resolved_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists support_tickets_user_idx on public.support_tickets (user_id, created_at desc);
create index if not exists support_tickets_status_idx on public.support_tickets (status, created_at desc);
create index if not exists support_tickets_assigned_idx on public.support_tickets (assigned_to);

drop trigger if exists support_tickets_set_updated_at on public.support_tickets;
create trigger support_tickets_set_updated_at
before update on public.support_tickets
for each row execute procedure public.set_updated_at();

alter table public.support_tickets enable row level security;

do $$
begin
  if not exists (select 1 from pg_policies where tablename = 'support_tickets' and policyname = 'users insert tickets') then
    create policy "users insert tickets" on public.support_tickets
      for insert with check (auth.uid() = user_id);
  end if;

  if not exists (select 1 from pg_policies where tablename = 'support_tickets' and policyname = 'users read own tickets') then
    create policy "users read own tickets" on public.support_tickets
      for select using (auth.uid() = user_id);
  end if;
end$$;

-- ============================================================
-- 3. Notifications: rely on existing trigger
-- ============================================================
-- The existing `trigger_push_notification()` (set in migration
-- 20260416142728_push_trigger_read_from_vault) already forwards EVERY
-- notification type to the push edge function — no allowlist. The
-- `dispute_*` and `support_ticket_*` types we insert below will be picked
-- up automatically. Do NOT redefine the function here.

-- ============================================================
-- 4. Auto-notify admins when a new dispute or ticket is created
-- ============================================================
-- We notify every account that has the role `super_admin`, `support_agent`, or
-- `finance_admin` (per the dashboard RBAC spec). Roles live on
-- public.profiles.role (text). If the column doesn't exist in your environment
-- the function still fans out to nobody — safe no-op.

create or replace function public.notify_admins_of_new_dispute()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_admin record;
  v_reporter_name text;
begin
  select coalesce(display_name, 'مستخدم') into v_reporter_name
    from public.profiles where user_id = new.reporter_id;

  for v_admin in
    select user_id from public.profiles
     where role in ('super_admin', 'admin', 'support_agent', 'finance', 'finance_admin')
  loop
    insert into public.notifications
      (recipient_id, actor_id, type, title, body, data)
    values (
      v_admin.user_id,
      new.reporter_id,
      'admin_notification',
      'بلاغ نزاع جديد',
      coalesce(v_reporter_name, 'مستخدم') || ' قدّم بلاغًا: ' || new.subject,
      jsonb_build_object(
        'dispute_id',     new.id,
        'category',       new.category,
        'conversation_id', new.conversation_id,
        'order_id',       new.order_id,
        'damin_order_id', new.damin_order_id,
        'kind',           'dispute'
      )
    );
  end loop;

  -- Confirmation to the reporter
  insert into public.notifications
    (recipient_id, type, title, body, data)
  values (
    new.reporter_id,
    'dispute_submitted',
    'تم استلام بلاغك',
    'سيقوم فريق وسيط الآن بمراجعة بلاغك خلال أقرب وقت.',
    jsonb_build_object('dispute_id', new.id, 'kind', 'dispute')
  );

  return new;
end;
$$;

drop trigger if exists disputes_notify_admins on public.disputes;
create trigger disputes_notify_admins
after insert on public.disputes
for each row execute procedure public.notify_admins_of_new_dispute();


create or replace function public.notify_admins_of_new_ticket()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_admin record;
  v_user_name text;
begin
  select coalesce(display_name, 'مستخدم') into v_user_name
    from public.profiles where user_id = new.user_id;

  for v_admin in
    select user_id from public.profiles
     where role in ('super_admin', 'admin', 'support_agent', 'finance', 'finance_admin')
  loop
    insert into public.notifications
      (recipient_id, actor_id, type, title, body, data)
    values (
      v_admin.user_id,
      new.user_id,
      'admin_notification',
      'تذكرة دعم جديدة',
      coalesce(v_user_name, 'مستخدم') || ': ' || new.subject,
      jsonb_build_object(
        'ticket_id', new.id,
        'category',  new.category,
        'priority',  new.priority,
        'kind',      'support_ticket'
      )
    );
  end loop;

  insert into public.notifications
    (recipient_id, type, title, body, data)
  values (
    new.user_id,
    'support_ticket_submitted',
    'تم استلام تذكرتك',
    'سيتواصل معك فريق وسيط قريبًا بخصوص: ' || new.subject,
    jsonb_build_object('ticket_id', new.id, 'kind', 'support_ticket')
  );

  return new;
end;
$$;

drop trigger if exists support_tickets_notify_admins on public.support_tickets;
create trigger support_tickets_notify_admins
after insert on public.support_tickets
for each row execute procedure public.notify_admins_of_new_ticket();

-- ============================================================
-- 5. Notify reporter / ticket owner on status / response changes
-- ============================================================
create or replace function public.notify_dispute_status_change()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_title text;
  v_body  text;
begin
  if new.status is distinct from old.status then
    case new.status
      when 'in_review' then
        v_title := 'بلاغك قيد المراجعة';
        v_body  := 'فريق وسيط يراجع بلاغك الآن: ' || new.subject;
      when 'resolved' then
        v_title := 'تم حل بلاغك';
        v_body  := coalesce(new.admin_notes, 'تم حل بلاغك من قبل فريق وسيط.');
      when 'rejected' then
        v_title := 'تم إغلاق بلاغك';
        v_body  := coalesce(new.admin_notes, 'تعذّر متابعة هذا البلاغ.');
      else
        return new;
    end case;

    insert into public.notifications
      (recipient_id, type, title, body, data)
    values (
      new.reporter_id,
      'dispute_status_changed',
      v_title,
      v_body,
      jsonb_build_object('dispute_id', new.id, 'status', new.status, 'kind', 'dispute')
    );
  end if;
  return new;
end;
$$;

drop trigger if exists disputes_notify_status on public.disputes;
create trigger disputes_notify_status
after update on public.disputes
for each row execute procedure public.notify_dispute_status_change();


create or replace function public.notify_ticket_status_change()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  -- Admin reply (response text changed and is non-empty)
  if coalesce(new.admin_response, '') is distinct from coalesce(old.admin_response, '')
     and coalesce(length(new.admin_response), 0) > 0 then
    insert into public.notifications
      (recipient_id, type, title, body, data)
    values (
      new.user_id,
      'support_ticket_replied',
      'رد جديد على تذكرتك',
      'فريق الدعم رد على تذكرتك: ' || new.subject,
      jsonb_build_object('ticket_id', new.id, 'kind', 'support_ticket')
    );
  end if;

  -- Resolved / closed
  if new.status is distinct from old.status
     and new.status in ('resolved', 'closed') then
    insert into public.notifications
      (recipient_id, type, title, body, data)
    values (
      new.user_id,
      'support_ticket_resolved',
      case when new.status = 'resolved' then 'تم حل تذكرتك' else 'تم إغلاق تذكرتك' end,
      coalesce(new.admin_response, 'شكرًا لتواصلك مع فريق وسيط.'),
      jsonb_build_object('ticket_id', new.id, 'status', new.status, 'kind', 'support_ticket')
    );
  end if;

  return new;
end;
$$;

drop trigger if exists support_tickets_notify_status on public.support_tickets;
create trigger support_tickets_notify_status
after update on public.support_tickets
for each row execute procedure public.notify_ticket_status_change();
