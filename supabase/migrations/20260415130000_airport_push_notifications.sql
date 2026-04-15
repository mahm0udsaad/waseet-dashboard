-- Update the push notification trigger to also send push for airport request notifications
-- Previously it only fired for type = 'message'

CREATE OR REPLACE FUNCTION public.trigger_push_notification()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  edge_function_url text;
  service_role_key text;
  supabase_url text;
  allowed_types text[] := ARRAY[
    'message',
    'airport_request_approved',
    'airport_request_rejected',
    'airport_request_completed'
  ];
BEGIN
  -- Only send push for allowed notification types
  IF NOT (new.type = ANY(allowed_types)) THEN
    RETURN new;
  END IF;

  supabase_url := current_setting('app.settings.supabase_url', true);
  service_role_key := current_setting('app.settings.service_role_key', true);

  IF supabase_url IS NULL OR service_role_key IS NULL THEN
    RAISE WARNING 'Supabase URL or service role key not configured. Push notification skipped.';
    RETURN new;
  END IF;

  edge_function_url := supabase_url || '/functions/v1/send-message-push';

  PERFORM net.http_post(
    url := edge_function_url,
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || service_role_key
    ),
    body := jsonb_build_object(
      'notification_id', new.id,
      'recipient_id', new.recipient_id,
      'conversation_id', new.conversation_id,
      'message_id', new.message_id,
      'title', new.title,
      'body', new.body,
      'type', new.type,
      'data', COALESCE(new.data, '{}'::jsonb)
    )
  );

  RETURN new;
EXCEPTION
  WHEN others THEN
    RAISE WARNING 'Failed to trigger push notification: %', sqlerrm;
    RETURN new;
END;
$$;
