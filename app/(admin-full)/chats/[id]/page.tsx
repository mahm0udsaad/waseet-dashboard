import { notFound } from "next/navigation";
import { requireRole } from "@/lib/auth/requireRole";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import { ChatView } from "@/components/admin/chats/ChatView";

type Props = { params: Promise<{ id: string }> };

export default async function ChatDetailPage({ params }: Props) {
  const { id } = await params;
  const { userId } = await requireRole([
    "super_admin",
    "admin",
    "support_agent",
  ]);

  const supabase = getSupabaseServerClient();

  const [{ data: conv }, { data: rawMessages }, { data: rawMembers }] =
    await Promise.all([
      supabase
        .from("conversations")
        .select("id, status, ad_id, created_at, labels")
        .eq("id", id)
        .maybeSingle(),
      supabase
        .from("messages")
        .select("id, sender_id, content, attachments, type, created_at")
        .eq("conversation_id", id)
        .order("created_at", { ascending: true })
        .limit(500),
      supabase
        .from("conversation_members")
        .select("user_id")
        .eq("conversation_id", id),
    ]);

  if (!conv) notFound();

  const { data: ad } = conv.ad_id
    ? await supabase
        .from("ads")
        .select("id, title, type")
        .eq("id", conv.ad_id)
        .maybeSingle()
    : { data: null };

  const { data: orderRow } = await supabase
    .from("orders")
    .select("id, status, amount, payment_method")
    .eq("conversation_id", id)
    .not("status", "in", '("completed","refunded")')
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  const memberIds = (rawMembers ?? []).map((m) => m.user_id);
  const senderIds = [
    ...new Set(
      (rawMessages ?? []).map((m) => m.sender_id).filter(Boolean) as string[]
    ),
  ];
  const allIds = [...new Set([...memberIds, ...senderIds, userId])];

  const { data: profiles } =
    allIds.length > 0
      ? await supabase
          .from("profiles")
          .select("user_id, display_name, phone, role")
          .in("user_id", allIds)
      : { data: [] };

  const profileMap = new Map(
    (profiles ?? []).map((p) => [
      p.user_id,
      {
        name: (p.display_name as string | null) ?? "مستخدم",
        phone: (p.phone as string | null) ?? null,
        role: (p.role as string | null) ?? null,
      },
    ])
  );

  type AttRaw = Record<string, unknown>;

  const messages = (rawMessages ?? []).map((m) => ({
    id: m.id,
    sender_id: m.sender_id ?? "",
    sender_name: profileMap.get(m.sender_id ?? "")?.name ?? "مستخدم",
    sender_role: profileMap.get(m.sender_id ?? "")?.role ?? null,
    content: m.content as string | null,
    attachments: (m.attachments as AttRaw[]) ?? [],
    type: (m.type ?? "user") as string,
    created_at: m.created_at as string,
  }));

  // Generate signed URLs for image / receipt attachments
  // - image type: uses `path` field
  // - receipt type: uses `pdf_path` field (receipt PDFs stored differently)
  const CHAT_BUCKET = "chat";
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

  const members = memberIds.map((uid) => ({
    uid,
    name: profileMap.get(uid)?.name ?? "مستخدم",
    phone: profileMap.get(uid)?.phone ?? null,
    role: profileMap.get(uid)?.role ?? null,
  }));

  return (
    <ChatView
      conversationId={id}
      initialMessages={messages}
      members={members}
      adTitle={ad?.title ?? null}
      adId={ad?.id ?? null}
      adType={ad?.type ?? null}
      conversationStatus={conv.status ?? "open"}
      currentAdminId={userId}
      currentAdminName={profileMap.get(userId)?.name ?? "فريق الدعم"}
      initialLabels={(conv.labels as string[]) ?? []}
      order={
        orderRow
          ? {
              id: orderRow.id,
              status: orderRow.status ?? "",
              amount: Number(orderRow.amount ?? 0),
              payment_method: orderRow.payment_method ?? null,
            }
          : null
      }
    />
  );
}
