-- Migration: Add admin chat support for airport inspection requests
-- This allows admins to create conversations with users about their airport requests

-- 1. Add conversation_id to airport_inspection_requests
ALTER TABLE public.airport_inspection_requests
  ADD COLUMN IF NOT EXISTS conversation_id uuid REFERENCES public.conversations(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS airport_requests_conversation_idx
  ON public.airport_inspection_requests (conversation_id);

-- 2. RPC: Create or get a conversation for an airport request
CREATE OR REPLACE FUNCTION public.admin_create_airport_chat(
  p_request_id uuid,
  p_admin_user_id uuid
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_request RECORD;
  v_conversation_id uuid;
BEGIN
  -- Fetch the airport request
  SELECT id, user_id, conversation_id
    INTO v_request
    FROM public.airport_inspection_requests
   WHERE id = p_request_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Airport request not found';
  END IF;

  -- If conversation already exists, return it
  IF v_request.conversation_id IS NOT NULL THEN
    RETURN jsonb_build_object('conversation_id', v_request.conversation_id);
  END IF;

  -- Create new conversation
  INSERT INTO public.conversations (type) VALUES ('dm')
    RETURNING id INTO v_conversation_id;

  -- Add both user and admin as members
  INSERT INTO public.conversation_members (conversation_id, user_id)
  VALUES
    (v_conversation_id, v_request.user_id),
    (v_conversation_id, p_admin_user_id)
  ON CONFLICT DO NOTHING;

  -- Link conversation to airport request
  UPDATE public.airport_inspection_requests
     SET conversation_id = v_conversation_id
   WHERE id = p_request_id;

  RETURN jsonb_build_object('conversation_id', v_conversation_id);
END;
$$;

-- 3. RPC: Admin sends a message in an airport request conversation
-- Note: The existing trigger `messages_notify_on_insert` on the messages table
-- automatically creates notifications for other conversation members and triggers push.
-- No need to manually insert notifications here.
CREATE OR REPLACE FUNCTION public.admin_send_airport_message(
  p_conversation_id uuid,
  p_sender_id uuid,
  p_content text
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_message_id uuid;
BEGIN
  -- Insert message (trigger handles notification + push automatically)
  INSERT INTO public.messages (conversation_id, sender_id, content)
  VALUES (p_conversation_id, p_sender_id, p_content)
  RETURNING id INTO v_message_id;

  RETURN jsonb_build_object('message_id', v_message_id);
END;
$$;
