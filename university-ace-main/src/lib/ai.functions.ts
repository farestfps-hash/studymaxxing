import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const GATEWAY = "https://ai.gateway.lovable.dev/v1/chat/completions";
const MODEL = "google/gemini-3.8-flash";

type ChatMessage = { role: "system" | "user" | "assistant"; content: string };

async function callGemini(messages: ChatMessage[]): Promise<string> {
  const apiKey = process.env["LOVABLE_API_KEY"];
  if (!apiKey) throw new Error("AI is not configured yet.");

  const res = await fetch(GATEWAY, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Lovable-API-Key": apiKey,
    },
    body: JSON.stringify({ model: MODEL, messages }),
  });

  if (!res.ok) {
    const text = await res.text();
    if (res.status === 429) throw new Error("Слишком много запросов. Попробуйте через минуту.");
    if (res.status === 402) throw new Error("Закончились AI-кредиты рабочего пространства.");
    throw new Error(`AI error ${res.status}: ${text.slice(0, 300)}`);
  }

  const data = (await res.json()) as {
    choices?: Array<{ message?: { content?: string } }>;
  };
  return data.choices?.[0]?.message?.content ?? "";
}

function parseJson<T>(raw: string): T {
  const cleaned = raw
    .replace(/^```(?:json)?/i, "")
    .replace(/```$/, "")
    .trim();
  const start = cleaned.indexOf("{");
  const end = cleaned.lastIndexOf("}");
  const slice = start >= 0 && end > start ? cleaned.slice(start, end + 1) : cleaned;
  return JSON.parse(slice) as T;
}

type Supa = { from: (t: string) => any };

async function loadBundle(supabase: Supa, userId: string) {
  const [profile, aps, honors, ecs] = await Promise.all([
    supabase.from("profiles").select("*").eq("id", userId).maybeSingle(),
    supabase.from("ap_exams").select("*").eq("user_id", userId),
    supabase.from("olympiads_honors").select("*").eq("user_id", userId),
    supabase.from("extracurriculars").select("*").eq("user_id", userId),
  ]);
  return {
    profile: profile.data ?? {},
    ap_exams: aps.data ?? [],
    olympiads_honors: honors.data ?? [],
    extracurriculars: ecs.data ?? [],
  };
}

function bundleText(bundle: Awaited<ReturnType<typeof loadBundle>>) {
  return JSON.stringify(bundle, null, 2);
}

const EVAL_SYSTEM = `Ты — элитный консультант по международным поступлениям (Studymax AI, на базе Gemini).
В оценке учитывай стандартизированные тесты из профиля: SAT (200-1600), ACT (1-36), ЕНТ/UNT (0-140), NUET, а также годовой бюджет (annual_budget, budget_currency) и флаг needs_full_aid (если true — оценивай только реалистичные варианты с полной финансовой помощью или грантом). Высокие баллы SAT/ACT повышают шансы для USA и Hong Kong, ЕНТ — для Казахстана.
Оцениваешь профиль школьника по странам: USA (холистическая оценка: строгость AP, глубина лидерства, соответствие активностей мейджору, уникальный нарратив), Hong Kong (количественная строгость: GPA, соответствие AP профилю, минимум 3-4 AP с баллами 4-5, английский), Kazakhstan (олимпиады, GPA, шансы на грант и топ-вузы РК), Europe (эквивалентность AP, пороги GPA, соответствие пререквизитам бакалавриата).
Отвечай СТРОГО валидным JSON без markdown, на русском языке.
Схема:
{
 "holistic_score": число 0-100,
 "summary": "2-4 предложения",
 "countries": [{"country":"USA","probability": число 0-100,"classification":"Safety|Match|Reach","comment":"..." }],
 "strengths": ["..."],
 "gaps": ["..."],
 "missing_items": ["..."],
 "benchmark": {"percentile": число 0-100, "comment":"позиция на фоне 600+ кандидатов прошлых лет"}
}`;

export const evaluateProfile = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context as { supabase: Supa; userId: string };
    const bundle = await loadBundle(supabase, userId);

    const raw = await callGemini([
      { role: "system", content: EVAL_SYSTEM },
      {
        role: "user",
        content: `Профиль абитуриента:\n${bundleText(bundle)}\n\nОцени профиль по каждой из выбранных целевых стран (если страны не указаны — оцени все четыре).`,
      },
    ]);

    const parsed = parseJson<{
      holistic_score: number;
      summary: string;
      countries: unknown[];
      strengths: string[];
      gaps: string[];
      missing_items: string[];
      benchmark: Record<string, unknown>;
    }>(raw);

    const row = {
      user_id: userId,
      holistic_score: Math.round(Number(parsed.holistic_score) || 0),
      summary: parsed.summary ?? "",
      countries: parsed.countries ?? [],
      strengths: parsed.strengths ?? [],
      gaps: parsed.gaps ?? [],
      missing_items: parsed.missing_items ?? [],
      benchmark: parsed.benchmark ?? {},
    };

    const { data, error } = await (supabase.from("ai_evaluations") as any)
      .insert(row)
      .select()
      .single();
    if (error) throw new Error(error.message);
    return data;
  });

export const generateRoadmap = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context as { supabase: Supa; userId: string };
    const bundle = await loadBundle(supabase, userId);
    const today = new Date().toISOString().slice(0, 10);

    const raw = await callGemini([
      {
        role: "system",
        content: `Ты — Studymax AI. Составляешь персональную дорожную карту поступления. Сегодня ${today}.
Отвечай СТРОГО валидным JSON без markdown, на русском.
Схема: {"steps":[{"title":"...","due_date":"YYYY-MM-DD","category":"Академика|Тесты|Активности|Документы|Дедлайн","description":"1-2 предложения","priority":"high|medium|low"}]}
От 8 до 14 шагов, отсортированных по дате.`,
      },
      {
        role: "user",
        content: `Профиль:\n${bundleText(bundle)}\n\nСоставь дорожную карту с учётом пробелов в профиле и целевых стран.`,
      },
    ]);

    const parsed = parseJson<{ steps: unknown[] }>(raw);
    const { data, error } = await (supabase.from("roadmaps") as any)
      .insert({ user_id: userId, steps: parsed.steps ?? [] })
      .select()
      .single();
    if (error) throw new Error(error.message);
    return data;
  });

export const studymaxChat = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z
      .object({
        messages: z.array(
          z.object({
            role: z.enum(["user", "assistant"]),
            content: z.string().min(1).max(6000),
          }),
        ),
      })
      .parse(input),
  )
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context as { supabase: Supa; userId: string };
    const bundle = await loadBundle(supabase, userId);

    const reply = await callGemini([
      {
        role: "system",
        content: `Ты — Studymax AI, дружелюбный, но требовательный консультант по поступлению в зарубежные университеты (на базе Gemini).
У тебя есть доступ к профилю пользователя. Помогай писать эссе и personal statement, давай стратегические советы по усилению слабых мест портфолио, отвечай на вопросы о поступлении в вузы США, Гонконга, Казахстана и Европы.
Отвечай кратко и по делу, на языке пользователя. Используй markdown-списки, когда это уместно.
Профиль пользователя (JSON):\n${bundleText(bundle)}`,
      },
      ...(data.messages as ChatMessage[]),
    ]);

    return { reply };
  });

export const matchUniversities = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z.object({ catalog: z.array(z.string()).max(60) }).parse(input),
  )
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context as { supabase: Supa; userId: string };
    const bundle = await loadBundle(supabase, userId);

    const raw = await callGemini([
      {
        role: "system",
        content: `Ты — Studymax AI, эксперт по международным поступлениям.
Учитывай GPA, AP, олимпиады, активности, стандартизированные тесты (SAT 200-1600, ACT 1-36, ЕНТ/UNT 0-140, NUET) и годовой бюджет на обучение (annual_budget, budget_currency, needs_full_aid — если true, приоритет вузам с полной финансовой помощью или грантом).
Отвечай СТРОГО валидным JSON без markdown, на русском.
Схема: {"matches":[{"university":"точное название из списка","country":"USA|Hong Kong|Kazakhstan|Europe","probability": число 0-100,"classification":"Safety|Match|Reach","reason":"1-2 предложения","budget_fit":"комментарий по бюджету и финпомощи"}],"advice":"2-3 предложения общей стратегии"}
Выбери 9-12 вузов, распределив их по целевым странам абитуриента и по категориям Safety/Match/Reach.`,
      },
      {
        role: "user",
        content: `Профиль:\n${bundleText(bundle)}\n\nДоступный каталог вузов:\n${data.catalog.join("\n")}`,
      },
    ]);

    const parsed = parseJson<{ matches: Array<Record<string, string | number>>; advice: string }>(
      raw,
    );
    return { matches: parsed.matches ?? [], advice: parsed.advice ?? "" };
  });
