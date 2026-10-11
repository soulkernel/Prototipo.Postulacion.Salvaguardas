"use client";
import { useState } from "react";
import Link from "next/link";
import {
  BookOpen,
  Search,
  Printer,
  ArrowUpRight,
  CheckCircle2,
  Lightbulb,
  ChevronRight,
  FileCheck2,
  Send,
  UserRound,
  ListChecks,
} from "lucide-react";
import { manualChapters } from "@/lib/applicant-manual";
import type { Locale } from "@/lib/domain";
import { version } from "../../package.json";
export function ApplicantManual({ locale }: { locale: Locale }) {
  const es = locale === "es";
  const i = es ? 0 : 1;
  const [query, setQuery] = useState("");
  const normalize = (s: string) =>
    s
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase();
  const chapters = manualChapters.filter((c) =>
    normalize(
      [
        c.title[i],
        c.intro[i],
        ...c.steps.map((s) => s[i]),
        ...c.rows.flatMap((r) => [r[i * 2], r[i * 2 + 1]]),
        c.tip[i],
      ].join(" "),
    ).includes(normalize(query.trim())),
  );
  const journey = es
    ? [
        "Cree su cuenta",
        "Prepare la nota",
        "Evalúe los riesgos",
        "Firme los dos PDF",
        "Envíe y guarde el comprobante",
      ]
    : [
        "Create your account",
        "Prepare the note",
        "Assess risks",
        "Sign both PDFs",
        "Submit and keep the receipt",
      ];
  const icons = [UserRound, BookOpen, ListChecks, FileCheck2, Send];
  return (
    <div className="manual">
      <section className="manual-hero">
        <div className="manual-hero-copy">
          <span className="manual-kicker">
            <BookOpen size={18} />
            {es ? "GUÍA DEL APLICANTE" : "APPLICANT GUIDE"}
          </span>
          <h1>{es ? "Manual de uso" : "User manual"}</h1>
          <p>
            {es ? "Su proyecto, paso a paso." : "Your project, step by step."}
          </p>
          <div className="manual-lead">
            {es
              ? "Desde la creación de su cuenta hasta la recepción de su nota conceptual. Conozca qué completar, qué revisar y qué ocurre después de cada acción."
              : "From creating your account to receipt of your concept note. Learn what to complete, what to check and what happens after each action."}
          </div>
          <div className="manual-meta">
            {es
              ? "Usuario externo · Actualizado: 11 de octubre de 2026"
              : "External applicant · Updated: 11 October 2026"}{" "}
            · v{version}
          </div>
        </div>
        <div className="manual-hero-art" aria-hidden="true">
          <div className="manual-orbit" />
          <BookOpen size={74} strokeWidth={1.25} />
          <span className="manual-art-chip">
            <CheckCircle2 size={17} />
            {es ? "Claro, de principio a fin" : "Clear, from start to finish"}
          </span>
        </div>
      </section>
      <ol className="manual-journey">
        {journey.map((text, n) => {
          const Icon = icons[n];
          return (
            <li key={text}>
              <Icon size={23} />
              <span>
                <small>0{n + 1}</small>
                {text}
              </span>
            </li>
          );
        })}
      </ol>
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
              <a key={c.id} href={`#${c.id}`} onClick={() => setQuery("")}>
                <span>{String(n + 1).padStart(2, "0")}</span>
                {c.title[i]}
                <ChevronRight size={14} />
              </a>
            ))}
          </nav>
          <Link href="/applicant/applications" className="manual-start">
            {es ? "Ir a mis postulaciones" : "Go to my applications"}
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
            <p className="live-empty">
              {es
                ? "No encontramos ese término. Pruebe con «firma», «objetivo», «correo» o «borrador»."
                : "No matches found. Try ‘signature’, ‘objective’, ‘email’ or ‘draft’."}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
