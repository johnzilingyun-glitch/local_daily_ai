import { AlertCircle } from 'lucide-react';

export function ErrorNotice({ title, message }: { title: string; message: string }) {
  return (
    <div className="p-6 bg-rose-50 border border-rose-100 rounded-3xl flex items-start gap-4 text-rose-600">
      <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-rose-100/50 text-rose-500 shrink-0">
        <AlertCircle size={20} strokeWidth={2} />
      </div>
      <div>
        <p className="text-sm font-bold text-zinc-950 tracking-tight">{title}</p>
        <p className="mt-1 text-xs text-rose-700/80 leading-relaxed font-medium">{message}</p>
      </div>
    </div>
  );
}
