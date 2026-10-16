"use client";

import { ArrowUp, MessageSquare, Plus, Sparkles } from "lucide-react";
import { useEffect, useRef, useState } from "react";

import { UserAvatar } from "@/components/user-menu";
import { getFirstName } from "@/lib/auth/format";
import { useUser } from "@/lib/auth/user-context";
import type { Conversation } from "@/lib/mock-data";

type Message = { id: string; role: "user" | "assistant"; content: string };

const suggestions = [
  "Bu metni üç maddede özetle",
  "Müşteri e-postasına profesyonel bir yanıt yaz",
  "Bir SQL sorgusunu açıkla",
  "Kredi riskini etkileyen faktörleri listele",
];

export function Chat({ conversations }: { conversations: Conversation[] }) {
  const user = useUser();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [pending, setPending] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, pending]);

  function send(text: string) {
    const content = text.trim();
    if (!content || pending) return;
    setMessages((m) => [...m, { id: crypto.randomUUID(), role: "user", content }]);
    setInput("");
    setPending(true);
    // TODO: backend üzerinden Azure AI'ya bağlanacak (POST /api/mercek/chat).
    setTimeout(() => {
      setMessages((m) => [
        ...m,
        {
          id: crypto.randomUUID(),
          role: "assistant",
          content:
            "Azure AI bağlantısı henüz yapılandırılmadı. Backend entegrasyonu tamamlandığında yanıtlar burada görünecek.",
        },
      ]);
      setPending(false);
    }, 700);
  }

  return (
    <div className="flex h-[calc(100dvh-3.5rem)] lg:h-dvh">
      {/* Sohbet geçmişi */}
      <aside className="hidden w-64 shrink-0 flex-col border-r border-border bg-surface md:flex">
        <div className="p-3">
          <button
            type="button"
            onClick={() => setMessages([])}
            className="flex w-full items-center gap-2 rounded-lg border border-border px-3 py-2 text-sm font-medium hover:bg-surface-muted"
          >
            <Plus className="size-4" /> Yeni sohbet
          </button>
        </div>
        <p className="px-4 pb-1 text-xs font-medium text-muted">Son sohbetler</p>
        <ul className="flex-1 overflow-y-auto px-2">
          {conversations.map((c) => (
            <li key={c.id}>
              <button
                type="button"
                className="flex w-full items-center gap-2 rounded-lg px-2 py-2 text-left text-sm text-muted hover:bg-surface-muted hover:text-foreground"
              >
                <MessageSquare className="size-4 shrink-0" />
                <span className="truncate">{c.title}</span>
              </button>
            </li>
          ))}
        </ul>
      </aside>

      {/* Sohbet alanı */}
      <section className="flex min-w-0 flex-1 flex-col">
        <div className="flex-1 overflow-y-auto">
          {messages.length === 0 ? (
            <div className="mx-auto flex h-full max-w-2xl flex-col items-center justify-center px-4 text-center">
              <span className="flex size-12 items-center justify-center rounded-2xl bg-violet-500/10 text-violet-600 dark:text-violet-400">
                <Sparkles className="size-6" />
              </span>
              <h1 className="mt-4 text-2xl font-semibold tracking-tight">Merhaba {getFirstName(user.name)}, nasıl yardımcı olabilirim?</h1>
              <p className="mt-1 text-sm text-muted">Mercek, Azure AI ile çalışan asistanınız.</p>
              <div className="mt-8 grid w-full gap-2 sm:grid-cols-2">
                {suggestions.map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => send(s)}
                    className="rounded-xl border border-border bg-surface px-4 py-3 text-left text-sm hover:bg-surface-muted"
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div className="mx-auto flex max-w-3xl flex-col gap-6 px-4 py-8">
              {messages.map((m) =>
                m.role === "user" ? (
                  <div key={m.id} className="ml-auto flex max-w-[85%] items-start gap-2">
                    <div className="rounded-2xl bg-surface-muted px-4 py-2.5 text-sm">{m.content}</div>
                    <UserAvatar className="size-7 text-[10px]" />
                  </div>
                ) : (
                  <div key={m.id} className="flex gap-3 text-sm leading-relaxed">
                    <span className="flex size-7 shrink-0 items-center justify-center rounded-lg bg-violet-500/10 text-violet-600 dark:text-violet-400">
                      <Sparkles className="size-4" />
                    </span>
                    <p className="pt-1">{m.content}</p>
                  </div>
                ),
              )}
              {pending && <p className="pl-10 text-sm text-muted animate-pulse">Düşünüyor…</p>}
              <div ref={bottomRef} />
            </div>
          )}
        </div>

        {/* Mesaj kutusu */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            send(input);
          }}
          className="mx-auto w-full max-w-3xl px-4 pb-4"
        >
          <div className="flex items-end gap-2 rounded-2xl border border-border bg-surface p-2 shadow-sm focus-within:border-violet-500">
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  send(input);
                }
              }}
              rows={1}
              placeholder="Mercek'e bir mesaj yazın…"
              className="max-h-40 min-h-10 flex-1 resize-none bg-transparent px-2 py-2 text-sm outline-none"
            />
            <button
              type="submit"
              aria-label="Gönder"
              disabled={!input.trim() || pending}
              className="flex size-9 items-center justify-center rounded-xl bg-violet-600 text-white hover:bg-violet-700 disabled:opacity-40"
            >
              <ArrowUp className="size-4" />
            </button>
          </div>
          <p className="mt-2 text-center text-xs text-muted">
            Mercek hata yapabilir. Önemli bilgileri doğrulayın.
          </p>
        </form>
      </section>
    </div>
  );
}
