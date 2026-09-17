/* eslint-disable @typescript-eslint/no-explicit-any */
import { createFileRoute, Link } from "@tanstack/react-router";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { Loader2, Sparkles, CalendarPlus, Trophy, Wallet, GraduationCap } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { matchUniversities } from "@/lib/ai.functions";
import { UNIVERSITIES, COUNTRY_LIST, type Country, type University } from "@/lib/universities";
import { estimateOdds, type Odds } from "@/lib/match";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export const Route = createFileRoute("/universities")({
  head: () => ({
    meta: [
      { title: "Университеты: подбор и база данных — Studymaxxing" },
      {
        name: "description",
        content:
          "ИИ-подбор университетов США, Гонконга, Казахстана и Европы: рейтинги QS, шансы поступления, требования, дедлайны и стоимость.",
      },
      { property: "og:title", content: "University Match & Database — Studymaxxing" },
      {
        property: "og:description",
        content: "Персональный список вузов с шансами поступления и дедлайнами в один клик.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: UniversitiesPage,
});

const CLS_STYLE: Record<Odds["classification"], string> = {
  Safety: "bg-lime/20 text-lime-foreground border-lime/40",
  Match: "bg-primary/10 text-primary border-primary/30",
  Reach: "bg-destructive/10 text-destructive border-destructive/30",
};

function UniversitiesPage() {
  const { user } = useAuth();
  const run = useServerFn(matchUniversities);
  const [country, setCountry] = useState<Country | "Все">("Все");
  const [profile, setProfile] = useState<any>({});
  const [apCount, setApCount] = useState(0);
  const [bonus, setBonus] = useState(0);
  const [active, setActive] = useState<University | null>(null);
  const [busy, setBusy] = useState(false);
  const [ai, setAi] = useState<{ matches: any[]; advice: string } | null>(null);

  const load = useCallback(async () => {
    if (!user) return;
    const [p, a, h, e] = await Promise.all([
      supabase.from("profiles").select("*").eq("id", user.id).maybeSingle(),
      supabase.from("ap_exams").select("score").eq("user_id", user.id),
      supabase.from("olympiads_honors").select("level").eq("user_id", user.id),
      supabase.from("extracurriculars").select("id").eq("user_id", user.id),
    ]);
    setProfile(p.data ?? {});
    setApCount((a.data ?? []).length);
    const honorBonus = (h.data ?? []).reduce((sum: number, row: any) => {
      const lvl = String(row.level ?? "");
      return sum + (lvl === "International" ? 6 : lvl === "National" ? 4 : 2);
    }, 0);
    setBonus(Math.min(18, honorBonus) + Math.min(6, (e.data ?? []).length));
  }, [user]);

  useEffect(() => {
    void load();
  }, [load]);

  const list = useMemo(
    () =>
      UNIVERSITIES.filter((u) => country === "Все" || u.country === country)
        .map((u) => ({ uni: u, odds: estimateOdds(u, profile, bonus, apCount) }))
        .sort((a, b) => a.uni.qs - b.uni.qs),
    [country, profile, bonus, apCount],
  );

  async function generateMatch() {
    if (!user) return;
    setBusy(true);
    try {
      const catalog = UNIVERSITIES.map((u) => `${u.name} (${u.country}, QS ${u.qs})`);
      const res: any = await run({ data: { catalog } });
      setAi({ matches: res?.matches ?? [], advice: res?.advice ?? "" });
      toast.success("Персональный список готов");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Не удалось подобрать вузы");
    } finally {
      setBusy(false);
    }
  }

  async function addDeadline(uni: University, d: { label: string; date: string }) {
    if (!user) {
      toast.error("Войдите, чтобы добавить дедлайн в календарь");
      return;
    }
    const { error } = await supabase.from("calendar_events").insert({
      user_id: user.id,
      title: `${uni.name} — ${d.label}`,
      description: `Дедлайн подачи. ${uni.city}, QS ${uni.qs}.`,
      event_date: d.date,
      event_type: "deadline",
      color: "red",
    } as any);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Дедлайн добавлен в календарь");
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-12">
      <h1 className="text-4xl font-extrabold">University Match &amp; Database</h1>
      <p className="mt-2 max-w-2xl text-muted-foreground">
        ИИ подбирает вузы под ваш профиль, тесты и бюджет, а база данных показывает рейтинг QS,
        требования, дедлайны и шансы поступления.
      </p>

      {/* AI match */}
      <section className="surface-card mt-8 p-7">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <h2 className="flex items-center gap-2 text-lg font-bold">
            <Sparkles className="size-5 text-primary" /> Персональный подбор
          </h2>
          {user ? (
            <Button className="rounded-full" onClick={generateMatch} disabled={busy}>
              {busy ? (
                <>
                  <Loader2 className="mr-2 size-4 animate-spin" /> ИИ подбирает...
                </>
              ) : (
                "Подобрать университеты"
              )}
            </Button>
          ) : (
            <Button asChild className="rounded-full">
              <Link to="/auth">Войти для подбора</Link>
            </Button>
          )}
        </div>

        {ai?.advice && <p className="mt-4 text-sm text-muted-foreground">{ai.advice}</p>}
        {ai && ai.matches.length > 0 && (
          <div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            {ai.matches.map((m, i) => (
              <div key={i} className="rounded-2xl border border-border p-4">
                <div className="flex items-start justify-between gap-2">
                  <p className="font-semibold leading-tight">{m.university}</p>
                  <Badge
                    variant="outline"
                    className={"rounded-full " + (CLS_STYLE[m.classification as never] ?? "")}
                  >
                    {m.classification} · {m.probability}%
                  </Badge>
                </div>
                <p className="mt-1 text-xs text-muted-foreground">{m.country}</p>
                <p className="mt-2 text-sm text-muted-foreground">{m.reason}</p>
                {m.budget_fit && (
                  <p className="mt-2 flex gap-2 text-xs text-muted-foreground">
                    <Wallet className="size-3.5 shrink-0" />
                    {m.budget_fit}
                  </p>
                )}
              </div>
            ))}
          </div>
        )}
        {!ai && (
          <p className="mt-4 text-sm text-muted-foreground">
            Заполните портфолио (GPA, AP, тесты, бюджет) — и ИИ соберёт список вузов с наибольшими
            шансами.
          </p>
        )}
      </section>

      {/* Explorer */}
      <div className="mt-10 flex flex-wrap gap-2">
        {(["Все", ...COUNTRY_LIST] as const).map((c) => (
          <button
            key={c}
            onClick={() => setCountry(c as Country | "Все")}
            className={
              "rounded-full border px-4 py-1.5 text-sm font-medium transition-colors " +
              (country === c
                ? "border-primary bg-primary text-primary-foreground"
                : "border-border bg-card text-muted-foreground hover:bg-secondary")
            }
          >
            {c}
          </button>
        ))}
      </div>

      <div className="mt-6 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
        {list.map(({ uni, odds }) => (
          <article key={uni.id} className="surface-card overflow-hidden">
            <div className="relative h-40">
              <img
                src={uni.photos[0]}
                alt={`Кампус ${uni.name}`}
                loading="lazy"
                className="size-full object-cover"
              />
              <span className="absolute left-3 top-3 rounded-full bg-background/90 px-3 py-1 text-xs font-bold">
                QS #{uni.qs}
              </span>
            </div>
            <div className="p-5">
              <h3 className="text-base font-bold leading-tight">{uni.name}</h3>
              <p className="mt-1 text-xs text-muted-foreground">
                {uni.city} · {uni.country}
              </p>
              <div className="mt-3 flex flex-wrap items-center gap-2">
                <Badge variant="outline" className={"rounded-full " + CLS_STYLE[odds.classification]}>
                  {odds.classification} · {odds.probability}%
                </Badge>
                <span className="text-xs text-muted-foreground">GPA {uni.gpa}</span>
              </div>
              <Button
                variant="outline"
                className="mt-4 w-full rounded-full"
                onClick={() => setActive(uni)}
              >
                Подробнее
              </Button>
            </div>
          </article>
        ))}
      </div>

      <Dialog open={!!active} onOpenChange={(o) => !o && setActive(null)}>
        <DialogContent className="max-h-[88vh] max-w-3xl overflow-y-auto">
          {active && (
            <UniDetails
              uni={active}
              odds={estimateOdds(active, profile, bonus, apCount)}
              onAddDeadline={(d) => addDeadline(active, d)}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

function UniDetails({
  uni,
  odds,
  onAddDeadline,
}: {
  uni: University;
  odds: Odds;
  onAddDeadline: (d: { label: string; date: string }) => void;
}) {
  return (
    <>
      <DialogHeader>
        <DialogTitle className="flex flex-wrap items-center gap-3 text-xl">
          {uni.name}
          <Badge variant="outline" className="rounded-full">
            <Trophy className="mr-1 size-3.5" /> QS #{uni.qs}
          </Badge>
        </DialogTitle>
        <DialogDescription>
          {uni.city} · {uni.country}
        </DialogDescription>
      </DialogHeader>

      <div className="grid grid-cols-3 gap-2">
        {uni.photos.map((src, i) => (
          <img
            key={i}
            src={src}
            alt={`${uni.name} — фото кампуса ${i + 1}`}
            loading="lazy"
            className="h-28 w-full rounded-xl object-cover"
          />
        ))}
      </div>

      <div className="rounded-2xl border border-border p-4">
        <div className="flex items-center justify-between">
          <span className="text-sm font-semibold">Шансы поступления</span>
          <Badge variant="outline" className={"rounded-full " + CLS_STYLE[odds.classification]}>
            {odds.classification} · {odds.probability}%
          </Badge>
        </div>
        <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-secondary">
          <div className="h-full rounded-full bg-primary" style={{ width: `${odds.probability}%` }} />
        </div>
        <p className="mt-2 text-xs text-muted-foreground">
          Расчёт по вашему GPA, тестам, AP, олимпиадам, активностям и бюджету.
        </p>
      </div>

      <section>
        <h4 className="flex items-center gap-2 text-sm font-bold">
          <GraduationCap className="size-4 text-primary" /> Требования и средние баллы
        </h4>
        <dl className="mt-2 grid gap-2 text-sm sm:grid-cols-2">
          <Row k="GPA" v={uni.gpa} />
          <Row k="SAT" v={uni.sat} />
          <Row k="ACT" v={uni.act} />
          <Row k="AP" v={uni.ap} />
          <Row k="ЕНТ (UNT)" v={uni.unt} />
          <Row k="NUET" v={uni.nuet} />
          <Row k="Язык" v={uni.english} />
          <Row k="Стоимость" v={uni.tuition} />
          <Row k="Финансовая помощь" v={uni.aid} />
        </dl>
      </section>

      <section>
        <h4 className="text-sm font-bold">Дедлайны и чек-лист</h4>
        <div className="mt-2 grid gap-2">
          {uni.deadlines.map((d) => (
            <div
              key={d.label}
              className="flex items-center justify-between gap-3 rounded-xl border border-border px-4 py-2"
            >
              <div>
                <p className="text-sm font-medium">{d.label}</p>
                <p className="text-xs text-muted-foreground">{d.date}</p>
              </div>
              <Button size="sm" variant="ghost" className="rounded-full text-primary" onClick={() => onAddDeadline(d)}>
                <CalendarPlus className="mr-1 size-4" /> В календарь
              </Button>
            </div>
          ))}
        </div>
      </section>

      <section>
        <h4 className="text-sm font-bold">Об университете</h4>
        <p className="mt-2 text-sm text-muted-foreground">{uni.overview}</p>
        <div className="mt-3 flex flex-wrap gap-2">
          {uni.programs.map((p) => (
            <Badge key={p} variant="secondary" className="rounded-full">
              {p}
            </Badge>
          ))}
        </div>
        <p className="mt-3 text-sm text-muted-foreground">
          <span className="font-semibold text-foreground">Стратегия подачи: </span>
          {uni.strategy}
        </p>
      </section>
    </>
  );
}

function Row({ k, v }: { k: string; v: string | undefined }) {
  if (!v) return null;
  return (
    <div className="rounded-xl bg-secondary/60 px-3 py-2">
      <dt className="text-xs text-muted-foreground">{k}</dt>
      <dd className="text-sm font-medium">{v}</dd>
    </div>
  );
}
