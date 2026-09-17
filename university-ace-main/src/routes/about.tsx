import { createFileRoute } from "@tanstack/react-router";
import { Target, ShieldCheck, Globe2, Rocket } from "lucide-react";

export const Route = createFileRoute("/about")({
  head: () => ({
    meta: [
      { title: "О проекте — Studymaxxing" },
      {
        name: "description",
        content:
          "Миссия Studymaxxing: дать каждому школьнику доступ к элитному ИИ-консультированию по поступлению.",
      },
      { property: "og:title", content: "О проекте Studymaxxing" },
      {
        property: "og:description",
        content: "Элитное ИИ-консультирование по международным поступлениям для школьников.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: About,
});

const VALUES = [
  { icon: Target, title: "Честная оценка", text: "Никакого маркетинга — только реальная позиция на фоне 600+ профилей." },
  { icon: Globe2, title: "Четыре региона", text: "США, Гонконг, Казахстан и Европа — у каждого своя логика отбора." },
  { icon: ShieldCheck, title: "Ваши данные ваши", text: "Портфолио видно только вам: доступ защищён на уровне базы данных." },
  { icon: Rocket, title: "От оценки к действию", text: "Каждый пробел превращается в конкретный шаг с датой в календаре." },
];

function About() {
  return (
    <div className="mx-auto max-w-5xl px-4 py-16">
      <h1 className="text-4xl font-extrabold">О проекте</h1>
      <p className="mt-5 max-w-3xl text-lg leading-relaxed text-muted-foreground">
        Studymaxxing создан, чтобы школьник из любого города имел тот же уровень поддержки, что и
        ученик дорогой международной школы с личным admissions-консультантом. Мы объединяем
        подробное портфолио, глубокую ИИ-аналитику на базе Gemini и живой календарь дедлайнов в
        одном инструменте.
      </p>

      <div className="mt-12 grid gap-5 sm:grid-cols-2">
        {VALUES.map((v) => (
          <div key={v.title} className="surface-card p-7">
            <span className="flex size-11 items-center justify-center rounded-2xl bg-lime/20 text-lime-foreground">
              <v.icon className="size-5" />
            </span>
            <h2 className="mt-4 text-lg font-bold">{v.title}</h2>
            <p className="mt-2 text-sm text-muted-foreground">{v.text}</p>
          </div>
        ))}
      </div>

      <div className="surface-card mt-12 p-8">
        <h2 className="text-xl font-bold">Как это работает</h2>
        <ol className="mt-4 grid gap-3 text-sm text-muted-foreground">
          <li>1. Заполняете портфолио: GPA, целевой мейджор, AP-экзамены, олимпиады, активности.</li>
          <li>2. Получаете холистический балл и вероятности поступления по каждой стране.</li>
          <li>3. ИИ строит дорожную карту с датами и добавляет задачи в календарь.</li>
          <li>4. Studymax AI помогает с эссе и стратегией в любой момент.</li>
        </ol>
      </div>
    </div>
  );
}
