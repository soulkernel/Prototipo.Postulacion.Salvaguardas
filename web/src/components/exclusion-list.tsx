"use client";

import { useState } from "react";
import { Download, ExternalLink, Search } from "lucide-react";
import type { Locale } from "@/lib/domain";
import {
  exclusionHighlightParts,
  exclusionNotes,
  exclusionResultLabel,
  exclusionScopeMatches,
  exclusionSource,
  exclusionTopics,
  filterExclusions,
} from "@/lib/exclusion-list";

function Highlight({ text, query }: { text: string; query: string }) {
  return exclusionHighlightParts(text, query).map((part, index) =>
    part.match ? <mark key={index}>{part.text}</mark> : part.text,
  );
}

function SourceText({ text, query }: { text: string; query: string }) {
  return text.split(/(\[\d+\])/).map((part, index) =>
    /^\[\d+\]$/.test(part) ? (
      <sup key={index} aria-label={`Nota ${part.slice(1, -1)}`}>
        {part}
      </sup>
    ) : (
      <Highlight key={index} text={part} query={query} />
    ),
  );
}

function Notes({ ids, query }: { ids: number[]; query: string }) {
  if (!ids.length) return null;
  return (
    <div className="exclusion-notes" lang="es">
      {ids.map((id) => {
        const note = exclusionNotes.find((item) => item.id === id)!;
        return (
          <p key={id} data-exclusion-note={id}>
            <strong>Nota {id}. </strong>
            <Highlight text={note.text} query={query} />
            {note.links.length > 0 && (
              <span className="exclusion-source-links">
                {note.links.map((link) => (
                  <a
                    key={link.href}
                    href={link.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={`${link.label} · Se abre en otra pestaña`}
                  >
                    {link.label}
                    <ExternalLink size={12} aria-hidden="true" />
                  </a>
                ))}
              </span>
            )}
          </p>
        );
      })}
    </div>
  );
}

export function ExclusionList({ locale }: { locale: Locale }) {
  const es = locale === "es";
  const [query, setQuery] = useState("");
  const [topic, setTopic] = useState("all");
  const results = filterExclusions(query, topic);
  const scopeMatch = exclusionScopeMatches(query);
  const reset = () => {
    setQuery("");
    setTopic("all");
  };
  return (
    <div className="exclusion-page">
      <section className="exclusion-hero" aria-labelledby="exclusion-title">
        <p className="eyebrow">
          GALÁPAGOS LIFE FUND ·{" "}
          {es ? "CONSULTA PARA POSTULANTES" : "APPLICANT REFERENCE"}
        </p>
        <h1 id="exclusion-title">
          {es ? "Lista de exclusión" : "Exclusion list"}
        </h1>
        <p>
          {es
            ? "Consulte las actividades que el Galápagos Life Fund no financia ni apoya. Revise las actividades previstas, las compras, el lugar de ejecución y las organizaciones participantes en su proyecto."
            : "Consult the activities that the Galápagos Life Fund does not finance or support. Review your proposed activities, purchases, project locations and participating organisations."}
        </p>
        <div className="exclusion-document-actions">
          <a
            className="button"
            href={exclusionSource.path}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={
              es
                ? "Ver PDF original en español · Se abre en otra pestaña"
                : "View original Spanish PDF · Opens in a new tab"
            }
          >
            <ExternalLink size={16} aria-hidden="true" />
            {es ? "Ver PDF original" : "View original PDF"}
          </a>
          <a className="button secondary" href={exclusionSource.path} download>
            <Download size={16} aria-hidden="true" />
            {es ? "Descargar PDF" : "Download PDF"}
          </a>
        </div>
        <p className="exclusion-version" lang="es">
          {exclusionSource.title}
        </p>
        <p className="exclusion-version">
          {exclusionSource.versionLabel[locale]} ·{" "}
          {es ? "Documento en español" : "Document in Spanish"}
        </p>
      </section>

      {!es && (
        <p className="exclusion-language-notice">
          The supplied official text is in Spanish. An approved English version
          has not been supplied. Search Spanish terms or use the topic filters
          below.
        </p>
      )}

      <section
        className="exclusion-tools"
        aria-labelledby="exclusion-search-title"
      >
        <h2 id="exclusion-search-title">
          {es
            ? "Encuentre los apartados que necesita revisar"
            : "Find sections to review"}
        </h2>
        <label htmlFor="exclusion-search">
          {es
            ? "Buscar una actividad o palabra clave"
            : "Search for an activity or keyword"}
        </label>
        <div className="exclusion-search-row">
          <div className="exclusion-search-input">
            <Search size={19} aria-hidden="true" />
            <input
              id="exclusion-search"
              type="search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              aria-describedby="exclusion-search-help"
              placeholder={
                es
                  ? "Ej.: pesca, gasolina, áreas protegidas…"
                  : "Spanish terms: pesca, gasolina, áreas protegidas…"
              }
            />
          </div>
          <button
            type="button"
            className="button secondary"
            onClick={reset}
            disabled={!query && topic === "all"}
          >
            {es ? "Limpiar búsqueda y filtros" : "Clear search and filters"}
          </button>
        </div>
        <p id="exclusion-search-help">
          {es
            ? "Puede combinar palabras. La búsqueda incluye el texto y las notas; los filtros por tema son ayudas de navegación."
            : "You can combine words. Search includes the text and notes; topic filters are navigation aids."}
        </p>
        <div
          className="exclusion-topics"
          role="group"
          aria-label={es ? "Filtrar por tema" : "Filter by topic"}
        >
          {[{ id: "all", es: "Todos", en: "All" }, ...exclusionTopics].map(
            (item) => (
              <button
                type="button"
                key={item.id}
                aria-pressed={topic === item.id}
                onClick={() => setTopic(item.id)}
              >
                {item[locale]}
              </button>
            ),
          )}
        </div>
        <p className="exclusion-guidance">
          {es
            ? "Las coincidencias ayudan a localizar información. Encontrar o no encontrar una palabra no determina la elegibilidad del proyecto. Lea el apartado completo, sus condiciones y sus notas."
            : "Matches help locate information. Finding or not finding a word does not determine project eligibility. Read each full section, its conditions and notes."}
        </p>
      </section>

      <details className="exclusion-scope" open={scopeMatch || undefined}>
        <summary>
          {es
            ? "Alcance y referencias del documento original"
            : "Scope and references of the original document"}
        </summary>
        <div lang="es">
          <p>
            <SourceText text={exclusionSource.introduction} query={query} />
          </p>
          <Notes ids={exclusionSource.notes} query={query} />
        </div>
      </details>

      <p
        className="exclusion-result-count"
        role="status"
        aria-live="polite"
        aria-atomic="true"
      >
        {exclusionResultLabel(results.length, locale)}
        {scopeMatch &&
          (es
            ? " · Coincidencia también en el alcance y las referencias"
            : " · Match in scope and references")}
      </p>
      {results.length === 0 && !scopeMatch && (
        <div className="exclusion-empty">
          <h2>{es ? "No se encontraron coincidencias" : "No matches found"}</h2>
          <p>
            {es
              ? "Pruebe otra palabra o quite los filtros. La ausencia de coincidencias no confirma que su proyecto esté fuera de la lista de exclusión."
              : "Try another Spanish word or remove the filters. No matches does not confirm that your project is outside the exclusion list."}
          </p>
          <button type="button" className="button secondary" onClick={reset}>
            {es ? "Ver la lista completa" : "View the full list"}
          </button>
        </div>
      )}
      <div className="exclusion-results">
        {results.map((entry) => (
          <article
            key={entry.id}
            className="exclusion-entry"
            id={`exclusion-${entry.id}`}
            aria-labelledby={`exclusion-heading-${entry.id}`}
          >
            <h2 id={`exclusion-heading-${entry.id}`}>
              <span className="exclusion-number">{entry.id}</span>
              <span>
                <Highlight text={entry.title[locale]} query={query} />
              </span>
            </h2>
            <p className="exclusion-page-reference">
              {es ? "Apartado" : "Section"} {entry.id} ·{" "}
              {es ? "página" : "page"} {entry.page} ·{" "}
              {es
                ? "Rótulo orientativo; texto original a continuación"
                : "Navigation heading; original text below"}
            </p>
            <div lang="es" className="exclusion-official-text">
              <p>
                <SourceText text={entry.text} query={query} />
              </p>
              {entry.bullets.length > 0 && (
                <ul>
                  {entry.bullets.map((text, index) => (
                    <li key={index}>
                      <SourceText text={text} query={query} />
                    </li>
                  ))}
                </ul>
              )}
              <Notes ids={entry.notes} query={query} />
              {entry.children.length > 0 && (
                <ol type="a" className="exclusion-subsections">
                  {entry.children.map((child) => (
                    <li key={child.id} id={`exclusion-${child.id}`}>
                      <p>
                        <SourceText text={child.text} query={query} />
                      </p>
                      <Notes ids={child.notes} query={query} />
                    </li>
                  ))}
                </ol>
              )}
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}
