import { createFileRoute, Link } from "@tanstack/react-router";
import { useCallback, useEffect, useState } from "react";
import { Lock, Loader2, Trophy, UserRound, Globe2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/leaderboard")({
  head: () => ({
    meta: [
      { title: "Лидерборд абитуриентов — Studymaxxing" },
      {
        name: "description",
        content:
          "Топ-100 холистических баллов: Overall, USA, Hong Kong, Kazakhstan и Europe. Открытые портфолио можно изучить целиком.",
      },
      { property: "og:title", content: "Лидерборд абитуриентов — Studymaxxing" },
      {
        property: "og:description",
        content: "Сравните свой холистический балл с другими абитуриентами по странам.",
      },
    ],
  }),
  component: LeaderboardPage,
});

const TABS = [
  { key: null, label: "Overall" },
  { key: "USA", label: "USA" },
  { key: "Hong Kong", label: "Hong Kong" },
  { key: "Kazakhstan", label: "Kazakhstan" },
  { key: "Europe", label: "Europe" },
] as const;

type Entry = {
  user_id: string;
  rank: number;
  is_public: boolean;
  full_name: string | null;
  school_name: string | null;
  grade_level: string | null;
  holistic_score: number | null;
};

type Stats = {
  avg_score: number | null;
  total_count: number;
  my_rank: number | null;
  my_score: number | null;
};

type PortfolioPreview = {
  user_id: string;
  full_name: string | null;
  school_name: string | null;
  grade_level: string | null;
  target_major: string | null;
  bio: string | null;
  gpa_unweighted: number | null;
  sat_score: number | null;
  act_score: number | null;
  unt_score: number | null;
  nuet_score: number | null;
  target_countries: string[] | null;
  holistic_score: number | null;
  summary: string | null;
  strengths: unknown;
  ap_exams: unknown;
  honors: unknown;
  extracurriculars: unknown;
};

function medal(rank: number) {
  if (rank === 1) return { label: "#1", className: "bg-amber-400 text-amber-950" };
  if (rank === 2) return { label: "#2", className: "bg-slate-300 text-slate-800" };
  if (rank === 3) return { label: "#3", className: "bg-orange-400 text-orange-950" };
  return { label: `#${rank}`, className: "bg-secondary text-muted-foreground" };
}

function displayName(full: string | null | undefined) {
  const value = (full ?? "").trim();
  return value || "Без имени";
}

function asList(value: unknown): Record<string, unknown>[] {
  return Array.isArray(value) ? (value as Record<string, unknown>[]) : [];
}

function LeaderboardPage() {
  const { user, loading: authLoading } = useAuth();
  const [country, setCountry] = useState<string | null>(null);
  const [rows, setRows] = useState<Entry[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [preview, setPreview] = useState<PortfolioPreview | null>(null);
  const [previewLoading, setPreviewLoading] = useState(false);

  const load = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    const [board, meta] = await Promise.all([
      supabase.rpc("get_leaderboard", { _country: country }),
      supabase.rpc("get_leaderboard_stats", { _country: country }),
    ]);
    if (!board.error) setRows((board.data as Entry[]) ?? []);
    const raw = Array.isArray(meta.data) ? meta.data[0] : meta.data;
    if (!meta.error && raw) {
      setStats({
        avg_score: raw.avg_score ?? null,
        total_count: Number(raw.total_count ?? 0),
        my_rank: raw.my_rank ?? null,
        my_score: raw.my_score ?? null,
      });
    } else {
      setStats(null);
    }
    setLoading(false);
  }, [user, country]);

  useEffect(() => {
    void load();
  }, [load]);

  async function openPublicProfile(entry: Entry) {
    if (!entry.is_public && entry.user_id !== user.id) return;
    setPreviewLoading(true);
    const { data, error } = await supabase.rpc("get_public_portfolio", {
      _user_id: entry.user_id,
    });
    setPreviewLoading(false);
    if (error || !data?.[0]) return;
    setPreview(data[0] as PortfolioPreview);
  }

  if (authLoading) {
    return (
      <div className="flex justify-center py-24">
        <Loader2 className="size-6 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="mx-auto max-w-md px-4 py-24 text-center">
        <h1 className="text-2xl font-bold">Лидерборд доступен участникам</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Войдите, чтобы увидеть рейтинг холистических баллов.
        </p>
        <Button asChild className="mt-6 rounded-full">
          <Link to="/auth">Войти / Регистрация</Link>
        </Button>
      </div>
    );
  }

  const total = stats?.total_count ?? 0;
  const showSticky =
    stats?.my_rank != null && stats.my_rank > 100 && stats.my_score != null;

  return (
    <div className={cn("mx-auto max-w-5xl px-4 py-12", showSticky && "pb-28")}>
      <div className="flex items-center gap-3">
        <span className="flex size-11 items-center justify-center rounded-2xl bg-primary/10 text-primary">
          <Trophy className="size-5" />
        </span>
        <div>
          <h1 className="text-4xl font-extrabold">Лидерборд</h1>
          <p className="text-sm text-muted-foreground">
            Топ-100 по холистическому баллу. Закрытые профили показывают только базовые данные.
          </p>
        </div>
      </div>

      <div className="mt-8 grid gap-3 sm:grid-cols-2">
        <div className="surface-card p-5">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Overall Average Holistic Score
          </p>
          <p className="mt-2 font-display text-3xl font-extrabold text-primary">
            {stats?.avg_score != null ? `${stats.avg_score}/100` : "—"}
          </p>
          <p className="mt-1 text-xs text-muted-foreground">
            Средний балл по выбранной категории
          </p>
        </div>
        <div className="surface-card p-5">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Your Score
          </p>
          <p className="mt-2 font-display text-3xl font-extrabold">
            {stats?.my_score != null ? `${stats.my_score}/100` : "—"}
          </p>
          <p className="mt-1 text-sm text-muted-foreground">
            {stats?.my_rank != null
              ? `Global Rank: #${stats.my_rank} out of ${total}+`
              : "Пройдите ИИ-оценку, чтобы попасть в рейтинг"}
          </p>
        </div>
      </div>

      <div className="mt-6 flex flex-wrap gap-2">
        {TABS.map((t) => (
          <button
            key={t.label}
            onClick={() => setCountry(t.key)}
            className={
              "rounded-full border px-4 py-1.5 text-sm font-medium transition-colors " +
              (country === t.key
                ? "border-primary bg-primary text-primary-foreground"
                : "border-border bg-card text-muted-foreground hover:bg-secondary")
            }
          >
            {t.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex justify-center py-16">
          <Loader2 className="size-6 animate-spin text-primary" />
        </div>
      ) : rows.length === 0 ? (
        <p className="mt-10 text-sm text-muted-foreground">
          Пока никто не прошёл ИИ-оценку для этого направления. Сделайте её первым на странице
          «ИИ-оценка».
        </p>
      ) : (
        <div className="surface-card mt-6 overflow-hidden p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-16">Rank</TableHead>
                <TableHead>Student</TableHead>
                <TableHead>School & Grade</TableHead>
                <TableHead>Holistic Score</TableHead>
                <TableHead className="text-right">Profile</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((r) => {
                const mine = r.user_id === user.id;
                const badge = medal(r.rank);
                return (
                  <TableRow
                    key={r.user_id}
                    className={cn(
                      r.is_public && "cursor-pointer",
                      mine && "bg-primary/5 hover:bg-primary/10",
                    )}
                    onClick={() => void openPublicProfile(r)}
                  >
                    <TableCell>
                      <span
                        className={cn(
                          "inline-flex min-w-10 items-center justify-center rounded-full px-2 py-1 text-xs font-bold",
                          badge.className,
                        )}
                      >
                        {badge.label}
                      </span>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2 font-semibold">
                        <span className="truncate">{displayName(r.full_name)}</span>
                        {mine && <Badge className="rounded-full">You</Badge>}
                      </div>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {[r.school_name, r.grade_level].filter(Boolean).join(" · ") || "—"}
                    </TableCell>
                    <TableCell>
                      <span className="inline-flex rounded-full bg-primary/10 px-3 py-1 text-sm font-bold text-primary">
                        {r.holistic_score ?? "—"}/100
                      </span>
                    </TableCell>
                    <TableCell className="text-right">
                      {r.is_public ? (
                        <Button
                          size="icon"
                          variant="ghost"
                          className="rounded-full"
                          aria-label="Open public profile"
                          onClick={(e) => {
                            e.stopPropagation();
                            void openPublicProfile(r);
                          }}
                        >
                          <UserRound className="size-4 text-primary" />
                        </Button>
                      ) : (
                        <span className="inline-flex size-9 items-center justify-center text-muted-foreground">
                          <Lock className="size-4" />
                        </span>
                      )}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      )}

      {showSticky && (
        <div className="fixed inset-x-0 bottom-0 z-30 border-t border-border bg-background/95 px-4 py-3 backdrop-blur-xl">
          <div className="mx-auto flex max-w-5xl items-center justify-between gap-3 text-sm font-semibold">
            <span>
              #{stats.my_rank} — You — {stats.my_score}/100
            </span>
            <span className="text-muted-foreground">из {total}+ в этой категории</span>
          </div>
        </div>
      )}

      <Dialog
        open={!!preview || previewLoading}
        onOpenChange={(o) => {
          if (!o) {
            setPreview(null);
            setPreviewLoading(false);
          }
        }}
      >
        <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-lg">
          {previewLoading && !preview ? (
            <div className="flex justify-center py-10">
              <Loader2 className="size-6 animate-spin text-primary" />
            </div>
          ) : preview ? (
            <PortfolioModal preview={preview} />
          ) : null}
        </DialogContent>
      </Dialog>
    </div>
  );
}

function PortfolioModal({ preview }: { preview: PortfolioPreview }) {
  const aps = asList(preview.ap_exams);
  const honors = asList(preview.honors);
  const ecs = asList(preview.extracurriculars);
  const strengths = Array.isArray(preview.strengths) ? preview.strengths : [];

  return (
    <>
      <DialogHeader>
        <DialogTitle className="flex items-center gap-2">
          <Globe2 className="size-4 text-primary" />
          {displayName(preview.full_name)}
        </DialogTitle>
        <DialogDescription>
          {[preview.school_name, preview.grade_level, preview.target_major]
            .filter(Boolean)
            .join(" · ")}
        </DialogDescription>
      </DialogHeader>
      <div className="flex items-baseline gap-2">
        <span className="text-4xl font-extrabold text-primary">
          {preview.holistic_score ?? "—"}
        </span>
        <span className="text-sm text-muted-foreground">/100 holistic score</span>
      </div>
      <div className="grid grid-cols-2 gap-2 text-sm sm:grid-cols-3">
        {[
          ["GPA", preview.gpa_unweighted],
          ["SAT", preview.sat_score],
          ["ACT", preview.act_score],
          ["ЕНТ", preview.unt_score],
          ["NUET", preview.nuet_score],
        ]
          .filter(([, v]) => v !== null && v !== undefined)
          .map(([k, v]) => (
            <div key={String(k)} className="rounded-xl bg-secondary px-3 py-2">
              <p className="text-xs text-muted-foreground">{String(k)}</p>
              <p className="font-semibold">{String(v)}</p>
            </div>
          ))}
      </div>
      {(preview.target_countries ?? []).length > 0 && (
        <div className="flex flex-wrap gap-2">
          {(preview.target_countries as string[]).map((c) => (
            <Badge key={c} variant="secondary" className="rounded-full">
              {c}
            </Badge>
          ))}
        </div>
      )}
      {preview.bio && <p className="text-sm text-muted-foreground">{preview.bio}</p>}
      {preview.summary && <p className="text-sm text-muted-foreground">{preview.summary}</p>}
      {strengths.length > 0 && (
        <div>
          <p className="text-sm font-semibold">Сильные стороны</p>
          <ul className="mt-1 list-disc space-y-1 pl-5 text-sm text-muted-foreground">
            {strengths.slice(0, 6).map((s, idx) => (
              <li key={idx}>{typeof s === "string" ? s : JSON.stringify(s)}</li>
            ))}
          </ul>
        </div>
      )}
      {aps.length > 0 && (
        <div>
          <p className="text-sm font-semibold">AP scores</p>
          <ul className="mt-2 space-y-1 text-sm text-muted-foreground">
            {aps.map((a, i) => (
              <li key={i}>
                {String(a.subject ?? "AP")}
                {a.score != null ? ` — ${String(a.score)}` : ""}
                {a.year != null ? ` (${String(a.year)})` : ""}
              </li>
            ))}
          </ul>
        </div>
      )}
      {honors.length > 0 && (
        <div>
          <p className="text-sm font-semibold">Olympiads</p>
          <ul className="mt-2 space-y-1 text-sm text-muted-foreground">
            {honors.map((h, i) => (
              <li key={i}>
                {[h.name, h.placement, h.level, h.year].filter(Boolean).map(String).join(" · ")}
              </li>
            ))}
          </ul>
        </div>
      )}
      {ecs.length > 0 && (
        <div>
          <p className="text-sm font-semibold">Extracurriculars & projects</p>
          <ul className="mt-2 space-y-3 text-sm">
            {ecs.map((x, i) => (
              <li key={i} className="rounded-xl bg-secondary px-3 py-2">
                <p className="font-semibold">
                  {[x.title, x.role].filter(Boolean).map(String).join(" — ")}
                </p>
                {Boolean(x.organization) && (
                  <p className="text-xs text-muted-foreground">{String(x.organization)}</p>
                )}
                {Boolean(x.description) && (
                  <p className="mt-1 text-muted-foreground">{String(x.description)}</p>
                )}
                {Boolean(x.key_impact) && (
                  <p className="mt-1 text-muted-foreground">Impact: {String(x.key_impact)}</p>
                )}
              </li>
            ))}
          </ul>
        </div>
      )}
    </>
  );
}
