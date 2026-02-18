-- Wallet & Chat Quick Actions
-- Adds RPCs:
--   1) get_wallet_summary()
--   2) get_wallet_transactions(p_limit, p_offset)
--   3) get_damin_order_for_chat(p_conversation_id)

create or replace function public.get_wallet_summary()
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  uid uuid := auth.uid();
  escrow numeric := 0;
  gross_released numeric := 0;
  available numeric := 0;
  month_start timestamptz := date_trunc('month', now());
  this_month_income numeric := 0;
  total_withdrawn numeric := 0;
  pending_withdrawals numeric := 0;
  this_month_withdrawn numeric := 0;
  withdrawals_ready boolean := false;
begin
  if uid is null then
    raise exception 'Authentication required';
  end if;

  -- Escrow held for beneficiary: deposited but not yet released
  select coalesce(sum(d.service_value), 0)
    into escrow
  from public.damin_orders d
  where d.beneficiary_user_id = uid
    and d.status in ('escrow_deposit', 'awaiting_completion', 'payment_submitted')
    and d.escrow_deposit_at is not null
    and d.escrow_released_at is null;

  -- Gross released value for beneficiary
  select coalesce(sum(d.service_value), 0)
    into gross_released
  from public.damin_orders d
  where d.beneficiary_user_id = uid
    and d.status = 'completed'
    and d.escrow_released_at is not null;

  -- Current-month released income
  select coalesce(sum(d.service_value), 0)
    into this_month_income
  from public.damin_orders d
  where d.beneficiary_user_id = uid
    and d.status = 'completed'
    and d.escrow_released_at is not null
    and d.escrow_released_at >= month_start;

  -- Withdrawals are optional for now. If table/columns are missing, return zeros.
  withdrawals_ready :=
    to_regclass('public.withdrawals') is not null
    and exists (
      select 1
      from information_schema.columns
      where table_schema = 'public' and table_name = 'withdrawals' and column_name = 'amount'
    )
    and exists (
      select 1
      from information_schema.columns
      where table_schema = 'public' and table_name = 'withdrawals' and column_name = 'status'
    )
    and exists (
      select 1
      from information_schema.columns
      where table_schema = 'public' and table_name = 'withdrawals' and column_name = 'user_id'
    )
    and exists (
      select 1
      from information_schema.columns
      where table_schema = 'public' and table_name = 'withdrawals' and column_name = 'created_at'
    );

  if withdrawals_ready then
    execute $wq$
      select
        coalesce(sum(case when status in ('approved','completed','paid','succeeded') then amount else 0 end), 0),
        coalesce(sum(case when status in ('pending','processing') then amount else 0 end), 0),
        coalesce(sum(case when status in ('approved','completed','paid','succeeded') and created_at >= $2 then amount else 0 end), 0)
      from public.withdrawals
      where user_id = $1
    $wq$
    into total_withdrawn, pending_withdrawals, this_month_withdrawn
    using uid, month_start;
  end if;

  available := gross_released - total_withdrawn;

  return jsonb_build_object(
    'available_balance', available,
    'escrow_held', escrow,
    'total_earned', available + escrow,
    'total_withdrawn', total_withdrawn,
    'pending_withdrawals', pending_withdrawals,
    'this_month_income', this_month_income,
    'this_month_withdrawn', this_month_withdrawn
  );
end;
$$;

grant execute on function public.get_wallet_summary() to authenticated;


create or replace function public.get_wallet_transactions(
  p_limit int default 50,
  p_offset int default 0
)
returns table (
  id uuid,
  title text,
  amount numeric,
  type text,
  status text,
  source text,
  reference_id text,
  "timestamp" timestamptz,
  currency text
)
language plpgsql
security definer
set search_path = public
as $$
declare
  uid uuid := auth.uid();
  withdrawals_ready boolean := false;
  sql text;
begin
  if uid is null then
    raise exception 'Authentication required';
  end if;

  withdrawals_ready :=
    to_regclass('public.withdrawals') is not null
    and exists (
      select 1
      from information_schema.columns
      where table_schema = 'public' and table_name = 'withdrawals' and column_name = 'id'
    )
    and exists (
      select 1
      from information_schema.columns
      where table_schema = 'public' and table_name = 'withdrawals' and column_name = 'amount'
    )
    and exists (
      select 1
      from information_schema.columns
      where table_schema = 'public' and table_name = 'withdrawals' and column_name = 'status'
    )
    and exists (
      select 1
      from information_schema.columns
      where table_schema = 'public' and table_name = 'withdrawals' and column_name = 'user_id'
    )
    and exists (
      select 1
      from information_schema.columns
      where table_schema = 'public' and table_name = 'withdrawals' and column_name = 'created_at'
    );

  sql := $q$
    with txns as (
      -- Beneficiary-side damin service value movement
      select
        d.id as id,
        ('Damin Order #' || left(d.id::text, 8) || ' - Service Payment')::text as title,
        d.service_value::numeric as amount,
        'incoming'::text as type,
        case when d.escrow_released_at is not null then 'completed' else 'held' end::text as status,
        'damin_escrow_release'::text as source,
        d.id::text as reference_id,
        coalesce(d.escrow_released_at, d.escrow_deposit_at) as "timestamp",
        'SAR'::text as currency
      from public.damin_orders d
      where d.beneficiary_user_id = $1
        and d.escrow_deposit_at is not null

      union all

      -- User card payments (payer outflow)
      select
        p.id as id,
        'Card Payment'::text as title,
        (p.amount::numeric / 100.0) as amount,
        'outgoing'::text as type,
        p.status::text as status,
        'card_payment'::text as source,
        coalesce((p.metadata ->> 'orderId'), p.id::text) as reference_id,
        coalesce(p.updated_at, p.created_at) as "timestamp",
        upper(coalesce(p.currency, 'SAR'))::text as currency
      from public.payments p
      where p.user_id = $1
        and p.status = 'succeeded'
  $q$;

  if withdrawals_ready then
    sql := sql || $qw$
      union all

      -- User withdrawals (future table support)
      select
        w.id as id,
        'Wallet Withdrawal'::text as title,
        w.amount::numeric as amount,
        'outgoing'::text as type,
        w.status::text as status,
        'withdrawal'::text as source,
        w.id::text as reference_id,
        w.created_at as "timestamp",
        'SAR'::text as currency
      from public.withdrawals w
      where w.user_id = $1
    $qw$;
  end if;

  sql := sql || $qf$
    )
    select
      txns.id,
      txns.title,
      txns.amount,
      txns.type,
      txns.status,
      txns.source,
      txns.reference_id,
      txns."timestamp",
      txns.currency
    from txns
    order by txns."timestamp" desc nulls last
    limit greatest($2, 0)
    offset greatest($3, 0)
  $qf$;

  return query execute sql using uid, p_limit, p_offset;
end;
$$;

grant execute on function public.get_wallet_transactions(int, int) to authenticated;


create or replace function public.get_damin_order_for_chat(p_conversation_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  uid uuid := auth.uid();
  other_user uuid;
  order_record record;
  user_role text;
  actions text[] := array[]::text[];
begin
  if uid is null then
    raise exception 'Authentication required';
  end if;

  -- Require membership in this conversation
  if not exists (
    select 1
    from public.conversation_members cm
    where cm.conversation_id = p_conversation_id
      and cm.user_id = uid
  ) then
    return null;
  end if;

  select cm.user_id
    into other_user
  from public.conversation_members cm
  where cm.conversation_id = p_conversation_id
    and cm.user_id <> uid
  limit 1;

  if other_user is null then
    return null;
  end if;

  select d.*
    into order_record
  from public.damin_orders d
  where d.status not in ('cancelled', 'completed')
    and (
      (d.payer_user_id = uid and d.beneficiary_user_id = other_user)
      or
      (d.payer_user_id = other_user and d.beneficiary_user_id = uid)
    )
  order by d.created_at desc
  limit 1;

  if not found then
    return null;
  end if;

  if order_record.payer_user_id = uid then
    user_role := 'payer';
  else
    user_role := 'beneficiary';
  end if;

  if user_role = 'payer' and order_record.status = 'both_confirmed' then
    actions := array_append(actions, 'pay');
  end if;

  if user_role = 'payer'
     and order_record.status in ('escrow_deposit', 'awaiting_completion')
     and order_record.completion_confirmed_by_payer_at is null then
    actions := array_append(actions, 'confirm_service');
  end if;

  if user_role = 'beneficiary'
     and order_record.status in ('escrow_deposit', 'awaiting_completion')
     and order_record.completion_confirmed_by_beneficiary_at is null then
    actions := array_append(actions, 'confirm_service');
  end if;

  if order_record.status in ('escrow_deposit', 'awaiting_completion') then
    actions := array_append(actions, 'dispute');
  end if;

  if order_record.status in ('created', 'pending_confirmations') then
    if user_role = 'payer' and order_record.payer_confirmed_at is null then
      actions := array_append(actions, 'confirm_participation');
    end if;

    if user_role = 'beneficiary' and order_record.beneficiary_confirmed_at is null then
      actions := array_append(actions, 'confirm_participation');
    end if;
  end if;

  return jsonb_build_object(
    'order_id', order_record.id,
    'status', order_record.status,
    'user_role', user_role,
    'service_details', order_record.service_type_or_details,
    'total_amount', order_record.total_amount,
    'service_value', order_record.service_value,
    'commission', order_record.commission,
    'available_actions', to_jsonb(actions),
    'payer_confirmed', (order_record.payer_confirmed_at is not null),
    'beneficiary_confirmed', (order_record.beneficiary_confirmed_at is not null),
    'escrow_deposited', (order_record.escrow_deposit_at is not null),
    'service_completed', (order_record.status = 'completed')
  );
end;
$$;

grant execute on function public.get_damin_order_for_chat(uuid) to authenticated;
