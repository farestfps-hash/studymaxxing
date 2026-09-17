import { createFileRoute, Link } from "@tanstack/react-router";
import { useCallback, useEffect, useState } from "react";
import { Plus, Trash2, Loader2, Globe2, Lock } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export const Route = createFileRoute("/portfolio")({
  head: () => ({
    meta: [
      { title: "Портфолио и AP-экзамены — Studymaxxing" },
      {
        name: "description",
        content:
          "Заполните GPA, целевой мейджор, AP-экзамены, олимпиады и внеклассные активности для ИИ-оценки.",
      },
      { property: "og:title", content: "Портфолио & AP — Studymaxxing" },
      {
        property: "og:description",
        content: "Конструктор портфолио абитуриента: GPA, AP, олимпиады, активности и лидерство.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Portfolio,
});

const COUNTRIES = ["USA", "Hong Kong", "Kazakhstan", "Europe"];
const AP_SUBJECTS = [
  "AP Computer Science A",
  "AP Computer Science Principles",
  "AP Calculus AB",
  "AP Calculus BC",
  "AP Statistics",
  "AP Physics 1",
  "AP Physics 2",
  "AP Physics C: Mechanics",
  "AP Chemistry",
  "AP Biology",
  "AP Macroeconomics",
  "AP Microeconomics",
  "AP English Language",
  "AP English Literature",
  "AP World History",
  "AP Psychology",
];
const LEVELS = ["School", "Regional", "National", "International"];
const PLACEMENTS = ["1st place", "2nd place", "3rd place", "Honorable Mention", "Participant"];

/* eslint-disable @typescript-eslint/no-explicit-any */
type Row = any;

function AuthGate() {
  return (
    <div className="mx-auto max-w-md px-4 py-24 text-center">
      <h1 className="text-2xl font-bold">Нужен аккаунт</h1>
      <p className="mt-2 text-sm text-muted-foreground">
        Войдите, чтобы сохранить портфолио и получить ИИ-оценку.
      </p>
      <Button asChild className="mt-6 rounded-full">
        <Link to="/auth">Войти / Регистрация</Link>
      </Button>
    </div>
  );
}

function Portfolio() {
  const { user, loading } = useAuth();
  const [profile, setProfile] = useState<Row>({ target_countries: [] });
  const [aps, setAps] = useState<Row[]>([]);
  const [honors, setHonors] = useState<Row[]>([]);
  const [ecs, setEcs] = useState<Row[]>([]);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    if (!user) return;
    const [p, a, h, e] = await Promise.all([
      supabase.from("profiles").select("*").eq("id", user.id).maybeSingle(),
      supabase.from("ap_exams").select("*").eq("user_id", user.id).order("created_at"),
      supabase.from("olympiads_honors").select("*").eq("user_id", user.id).order("created_at"),
      supabase.from("extracurriculars").select("*").eq("user_id", user.id).order("created_at"),
    ]);
    setProfile(p.data ?? { id: user.id, target_countries: [] });
    setAps(a.data ?? []);
    setHonors(h.data ?? []);
    setEcs(e.data ?? []);
  }, [user]);

  useEffect(() => {
    void load();
  }, [load]);

  if (loading) {
    return (
      <div className="flex justify-center py-24">
        <Loader2 className="size-6 animate-spin text-primary" />
      </div>
    );
  }
  if (!user) return <AuthGate />;

  async function saveProfile() {
    if (!user) return;
    setSaving(true);
    const payload = {
      id: user.id,
      full_name: profile.full_name ?? null,
      high_school: profile.high_school ?? profile.school_name ?? null,
      school_name: profile.school_name ?? profile.high_school ?? null,
      grade_level: profile.grade_level ?? null,
      gpa_unweighted: profile.gpa_unweighted ? Number(profile.gpa_unweighted) : null,
      gpa_weighted: profile.gpa_weighted ? Number(profile.gpa_weighted) : null,
      gpa_scale: profile.gpa_scale ?? "4.0",
      target_major: profile.target_major ?? null,
      target_countries: profile.target_countries ?? [],
      english_test: profile.english_test ?? null,
      english_score: profile.english_score ?? null,
      sat_score: profile.sat_score ? Number(profile.sat_score) : null,
      act_score: profile.act_score ? Number(profile.act_score) : null,
      unt_score: profile.unt_score ? Number(profile.unt_score) : null,
      nuet_score: profile.nuet_score ? Number(profile.nuet_score) : null,
      annual_budget: profile.annual_budget ? Number(profile.annual_budget) : null,
      budget_currency: profile.budget_currency ?? "USD",
      needs_full_aid: Boolean(profile.needs_full_aid),
      bio: profile.bio ?? null,
      is_profile_public: profile.is_profile_public !== false,
      portfolio_public: profile.is_profile_public !== false,
    };
    const { error } = await supabase.from("profiles").upsert(payload);
    setSaving(false);
    if (error) {
      toast.error("Не удалось сохранить: " + error.message);
    } else {
      toast.success("Академический профиль сохранён");
    }
  }

  async function addRow(table: string, values: Row) {
    if (!user) return;
    const { data, error } = await supabase
      .from(table as never)
      .insert({ ...values, user_id: user.id } as never)
      .select()
      .single();
    if (error) {
      toast.error(error.message);
      return;
    }
    if (table === "ap_exams") setAps((r) => [...r, data as Row]);
    if (table === "olympiads_honors") setHonors((r) => [...r, data as Row]);
    if (table === "extracurriculars") setEcs((r) => [...r, data as Row]);
  }

  async function updateRow(table: string, id: string, values: Row) {
    const { error } = await supabase
      .from(table as never)
      .update(values as never)
      .eq("id", id);
    if (error) toast.error(error.message);
  }

  async function deleteRow(table: string, id: string) {
    const { error } = await supabase
      .from(table as never)
      .delete()
      .eq("id", id);
    if (error) {
      toast.error(error.message);
      return;
    }
    if (table === "ap_exams") setAps((r) => r.filter((x) => x.id !== id));
    if (table === "olympiads_honors") setHonors((r) => r.filter((x) => x.id !== id));
    if (table === "extracurriculars") setEcs((r) => r.filter((x) => x.id !== id));
  }

  function toggleCountry(c: string) {
    const list: string[] = profile.target_countries ?? [];
    setProfile({
      ...profile,
      target_countries: list.includes(c) ? list.filter((x) => x !== c) : [...list, c],
    });
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-12">
      <h1 className="text-4xl font-extrabold">Портфолио &amp; AP</h1>
      <p className="mt-2 text-muted-foreground">
        Чем подробнее данные, тем точнее ИИ-оценка шансов поступления.
      </p>

      <section className="surface-card mt-8 flex flex-col gap-4 p-7 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-start gap-3">
          <span className="mt-0.5 flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
            {profile.is_profile_public !== false ? (
              <Globe2 className="size-5" />
            ) : (
              <Lock className="size-5" />
            )}
          </span>
          <div>
            <h2 className="text-lg font-bold">Open Profile to Public Leaderboard</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Если профиль открыт, другие участники могут открыть ваше портфолио с лидерборда.
              Закрытый профиль показывает только имя, школу, класс и холистический балл.
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3 self-start sm:self-center">
          <span className="text-sm font-medium text-muted-foreground">
            {profile.is_profile_public !== false ? "Public" : "Private"}
          </span>
          <Switch
            checked={profile.is_profile_public !== false}
            onCheckedChange={async (checked) => {
              setProfile({ ...profile, is_profile_public: checked });
              if (!user) return;
              const { error } = await supabase
                .from("profiles")
                .upsert({
                  id: user.id,
                  is_profile_public: checked,
                  portfolio_public: checked,
                });
              if (error) {
                toast.error("Не удалось обновить видимость: " + error.message);
              } else {
                toast.success(
                  checked ? "Профиль открыт в лидерборде" : "Профиль скрыт от подробного просмотра",
                );
              }
            }}
            aria-label="Open Profile to Public Leaderboard"
          />
        </div>
      </section>

      <Tabs defaultValue="academics" className="mt-8">
        <TabsList className="rounded-full">
          <TabsTrigger value="academics" className="rounded-full">
            Академика &amp; AP
          </TabsTrigger>
          <TabsTrigger value="honors" className="rounded-full">
            Олимпиады
          </TabsTrigger>
          <TabsTrigger value="ecs" className="rounded-full">
            Активности
          </TabsTrigger>
        </TabsList>

        {/* Academics */}
        <TabsContent value="academics" className="mt-6 grid gap-6">
          <section className="surface-card grid gap-4 p-7">
            <h2 className="text-lg font-bold">Академический профиль</h2>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Имя и фамилия">
                <Input
                  value={profile.full_name ?? ""}
                  onChange={(e) => setProfile({ ...profile, full_name: e.target.value })}
                />
              </Field>
              <Field label="Школа">
                <Input
                  value={profile.high_school ?? profile.school_name ?? ""}
                  onChange={(e) =>
                    setProfile({
                      ...profile,
                      high_school: e.target.value,
                      school_name: e.target.value,
                    })
                  }
                />
              </Field>
              <Field label="Класс / Grade">
                <Input
                  value={profile.grade_level ?? ""}
                  onChange={(e) => setProfile({ ...profile, grade_level: e.target.value })}
                />
              </Field>
              <Field label="Целевой мейджор">
                <Input
                  placeholder="Computer Science, Robotics, Finance..."
                  value={profile.target_major ?? ""}
                  onChange={(e) => setProfile({ ...profile, target_major: e.target.value })}
                />
              </Field>
              <Field label="GPA Unweighted">
                <Input
                  type="number"
                  step="0.01"
                  value={profile.gpa_unweighted ?? ""}
                  onChange={(e) => setProfile({ ...profile, gpa_unweighted: e.target.value })}
                />
              </Field>
              <Field label="GPA Weighted">
                <Input
                  type="number"
                  step="0.01"
                  value={profile.gpa_weighted ?? ""}
                  onChange={(e) => setProfile({ ...profile, gpa_weighted: e.target.value })}
                />
              </Field>
              <Field label="Шкала GPA">
                <Select
                  value={profile.gpa_scale ?? "4.0"}
                  onValueChange={(v) => setProfile({ ...profile, gpa_scale: v })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="4.0">4.0</SelectItem>
                    <SelectItem value="5.0">5.0</SelectItem>
                  </SelectContent>
                </Select>
              </Field>
              <Field label="Экзамен по английскому">
                <Input
                  placeholder="IELTS / TOEFL / Duolingo"
                  value={profile.english_test ?? ""}
                  onChange={(e) => setProfile({ ...profile, english_test: e.target.value })}
                />
              </Field>
              <Field label="Балл по английскому">
                <Input
                  value={profile.english_score ?? ""}
                  onChange={(e) => setProfile({ ...profile, english_score: e.target.value })}
                />
              </Field>
            </div>

            <div>
              <Label className="text-sm font-semibold">Стандартизированные тесты</Label>
              <p className="mt-1 text-xs text-muted-foreground">
                Все поля необязательны — заполняйте только сданные экзамены.
              </p>
              <div className="mt-3 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <Field label="SAT (200–1600)">
                  <Input
                    type="number"
                    min={200}
                    max={1600}
                    placeholder="1540"
                    value={profile.sat_score ?? ""}
                    onChange={(e) => setProfile({ ...profile, sat_score: e.target.value })}
                  />
                </Field>
                <Field label="ACT (1–36)">
                  <Input
                    type="number"
                    min={1}
                    max={36}
                    placeholder="34"
                    value={profile.act_score ?? ""}
                    onChange={(e) => setProfile({ ...profile, act_score: e.target.value })}
                  />
                </Field>
                <Field label="ЕНТ / UNT (0–140)">
                  <Input
                    type="number"
                    min={0}
                    max={140}
                    placeholder="125"
                    value={profile.unt_score ?? ""}
                    onChange={(e) => setProfile({ ...profile, unt_score: e.target.value })}
                  />
                </Field>
                <Field label="NUET">
                  <Input
                    type="number"
                    placeholder="Балл"
                    value={profile.nuet_score ?? ""}
                    onChange={(e) => setProfile({ ...profile, nuet_score: e.target.value })}
                  />
                </Field>
              </div>
            </div>

            <div>
              <Label className="text-sm font-semibold">Бюджет на обучение</Label>
              <p className="mt-1 text-xs text-muted-foreground">
                Годовой бюджет — ИИ подберёт вузы с подходящей финансовой помощью.
              </p>
              <div className="mt-3 grid gap-4 sm:grid-cols-[1fr_140px]">
                <Field label="Сумма в год">
                  <Input
                    type="number"
                    min={0}
                    placeholder="25000"
                    value={profile.annual_budget ?? ""}
                    onChange={(e) => setProfile({ ...profile, annual_budget: e.target.value })}
                  />
                </Field>
                <Field label="Валюта">
                  <Select
                    value={profile.budget_currency ?? "USD"}
                    onValueChange={(v) => setProfile({ ...profile, budget_currency: v })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="USD">USD</SelectItem>
                      <SelectItem value="KZT">KZT</SelectItem>
                    </SelectContent>
                  </Select>
                </Field>
              </div>
              <label className="mt-3 flex cursor-pointer items-center gap-2.5 text-sm">
                <Checkbox
                  checked={Boolean(profile.needs_full_aid)}
                  onCheckedChange={(v) => setProfile({ ...profile, needs_full_aid: v === true })}
                />
                Нужна полная финансовая помощь / грант
              </label>
            </div>

            <div>
              <Label className="text-sm">Целевые страны</Label>
              <div className="mt-2 flex flex-wrap gap-2">
                {COUNTRIES.map((c) => {
                  const active = (profile.target_countries ?? []).includes(c);
                  return (
                    <button
                      key={c}
                      type="button"
                      onClick={() => toggleCountry(c)}
                      className={
                        "rounded-full border px-4 py-1.5 text-sm font-medium transition-colors " +
                        (active
                          ? "border-primary bg-primary text-primary-foreground"
                          : "border-border bg-card text-muted-foreground hover:bg-secondary")
                      }
                    >
                      {c}
                    </button>
                  );
                })}
              </div>
            </div>

            <Field label="О себе / нарратив">
              <Textarea
                rows={4}
                value={profile.bio ?? ""}
                onChange={(e) => setProfile({ ...profile, bio: e.target.value })}
              />
            </Field>

            <Button className="w-fit rounded-full" onClick={saveProfile} disabled={saving}>
              {saving ? "Сохранение..." : "Сохранить профиль"}
            </Button>
          </section>

          <section className="surface-card p-7">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold">AP-экзамены</h2>
              <Button
                size="sm"
                variant="outline"
                className="rounded-full"
                onClick={() =>
                  addRow("ap_exams", {
                    subject: AP_SUBJECTS[0],
                    score: null,
                    year: new Date().getFullYear(),
                    status: "taken",
                  })
                }
              >
                <Plus className="mr-1 size-4" /> Добавить
              </Button>
            </div>
            <div className="mt-4 grid gap-3">
              {aps.length === 0 && (
                <p className="text-sm text-muted-foreground">Пока нет AP-экзаменов.</p>
              )}
              {aps.map((row) => (
                <div
                  key={row.id}
                  className="grid gap-3 rounded-2xl border border-border p-4 sm:grid-cols-[2fr_1fr_1fr_1fr_auto]"
                >
                  <Select
                    defaultValue={row.subject}
                    onValueChange={(v) => updateRow("ap_exams", row.id, { subject: v })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {AP_SUBJECTS.map((s) => (
                        <SelectItem key={s} value={s}>
                          {s}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Input
                    type="number"
                    min={1}
                    max={5}
                    placeholder="Балл"
                    defaultValue={row.score ?? ""}
                    onBlur={(e) =>
                      updateRow("ap_exams", row.id, {
                        score: e.target.value ? Number(e.target.value) : null,
                      })
                    }
                  />
                  <Input
                    type="number"
                    placeholder="Год"
                    defaultValue={row.year ?? ""}
                    onBlur={(e) =>
                      updateRow("ap_exams", row.id, {
                        year: e.target.value ? Number(e.target.value) : null,
                      })
                    }
                  />
                  <Select
                    defaultValue={row.status}
                    onValueChange={(v) => updateRow("ap_exams", row.id, { status: v })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="taken">Сдан</SelectItem>
                      <SelectItem value="planned">Планируется</SelectItem>
                    </SelectContent>
                  </Select>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => deleteRow("ap_exams", row.id)}
                    aria-label="Удалить"
                  >
                    <Trash2 className="size-4 text-destructive" />
                  </Button>
                </div>
              ))}
            </div>
          </section>
        </TabsContent>

        {/* Honors */}
        <TabsContent value="honors" className="mt-6">
          <section className="surface-card p-7">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold">Олимпиады и награды</h2>
              <Button
                size="sm"
                variant="outline"
                className="rounded-full"
                onClick={() =>
                  addRow("olympiads_honors", {
                    name: "",
                    year: new Date().getFullYear(),
                    level: "Regional",
                    placement: "1st place",
                    subject: "",
                  })
                }
              >
                <Plus className="mr-1 size-4" /> Добавить
              </Button>
            </div>
            <div className="mt-4 grid gap-3">
              {honors.length === 0 && (
                <p className="text-sm text-muted-foreground">Пока нет достижений.</p>
              )}
              {honors.map((row) => (
                <div
                  key={row.id}
                  className="grid gap-3 rounded-2xl border border-border p-4 sm:grid-cols-[2fr_1fr_1fr_1fr_1fr_auto]"
                >
                  <Input
                    placeholder="Название олимпиады"
                    defaultValue={row.name ?? ""}
                    onBlur={(e) => updateRow("olympiads_honors", row.id, { name: e.target.value })}
                  />
                  <Input
                    type="number"
                    placeholder="Год"
                    defaultValue={row.year ?? ""}
                    onBlur={(e) =>
                      updateRow("olympiads_honors", row.id, {
                        year: e.target.value ? Number(e.target.value) : null,
                      })
                    }
                  />
                  <Select
                    defaultValue={row.level ?? "Regional"}
                    onValueChange={(v) => updateRow("olympiads_honors", row.id, { level: v })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {LEVELS.map((l) => (
                        <SelectItem key={l} value={l}>
                          {l}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Select
                    defaultValue={row.placement ?? "1st place"}
                    onValueChange={(v) => updateRow("olympiads_honors", row.id, { placement: v })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {PLACEMENTS.map((p) => (
                        <SelectItem key={p} value={p}>
                          {p}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Input
                    placeholder="Предмет"
                    defaultValue={row.subject ?? ""}
                    onBlur={(e) =>
                      updateRow("olympiads_honors", row.id, { subject: e.target.value })
                    }
                  />
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => deleteRow("olympiads_honors", row.id)}
                    aria-label="Удалить"
                  >
                    <Trash2 className="size-4 text-destructive" />
                  </Button>
                </div>
              ))}
            </div>
          </section>
        </TabsContent>

        {/* Extracurriculars */}
        <TabsContent value="ecs" className="mt-6">
          <section className="surface-card p-7">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold">Активности и лидерство (до 10)</h2>
              <Button
                size="sm"
                variant="outline"
                className="rounded-full"
                disabled={ecs.length >= 10}
                onClick={() =>
                  addRow("extracurriculars", {
                    title: "",
                    organization: "",
                    role: "",
                    years_active: "",
                    hours_per_week: null,
                    description: "",
                    key_impact: "",
                  })
                }
              >
                <Plus className="mr-1 size-4" /> Добавить
              </Button>
            </div>
            <div className="mt-4 grid gap-4">
              {ecs.length === 0 && (
                <p className="text-sm text-muted-foreground">Пока нет активностей.</p>
              )}
              {ecs.map((row, i) => (
                <div key={row.id} className="rounded-2xl border border-border p-5">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold uppercase text-muted-foreground">
                      Активность {i + 1}
                    </span>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => deleteRow("extracurriculars", row.id)}
                      aria-label="Удалить"
                    >
                      <Trash2 className="size-4 text-destructive" />
                    </Button>
                  </div>
                  <div className="mt-3 grid gap-3 sm:grid-cols-2">
                    <Input
                      placeholder="Название активности"
                      defaultValue={row.title ?? ""}
                      onBlur={(e) =>
                        updateRow("extracurriculars", row.id, { title: e.target.value })
                      }
                    />
                    <Input
                      placeholder="Организация"
                      defaultValue={row.organization ?? ""}
                      onBlur={(e) =>
                        updateRow("extracurriculars", row.id, { organization: e.target.value })
                      }
                    />
                    <Input
                      placeholder="Роль (Co-Founder, Lead Coder...)"
                      defaultValue={row.role ?? ""}
                      onBlur={(e) =>
                        updateRow("extracurriculars", row.id, { role: e.target.value })
                      }
                    />
                    <Input
                      placeholder="Период (2023–2025)"
                      defaultValue={row.years_active ?? ""}
                      onBlur={(e) =>
                        updateRow("extracurriculars", row.id, { years_active: e.target.value })
                      }
                    />
                    <Input
                      type="number"
                      step="0.5"
                      placeholder="Часов в неделю"
                      defaultValue={row.hours_per_week ?? ""}
                      onBlur={(e) =>
                        updateRow("extracurriculars", row.id, {
                          hours_per_week: e.target.value ? Number(e.target.value) : null,
                        })
                      }
                    />
                  </div>
                  <Textarea
                    className="mt-3"
                    rows={2}
                    placeholder="Описание деятельности"
                    defaultValue={row.description ?? ""}
                    onBlur={(e) =>
                      updateRow("extracurriculars", row.id, { description: e.target.value })
                    }
                  />
                  <Textarea
                    className="mt-3"
                    rows={2}
                    placeholder="Ключевой результат / impact"
                    defaultValue={row.key_impact ?? ""}
                    onBlur={(e) =>
                      updateRow("extracurriculars", row.id, { key_impact: e.target.value })
                    }
                  />
                </div>
              ))}
            </div>
          </section>
        </TabsContent>
      </Tabs>

      <div className="mt-10 flex flex-wrap gap-3">
        <Button asChild className="rounded-full">
          <Link to="/evaluator">Перейти к ИИ-оценке</Link>
        </Button>
        <Button asChild variant="outline" className="rounded-full">
          <Link to="/roadmap">Дорожная карта</Link>
        </Button>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="grid gap-2">
      <Label className="text-sm">{label}</Label>
      {children}
    </div>
  );
}
