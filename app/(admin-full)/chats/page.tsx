import { MessageSquareText } from "lucide-react";

export default function ChatsIndexPage() {
  return (
    <div className="flex h-full flex-col items-center justify-center gap-4 text-center">
      <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-100">
        <MessageSquareText className="h-8 w-8 text-slate-300" />
      </div>
      <div>
        <p className="text-sm font-semibold text-slate-500">اختر محادثة</p>
        <p className="mt-1 text-xs text-slate-400">
          اختر محادثة من القائمة للرد أو المتابعة
        </p>
      </div>
    </div>
  );
}
