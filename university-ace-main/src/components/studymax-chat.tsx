import { useState, useRef, useEffect } from "react";
import { useServerFn } from "@tanstack/react-start";
import { MessageCircle, X, Send, Loader2, GraduationCap } from "lucide-react";
import { studymaxChat } from "@/lib/ai.functions";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";

type Msg = { role: "user" | "assistant"; content: string };

export function StudymaxChat() {
  const { user } = useAuth();
  const send = useServerFn(studymaxChat);
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Msg[]>([
    {
      role: "assistant",
      content:
        "Привет! Я Studymax AI. Вижу твоё портфолио и помогу с эссе, стратегией и вопросами о поступлении. С чего начнём?",
    },
  ]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, open]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const text = input.trim();
    if (!text || busy) return;
    const next: Msg[] = [...messages, { role: "user", content: text }];
    setMessages(next);
    setInput("");
    setBusy(true);
    try {
      const res = await send({ data: { messages: next.filter((m) => m.content) } });
      setMessages([...next, { role: "assistant", content: res.reply }]);
    } catch (err) {
      setMessages([
        ...next,
        {
          role: "assistant",
          content: err instanceof Error ? `Ошибка: ${err.message}` : "Что-то пошло не так.",
        },
      ]);
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      {open && (
        <div className="fixed bottom-24 right-5 z-50 flex h-[520px] w-[min(24rem,calc(100vw-2.5rem))] flex-col overflow-hidden rounded-3xl border border-border bg-card shadow-lift">
          <div className="flex items-center gap-3 border-b border-border bg-primary px-4 py-3 text-primary-foreground">
            <span className="flex size-9 items-center justify-center rounded-xl bg-primary-foreground/15">
              <GraduationCap className="size-5" />
            </span>
            <div className="flex-1">
              <p className="text-sm font-bold">Studymax AI</p>
              <Badge className="mt-0.5 rounded-full bg-lime text-[10px] text-lime-foreground hover:bg-lime">
                на базе Gemini
              </Badge>
            </div>
            <button onClick={() => setOpen(false)} aria-label="Закрыть">
              <X className="size-5" />
            </button>
          </div>

          <div className="flex-1 space-y-3 overflow-y-auto px-4 py-4">
            {messages.map((m, i) => (
              <div
                key={i}
                className={m.role === "user" ? "flex justify-end" : "flex justify-start"}
              >
                <div
                  className={
                    m.role === "user"
                      ? "max-w-[85%] whitespace-pre-wrap rounded-2xl bg-primary px-3.5 py-2 text-sm text-primary-foreground"
                      : "max-w-[90%] whitespace-pre-wrap text-sm leading-relaxed text-foreground"
                  }
                >
                  {m.content}
                </div>
              </div>
            ))}
            {busy && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Loader2 className="size-4 animate-spin" /> Studymax AI думает...
              </div>
            )}
            <div ref={endRef} />
          </div>

          <form onSubmit={submit} className="flex gap-2 border-t border-border p-3">
            <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={user ? "Спросите что угодно..." : "Войдите, чтобы общаться"}
              disabled={!user || busy}
              className="rounded-full"
            />
            <Button
              type="submit"
              size="icon"
              className="shrink-0 rounded-full"
              disabled={!user || busy}
            >
              <Send className="size-4" />
            </Button>
          </form>
        </div>
      )}

      <button
        onClick={() => setOpen((v) => !v)}
        aria-label="Studymax AI"
        className="fixed bottom-5 right-5 z-50 flex size-14 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lift transition-transform hover:scale-105"
      >
        {open ? <X className="size-6" /> : <MessageCircle className="size-6" />}
      </button>
    </>
  );
}
