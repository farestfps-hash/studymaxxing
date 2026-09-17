/* eslint-disable @typescript-eslint/no-explicit-any */
import { createFileRoute, Link } from "@tanstack/react-router";
import { useCallback, useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { Loader2, Sparkles, Plus, Trash2, CalendarDays, Clock } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { generateRoadmap } from "@/lib/ai.functions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";

export const Route = createFileRoute("/roadmap")({
  head: () => ({
    meta: [
      { title: "Дорожная карта и календарь — Studymaxxing" },
      {
        name: "description",
        content:
          "Персональная ИИ-дорожная карта поступления и живой календарь дедлайнов, интервью и задач.",
      },
      { property: "og:title", content: "AI Roadmap & Calendar — Studymaxxing" },
      {
        property: "og:description",
        content: "Пошаговый план поступления с датами и управлением событиями.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: RoadmapPage,
});

const MONTHS = [
  "Январь",
  "Февраль",
  "Март",
  "Апрель",
  "Май",
  "Июнь",
  "Июль",
  "Август",
  "Сентябрь",
  "Октябрь",
  "Ноябрь",
  "Декабрь",
];
const WEEKDAYS = ["Пн", "Вт", "Ср", "Чт", "Пт", "Сб", "Вс"];

function RoadmapPage() {
  const { user, loading } = useAuth();
  const run = useServerFn(generateRoadmap);
  const [steps, setSteps] = useState<any[]>([]);
  const [events, setEvents] = useState<any[]>([]);
  const [busy, setBusy] = useState(false);
  const [now, setNow] = useState(new Date());
  const [cursor, setCursor] = useState(new Date());
  const [form, setForm] = useState({
    title: "",
    description: "",
    event_date: new Date().toISOString().slice(0, 10),
    event_type: "deadline",
  });

  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  const load = useCallback(async () => {
    if (!user) return;
    const [r, e] = await Promise.all([
      supabase
        .from("roadmaps")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle(),
      supabase.from("calendar_events").select("*").eq("user_id", user.id).order("event_date"),
    ]);
    setSteps(((r.data as any)?.steps as any[]) ?? []);
    setEvents(e.data ?? []);
  }, [user]);

  useEffect(() => {
    void load();
  }, [load]);

  async function generate() {
    setBusy(true);
    try {
      const result: any = await run();
      const newSteps: any[] = result?.steps ?? [];
      setSteps(newSteps);
      toast.success("Дорожная карта готова");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Не удалось построить карту");
    } finally {
      setBusy(false);
    }
  }

  async function addStepToCalendar(step: any) {
    if (!user) return;
    const { data, error } = await supabase
      .from("calendar_events")
      .insert({
        user_id: user.id,
        title: step.title,
        description: step.description ?? null,
        event_date: step.due_date ?? new Date().toISOString().slice(0, 10),
        event_type: "task",
      })
      .select()
      .single();
    if (error) {
      toast.error(error.message);
      return;
    }
    setEvents((prev) => [...prev, data]);
    toast.success("Добавлено в календарь");
  }

  async function addEvent(e: React.FormEvent) {
    e.preventDefault();
    if (!user) return;
    const { data, error } = await supabase
      .from("calendar_events")
      .insert({ ...form, user_id: user.id })
      .select()
      .single();
    if (error) {
      toast.error(error.message);
      return;
    }
    setEvents((prev) => [...prev, data]);
    setForm({ ...form, title: "", description: "" });
    toast.success("Событие добавлено");
  }

  async function toggleEvent(id: string, completed: boolean) {
    const { error } = await supabase.from("calendar_events").update({ completed }).eq("id", id);
    if (error) {
      toast.error(error.message);
      return;
    }
    setEvents((prev) => prev.map((x) => (x.id === id ? { ...x, completed } : x)));
  }

  async function removeEvent(id: string) {
    const { error } = await supabase.from("calendar_events").delete().eq("id", id);
    if (error) {
      toast.error(error.message);
      return;
    }
    setEvents((prev) => prev.filter((x) => x.id !== id));
  }

  if (loading) {
    return (
      <div className="flex justify-center py-24">
        <Loader2 className="size-6 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="mx-auto max-w-md px-4 py-24 text-center">
        <h1 className="text-2xl font-bold">Дорожная карта доступна после входа</h1>
        <Button asChild className="mt-6 rounded-full">
          <Link to="/auth">Войти / Регистрация</Link>
        </Button>
      </div>
    );
  }

  const year = cursor.getFullYear();
  const month = cursor.getMonth();
  const firstDay = new Date(year, month, 1);
  const offset = (firstDay.getDay() + 6) % 7;
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const cells: (number | null)[] = [
    ...Array<null>(offset).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ];

  const eventsByDay = new Map<string, any[]>();
  for (const ev of events) {
    const list = eventsByDay.get(ev.event_date) ?? [];
    list.push(ev);
    eventsByDay.set(ev.event_date, list);
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-12">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-4xl font-extrabold">Дорожная карта &amp; календарь</h1>
          <p className="mt-2 flex items-center gap-2 text-muted-foreground">
            <Clock className="size-4" />
            {now.toLocaleDateString("ru-RU", {
              weekday: "long",
              year: "numeric",
              month: "long",
              day: "numeric",
            })}
            , {now.toLocaleTimeString("ru-RU")}
          </p>
        </div>
        <Button className="rounded-full" onClick={generate} disabled={busy}>
          {busy ? (
            <>
              <Loader2 className="mr-2 size-4 animate-spin" /> ИИ строит план...
            </>
          ) : (
            <>
              <Sparkles className="mr-2 size-4" /> Сгенерировать дорожную карту
            </>
          )}
        </Button>
      </div>

      <div className="mt-10 grid gap-6 lg:grid-cols-2">
        <section className="surface-card p-7">
          <h2 className="text-lg font-bold">Персональный план</h2>
          {steps.length === 0 && (
            <p className="mt-3 text-sm text-muted-foreground">
              План ещё не создан. Заполните портфолио и нажмите «Сгенерировать дорожную карту».
            </p>
          )}
          <ol className="mt-5 grid gap-4">
            {steps.map((s, i) => (
              <li key={i} className="rounded-2xl border border-border p-4">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="flex size-7 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground">
                    {i + 1}
                  </span>
                  <span className="font-semibold">{s.title}</span>
                  {s.category && (
                    <Badge variant="secondary" className="rounded-full">
                      {s.category}
                    </Badge>
                  )}
                  {s.due_date && (
                    <span className="ml-auto text-xs text-muted-foreground">{s.due_date}</span>
                  )}
                </div>
                {s.description && (
                  <p className="mt-2 text-sm text-muted-foreground">{s.description}</p>
                )}
                <Button
                  size="sm"
                  variant="ghost"
                  className="mt-2 rounded-full text-primary"
                  onClick={() => addStepToCalendar(s)}
                >
                  <Plus className="mr-1 size-4" /> В календарь
                </Button>
              </li>
            ))}
          </ol>
        </section>

        <section className="grid gap-6">
          <div className="surface-card p-7">
            <div className="flex items-center justify-between">
              <h2 className="flex items-center gap-2 text-lg font-bold">
                <CalendarDays className="size-5 text-primary" />
                {MONTHS[month]} {year}
              </h2>
              <div className="flex gap-1">
                <Button
                  size="sm"
                  variant="outline"
                  className="rounded-full"
                  onClick={() => setCursor(new Date(year, month - 1, 1))}
                >
                  ←
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  className="rounded-full"
                  onClick={() => setCursor(new Date(year, month + 1, 1))}
                >
                  →
                </Button>
              </div>
            </div>
            <div className="mt-5 grid grid-cols-7 gap-1 text-center text-xs text-muted-foreground">
              {WEEKDAYS.map((d) => (
                <div key={d} className="py-1 font-semibold">
                  {d}
                </div>
              ))}
              {cells.map((day, i) => {
                if (day === null) return <div key={"e" + i} />;
                const iso = `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
                const dayEvents = eventsByDay.get(iso) ?? [];
                const isToday = iso === new Date().toISOString().slice(0, 10);
                return (
                  <div
                    key={iso}
                    className={
                      "aspect-square rounded-xl border p-1 text-xs " +
                      (isToday
                        ? "border-primary bg-primary/10 font-bold text-primary"
                        : "border-transparent hover:bg-secondary")
                    }
                  >
                    {day}
                    {dayEvents.length > 0 && (
                      <div className="mx-auto mt-1 size-1.5 rounded-full bg-lime" />
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          <form onSubmit={addEvent} className="surface-card grid gap-3 p-7">
            <h2 className="text-lg font-bold">Новое событие</h2>
            <div className="grid gap-2">
              <Label>Название</Label>
              <Input
                required
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="grid gap-2">
                <Label>Дата</Label>
                <Input
                  type="date"
                  required
                  value={form.event_date}
                  onChange={(e) => setForm({ ...form, event_date: e.target.value })}
                />
              </div>
              <div className="grid gap-2">
                <Label>Тип</Label>
                <select
                  className="h-9 rounded-md border border-input bg-background px-3 text-sm"
                  value={form.event_type}
                  onChange={(e) => setForm({ ...form, event_type: e.target.value })}
                >
                  <option value="deadline">Дедлайн</option>
                  <option value="interview">Интервью</option>
                  <option value="task">Задача</option>
                  <option value="exam">Экзамен</option>
                </select>
              </div>
            </div>
            <div className="grid gap-2">
              <Label>Описание</Label>
              <Textarea
                rows={2}
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
              />
            </div>
            <Button type="submit" className="w-fit rounded-full">
              Добавить событие
            </Button>
          </form>

          <div className="surface-card p-7">
            <h2 className="text-lg font-bold">Ближайшие события</h2>
            <div className="mt-4 grid gap-2">
              {events.length === 0 && (
                <p className="text-sm text-muted-foreground">Событий пока нет.</p>
              )}
              {events.map((ev) => (
                <div
                  key={ev.id}
                  className="flex items-center gap-3 rounded-2xl border border-border p-3"
                >
                  <Checkbox
                    checked={ev.completed}
                    onCheckedChange={(v) => toggleEvent(ev.id, Boolean(v))}
                  />
                  <div className="min-w-0 flex-1">
                    <p
                      className={
                        "truncate text-sm font-medium " +
                        (ev.completed ? "text-muted-foreground line-through" : "")
                      }
                    >
                      {ev.title}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {ev.event_date} · {ev.event_type}
                    </p>
                  </div>
                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={() => removeEvent(ev.id)}
                    aria-label="Удалить"
                  >
                    <Trash2 className="size-4 text-destructive" />
                  </Button>
                </div>
              ))}
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
