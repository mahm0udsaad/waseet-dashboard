"use client";

import { useState } from "react";
import { ActionDropdown } from "@/components/admin/ActionDropdown";
import { ToggleSwitch } from "@/components/admin/ToggleSwitch";
import { UserInfoModal } from "@/components/admin/UserInfoModal";
import { MessagesModal } from "@/components/admin/chats/MessagesModal";

type ChatRowActionsProps = {
  conversationId: string;
  status: string;
  adId?: string | null;
  memberIds: string[];
};

export function ChatRowActions({
  conversationId,
  status,
  adId,
  memberIds,
}: ChatRowActionsProps) {
  const [showMembers, setShowMembers] = useState(false);
  const [showMessages, setShowMessages] = useState(false);

  const items = [
    {
      label: "عرض الرسائل",
      onClick: () => setShowMessages(true),
    },
    {
      label: "عرض الأعضاء",
      onClick: () => setShowMembers(true),
    },
    ...(adId
      ? [{ label: "عرض الإعلان المرتبط", href: `/ads?ad_id=${adId}` }]
      : []),
  ];

  return (
    <div className="flex items-center gap-3">
      <ToggleSwitch
        checked={status === "closed"}
        entityId={conversationId}
        onEndpoint={`/api/admin/conversations/${conversationId}/close`}
        offEndpoint={`/api/admin/conversations/${conversationId}/close`}
        labelOn="مغلقة"
        labelOff="مفتوحة"
      />

      <ActionDropdown items={items} />

      <UserInfoModal
        open={showMembers}
        onClose={() => setShowMembers(false)}
        userIds={memberIds}
      />

      <MessagesModal
        open={showMessages}
        onClose={() => setShowMessages(false)}
        conversationId={conversationId}
      />
    </div>
  );
}
