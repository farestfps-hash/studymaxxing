import { Link } from "@tanstack/react-router";

export function SiteFooter() {
  return (
    <footer className="mt-24 border-t border-border bg-card/60">
      <div className="mx-auto grid max-w-7xl gap-8 px-4 py-12 sm:grid-cols-3">
        <div>
          <p className="font-display text-lg font-bold">Studymaxxing</p>
          <p className="mt-2 text-sm text-muted-foreground">
            Join&amp;Acquire — ИИ-платформа для поступления в университеты мира.
          </p>
        </div>
        <div className="text-sm">
          <p className="font-semibold">Разделы</p>
          <div className="mt-3 grid gap-2 text-muted-foreground">
            <Link to="/evaluator" className="hover:text-foreground">
              ИИ-оценка шансов
            </Link>
            <Link to="/portfolio" className="hover:text-foreground">
              Портфолио &amp; AP
            </Link>
            <Link to="/roadmap" className="hover:text-foreground">
              Дорожная карта и календарь
            </Link>
            <Link to="/leaderboard" className="hover:text-foreground">
              Лидерборд
            </Link>
          </div>
        </div>
        <div className="text-sm">
          <p className="font-semibold">Контакты</p>
          <div className="mt-3 grid gap-2 text-muted-foreground">
            <a href="tel:+77780054070" className="hover:text-foreground">
              +7 778 005 40 70
            </a>
            <a href="mailto:farestfps@gmail.com" className="hover:text-foreground">
              farestfps@gmail.com
            </a>
            <span>Атырау, Казахстан</span>
          </div>
        </div>
      </div>
      <div className="border-t border-border py-5 text-center text-xs text-muted-foreground">
        © {new Date().getFullYear()} Studymaxxing. Join&amp;Acquire.
      </div>
    </footer>
  );
}
