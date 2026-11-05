"use client";
import { useState, type MouseEvent } from "react";
import { flushSync } from "react-dom";
import Link from "@/components/feedback-link";
import {
  BookOpen,
  Search,
  Printer,
  ArrowUpRight,
  Lightbulb,
  ChevronRight,
  FileCheck2,
  Send,
  UserRound,
  ListChecks,
  Wallet,
  FolderOpen,
  CalendarDays,
  ChartNoAxesCombined,
  Archive,
  Users,
} from "lucide-react";
import { searchManualChapters, type ManualGuide } from "@/lib/manual-types";
import type { Locale } from "@/lib/domain";
import { version } from "../../package.json";
export function ManualView({
  locale,
  guide,
  backHref,
}: {
  locale: Locale;
  guide: ManualGuide;
  backHref: string;
}) {
  const manualChapters = guide.chapters;
  const manualFormSteps = guide.journey;
  const manualUpdatedDate = guide.updated;
  const es = locale === "es";
  const i = es ? 0 : 1;
  const [query, setQuery] = useState("");
  function navigateChapter(event: MouseEvent<HTMLAnchorElement>, id: string) {
    if (event.ctrlKey || event.metaKey || event.shiftKey || event.altKey)
      return;
    event.preventDefault();
    flushSync(() => setQuery(""));
    window.history.pushState(null, "", `#${id}`);
    // Scroll after filtered chapters have rejoined layout; native anchor timing
    // can otherwise land below the requested chapter after a no-results search.
    requestAnimationFrame(() => {
      const chapter = document.getElementById(id);
      chapter?.focus({ preventScroll: true });
      chapter?.scrollIntoView({ behavior: "instant", block: "start" });
    });
  }
  const chapters = searchManualChapters(manualChapters, query, i);
  const iconMap = {
    user: UserRound,
    book: BookOpen,
    wallet: Wallet,
    checks: ListChecks,
    file: FileCheck2,
    send: Send,
    folder: FolderOpen,
    calendar: CalendarDays,
    search: Search,
    chart: ChartNoAxesCombined,
    archive: Archive,
    users: Users,
  };
  const icons = guide.icons.map((name) => iconMap[name]);
  return (
    <div className="manual">
      <header className="module-heading">
        <h1>{guide.title[i]}</h1>
      </header>
      <section className="manual-hero">
        <div className="manual-hero-copy">
          <span className="manual-kicker">
            <BookOpen size={18} />
            {guide.kicker[i]}
          </span>
          <h2>{guide.headline[i]}</h2>
          <div className="manual-lead">{guide.lead[i]}</div>
          <div className="manual-meta">
            {guide.audience[i]}
            {es ? " · Actualizado: " : " · Updated: "}
            {manualUpdatedDate[i]} · v{version}
          </div>
        </div>
        <div className="manual-hero-art" aria-hidden="true">
          <div className="manual-orbit" />
          <BookOpen size={74} strokeWidth={1.25} />
        </div>
      </section>
      <ol className="manual-journey">
        {manualFormSteps.map((step, n) => {
          const Icon = icons[n];
          return (
            <li key={step[2]}>
              <a
                href={`#${step[2]}`}
                onClick={(event) => navigateChapter(event, step[2])}
              >
                <Icon size={23} aria-hidden="true" />
                <span>
                  <small>{n + 1}</small>
                  {step[i]}
                </span>
              </a>
            </li>
          );
        })}
      </ol>
      <nav
        className="manual-print-index"
        aria-label={es ? "Índice para impresión" : "Print contents"}
      >
        <h2>{es ? "Contenido" : "Contents"}</h2>
        <ol>
          {manualChapters.map((c) => (
            <li key={c.id}>
              <a href={`#${c.id}`}>{c.title[i]}</a>
            </li>
          ))}
        </ol>
      </nav>
      <div className="manual-toolbar">
        <label className="manual-search">
          <Search size={20} />
          <span className="sr-only">
            {es ? "Buscar en el manual" : "Search the manual"}
          </span>
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={
              es
                ? "Busque un campo, botón o tema…"
                : "Search a field, button or topic…"
            }
          />
        </label>
        {query && (
          <button
            type="button"
            className="button secondary"
            onClick={() => setQuery("")}
          >
            {es ? "Limpiar búsqueda" : "Clear search"}
          </button>
        )}
        <button
          type="button"
          className="button secondary"
          onClick={() => window.print()}
        >
          <Printer size={18} />
          {es ? "Imprimir / Guardar PDF" : "Print / Save PDF"}
        </button>
      </div>
      <p className="manual-search-status" role="status">
        {query
          ? es
            ? `${chapters.length} capítulos encontrados. Borre la búsqueda para ver todo el manual.`
            : `${chapters.length} chapters found. Clear search to view the entire manual.`
          : es
            ? "Seleccione una etapa en el índice o recorra la guía. Al imprimir se incluyen todos los capítulos, incluso si está buscando."
            : "Select a stage in the contents or browse the guide. Printing includes all chapters, even during a search."}
      </p>
      <div className="manual-layout">
        <aside className="manual-index">
          <h2>{es ? "En esta guía" : "In this guide"}</h2>
          <nav aria-label={es ? "Índice del manual" : "Manual contents"}>
            {manualChapters.map((c, n) => (
              <a
                key={c.id}
                href={`#${c.id}`}
                onClick={(event) => navigateChapter(event, c.id)}
              >
                <span>{String(n + 1).padStart(2, "0")}</span>
                {c.title[i]}
                <ChevronRight size={14} />
              </a>
            ))}
          </nav>
          <Link href={backHref} className="manual-start">
            {guide.backLabel[i]}
            <ArrowUpRight size={18} />
          </Link>
          <p>
            {es
              ? "Las ilustraciones son esquemas explicativos de las pantallas. No contienen datos de expedientes reales."
              : "Illustrations are explanatory screen diagrams. They contain no real dossier data."}
          </p>
        </aside>
        <div className="manual-chapters">
          {manualChapters.map((c, n) => {
            const hidden = !chapters.includes(c);
            return (
              <article
                id={c.id}
                tabIndex={-1}
                key={c.id}
                className={`manual-chapter${hidden ? " manual-filtered" : ""}`}
              >
                <div className="manual-chapter-heading">
                  <span>{String(n + 1).padStart(2, "0")}</span>
                  <div>
                    <h2>{c.title[i]}</h2>
                    <p>{c.intro[i]}</p>
                  </div>
                </div>
                {c.audience && (
                  <p className="manual-audience">
                    <strong>
                      {es ? "Quién lo utiliza: " : "Who uses this: "}
                    </strong>
                    {c.audience[i]}
                  </p>
                )}
                <div className="manual-explainer">
                  <figure className="manual-screen">
                    <div className="manual-screen-bar">
                      <i />
                      <i />
                      <i />
                      <span>Galápagos Life Fund</span>
                    </div>
                    <div className="manual-screen-body">
                      {c.screen.map((s, j) => (
                        <div
                          className={
                            j === c.screen.length - 1
                              ? "manual-screen-action"
                              : "manual-screen-field"
                          }
                          key={s[0]}
                        >
                          <b>{j + 1}</b>
                          <span>{s[i]}</span>
                        </div>
                      ))}
                    </div>
                    <figcaption>
                      {es
                        ? "Esquema de pantalla · guía visual"
                        : "Screen diagram · visual guide"}
                    </figcaption>
                  </figure>
                  <div className="manual-instructions">
                    <h3>{es ? "Cómo hacerlo" : "How to do it"}</h3>
                    <ol>
                      {c.steps.map((s) => (
                        <li key={s[0]}>{s[i]}</li>
                      ))}
                    </ol>
                  </div>
                </div>
                <h3 className="manual-table-title">
                  {es ? "Cada campo y cada acción" : "Every field and action"}
                </h3>
                <div className="table-scroll">
                  <table className="manual-table">
                    <thead>
                      <tr>
                        <th scope="col">
                          {es ? "Campo o botón" : "Field or button"}
                        </th>
                        <th scope="col">
                          {es
                            ? "Qué hacer y qué ocurre"
                            : "What to do and what happens"}
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {c.rows.map((r) => (
                        <tr key={r[0]}>
                          <th scope="row">{r[i * 2]}</th>
                          <td>{r[i * 2 + 1]}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                {c.outcome && (
                  <div className="manual-outcome">
                    <strong>
                      {es ? "Resultado esperado" : "Expected outcome"}
                    </strong>
                    <p>{c.outcome[i]}</p>
                  </div>
                )}
                <div className="manual-tip">
                  <Lightbulb size={21} />
                  <p>
                    <strong>
                      {es ? "Tenga en cuenta. " : "Keep in mind. "}
                    </strong>
                    {c.tip[i]}
                  </p>
                </div>
                <a className="manual-back" href="#main-content">
                  {es ? "Volver al inicio" : "Back to top"} ↑
                </a>
              </article>
            );
          })}
          {chapters.length === 0 && (
            <p className="live-empty">{guide.empty[i]}</p>
          )}
        </div>
      </div>
    </div>
  );
}
