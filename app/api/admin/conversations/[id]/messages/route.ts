import { NextResponse } from "next/server";
import { requireRoleForApi } from "@/lib/auth/requireRoleForApi";
import { getSupabaseServerClient } from "@/lib/supabase/server";

const CHAT_BUCKET = "chat";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireRoleForApi(["super_admin", "admin", "support_agent"], request);
  if ("error" in auth) return auth.error;

  const { id } = await params;
  const supabase = getSupabaseServerClient();

  const { data: msgs } = await supabase
    .from("messages")
    .select("id, sender_id, content, attachments, type, created_at")
    .eq("conversation_id", id)
    .order("created_at", { ascending: true })
    .limit(500);

  // Fetch sender profiles
  const senderIds = [
    ...new Set((msgs ?? []).map((m) => m.sender_id).filter(Boolean)),
  ];

  const { data: profiles } =
    senderIds.length > 0
      ? await supabase
          .from("profiles")
          .select("user_id, display_name, role")
          .in("user_id", senderIds)
      : { data: [] as { user_id: string; display_name: string; role: string }[] };

  const profileMap = new Map(
    (profiles ?? []).map((p) => [p.user_id, { name: p.display_name, role: p.role }])
  );

  // Build mapped messages
  type AttRaw = Record<string, unknown>;
  const messages = (msgs ?? []).map((m) => {
    const profile = profileMap.get(m.sender_id ?? "");
    return {
      id: m.id,
      sender_id: m.sender_id ?? "",
      sender_name: profile?.name ?? "مستخدم",
      sender_role: profile?.role ?? null,
      content: m.content,
      attachments: (m.attachments ?? []) as AttRaw[],
      type: m.type ?? "user",
      created_at: m.created_at,
    };
  });

  // Generate signed URLs for image and receipt attachments (stored in Supabase Storage)
  // - image type: uses `path` field
  // - receipt type: uses `pdf_path` field (receipt PDFs stored differently)
  const toSign: { msgIdx: number; attIdx: number; path: string }[] = [];
  messages.forEach((msg, mi) => {
    msg.attachments.forEach((att, ai) => {
      if (att.type === "image" && typeof att.path === "string" && att.path) {
        toSign.push({ msgIdx: mi, attIdx: ai, path: att.path as string });
      } else if (att.type === "receipt" && typeof att.pdf_path === "string" && att.pdf_path) {
        toSign.push({ msgIdx: mi, attIdx: ai, path: att.pdf_path as string });
      }
    });
  });

  if (toSign.length > 0) {
    const signed = await Promise.all(
      toSign.map(({ path }) =>
        supabase.storage.from(CHAT_BUCKET).createSignedUrl(path, 3600)
      )
    );
    signed.forEach((result, i) => {
      if (result.data?.signedUrl) {
        const { msgIdx, attIdx } = toSign[i];
        messages[msgIdx].attachments[attIdx] = {
          ...messages[msgIdx].attachments[attIdx],
          signedUrl: result.data.signedUrl,
        };
      }
    });
  }


  return NextResponse.json({ messages });
}

// POST — send a support message from an admin into any conversation
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireRoleForApi(["super_admin", "admin", "support_agent"], request);
  if ("error" in auth) return auth.error;

  const { id } = await params;
  const body = await request.json();
  const content = (body.content ?? "").trim();

  if (!content) {
    return NextResponse.json({ error: "المحتوى مطلوب" }, { status: 400 });
  }

  // Use service-role client so we can bypass RLS (admin is not a conversation member)
  const supabase = getSupabaseServerClient();

  // Get sender's profile for display info
  const { data: senderProfile } = await supabase
    .from("profiles")
    .select("display_name, role")
    .eq("user_id", auth.userId)
    .maybeSingle();

  const senderName = senderProfile?.display_name ?? "فريق الدعم";
  const senderRole = senderProfile?.role ?? "support_agent";

  const { data: msg, error } = await supabase
    .from("messages")
    .insert({
      conversation_id: id,
      sender_id: auth.userId,
      content,
      type: "support",
      // Store sender metadata so mobile can render the name/role badge
      attachments: [
        {
          type: "support_metadata",
          sender_name: senderName,
          sender_role: senderRole,
        },
      ],
    })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ message: msg });
}
