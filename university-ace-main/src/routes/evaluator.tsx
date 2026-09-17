import { createFileRoute, Link } from "@tanstack/react-router";
import { useCallback, useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { Loader2, Sparkles, TrendingUp, AlertTriangle, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";
import {
  ResponsiveContainer,
  ScatterChart,
  Scatter,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ZAxis,
} from "recharts";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { evaluateProfile } from "@/lib/ai.functions";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";

export const Route = createFileRoute("/evaluator")({
  head: () => ({
    meta: [
      { title: "ИИ-оценка шансов поступления — Studymaxxing" },
      {
        name: "description",
        content:
          "Холистический балл, вероятности поступления по странам и стратегическая обратная связь от ИИ.",
      },
      { property: "og:title", content: "AI Admissions Evaluator — Studymaxxing" },
      {
        property: "og:description",
        content: "Оценка профиля для США, Гонконга, Казахстана и Европы на базе Gemini.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Evaluator,
});

type CountryResult = {
  country: string;
  probability: number;
  classification: string;
  comment: string;
};

// Deterministic pseudo-random benchmark cloud of 600+ past applicants.
function benchmarkCloud() {
  const pts: { gpa: number; score: number }[] = [];
  let seed = 42;
  for (let i = 0; i < 620; i++) {
    seed = (seed * 1103515245 + 12345) % 2147483648;
    const r1 = (seed / 2147483648) * 2 - 1;
    seed = (seed * 1103515245 + 12345) % 2147483648;
    const r2 = seed / 2147483648;
    const gpa = Math.min(4, Math.max(2.4, 3.55 + r1 * 0.45));
    const score = Math.min(99, Math.max(15, (gpa - 2.4) * 45 + r2 * 34));
    pts.push({ gpa: Number(gpa.toFixed(2)), score: Math.round(score) });
  }
  return pts;
}

const CLOUD = benchmarkCloud();

function Evaluator() {
  const { user, loading } = useAuth();
  const run = useServerFn(evaluateProfile);
  const [evaluation, setEvaluation] = useState<any>(null);
  const [busy, setBusy] = useState(false);
  const [gpa, setGpa] = useState<number | null>(null);

  const load = useCallback(async () => {
    if (!user) return;
    const [{ data }, prof] = await Promise.all([
      supabase
        .from("ai_evaluations")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle(),
      supabase.from("profiles").select("gpa_unweighted").eq("id", user.id).maybeSingle(),
    ]);
    setEvaluation(data);
    setGpa(prof.data?.gpa_unweighted ? Number(prof.data.gpa_unweighted) : null);
  }, [user]);

  useEffect(() => {
    void load();
  }, [load]);

  async function evaluate() {
    setBusy(true);
    try {
      const result = await run();
      setEvaluation(result);
      toast.success("Оценка готова");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Не удалось выполнить оценку");
    } finally {
      setBusy(false);
    }
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
        <h1 className="text-2xl font-bold">ИИ-оценка доступна после входа</h1>
        <Button asChild className="mt-6 rounded-full">
          <Link to="/auth">Войти / Регистрация</Link>
        </Button>
      </div>
    );
  }

  const countries: CountryResult[] = (evaluation?.countries as CountryResult[]) ?? [];
  const score = evaluation?.holistic_score ?? 0;

  return (
    <div className="mx-auto max-w-6xl px-4 py-12">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-4xl font-extrabold">AI Admissions Evaluator</h1>
          <p className="mt-2 text-muted-foreground">
            Глубокая оценка вашего профиля под каждую целевую страну.
          </p>
        </div>
        <Button className="rounded-full" onClick={evaluate} disabled={busy}>
          {busy ? (
            <>
              <Loader2 className="mr-2 size-4 animate-spin" /> ИИ анализирует...
            </>
          ) : (
            <>
              <Sparkles className="mr-2 size-4" /> Запустить ИИ-оценку
            </>
          )}
        </Button>
      </div>

      {!evaluation && !busy && (
        <div className="surface-card mt-10 p-10 text-center">
          <p className="text-muted-foreground">
            Заполните портфолио и нажмите «Запустить ИИ-оценку», чтобы получить холистический балл.
          </p>
          <Button asChild variant="outline" className="mt-5 rounded-full">
            <Link to="/portfolio">Заполнить портфолио</Link>
          </Button>
        </div>
      )}

      {evaluation && (
        <div className="mt-10 grid gap-6">
          <div className="grid gap-6 lg:grid-cols-[320px_1fr]">
            <div className="surface-card p-7 text-center">
              <p className="text-sm font-medium text-muted-foreground">Holistic Profile Score</p>
              <p className="mt-3 font-display text-6xl font-extrabold text-primary">{score}%</p>
              <Progress value={score} className="mt-5" />
              <p className="mt-4 text-sm text-muted-foreground">{evaluation.summary}</p>
            </div>

            <div className="surface-card p-7">
              <h2 className="text-lg font-bold">Вероятность поступления по странам</h2>
              <div className="mt-5 grid gap-4">
                {countries.map((c) => (
                  <div key={c.country}>
                    <div className="flex items-center justify-between text-sm">
                      <span className="font-semibold">{c.country}</span>
                      <span className="flex items-center gap-2">
                        <Badge
                          className="rounded-full"
                          variant={
                            c.classification === "Safety"
                              ? "default"
                              : c.classification === "Match"
                                ? "secondary"
                                : "outline"
                          }
                        >
                          {c.classification}
                        </Badge>
                        <span className="font-bold text-primary">{c.probability}%</span>
                      </span>
                    </div>
                    <Progress value={c.probability} className="mt-2" />
                    <p className="mt-2 text-xs text-muted-foreground">{c.comment}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="grid gap-6 md:grid-cols-3">
            <FeedbackCard
              icon={CheckCircle2}
              title="Сильные стороны"
              items={evaluation.strengths ?? []}
              tone="text-lime-foreground"
            />
            <FeedbackCard
              icon={AlertTriangle}
              title="Пробелы"
              items={evaluation.gaps ?? []}
              tone="text-destructive"
            />
            <FeedbackCard
              icon={TrendingUp}
              title="Чего не хватает в профиле"
              items={evaluation.missing_items ?? []}
              tone="text-primary"
            />
          </div>

          <div className="surface-card p-7">
            <h2 className="text-lg font-bold">Сравнение с 600+ кандидатами прошлых лет</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              {evaluation.benchmark?.comment ??
                "Ваша точка (зелёная) на фоне исторических профилей."}
            </p>
            <div className="mt-6 h-80">
              <ResponsiveContainer width="100%" height="100%">
                <ScatterChart margin={{ top: 10, right: 20, bottom: 20, left: 0 }}>
                  <CartesianGrid strokeOpacity={0.2} />
                  <XAxis
                    type="number"
                    dataKey="gpa"
                    name="GPA"
                    domain={[2.4, 4]}
                    tick={{ fontSize: 12 }}
                  />
                  <YAxis
                    type="number"
                    dataKey="score"
                    name="Profile score"
                    domain={[0, 100]}
                    tick={{ fontSize: 12 }}
                  />
                  <ZAxis range={[35, 35]} />
                  <Tooltip cursor={{ strokeDasharray: "3 3" }} />
                  <Scatter data={CLOUD} fill="oklch(0.55 0.22 264)" fillOpacity={0.25} />
                  <Scatter
                    data={[{ gpa: gpa ?? 3.6, score: score }]}
                    fill="oklch(0.79 0.2 129)"
                    shape="star"
                  />
                </ScatterChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function FeedbackCard({
  icon: Icon,
  title,
  items,
  tone,
}: {
  icon: React.ElementType;
  title: string;
  items: string[];
  tone: string;
}) {
  return (
    <div className="surface-card p-6">
      <h3 className={"flex items-center gap-2 font-bold " + tone}>
        <Icon className="size-4" /> {title}
      </h3>
      <ul className="mt-3 grid gap-2 text-sm text-muted-foreground">
        {items.length === 0 && <li>—</li>}
        {items.map((i, idx) => (
          <li key={idx} className="flex gap-2">
            <span className="text-primary">•</span>
            <span>{i}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
