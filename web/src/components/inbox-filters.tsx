"use client";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Search, X } from "lucide-react";
import { inboxHref, inboxSearch } from "@/lib/inbox-page";
import { ActionLabel } from "./submit-button";
export function InboxFilters({
  calls,
  categories,
  call,
  category,
  es,
  pageSize = 10,
  search = "",
}: {
  calls: { id: string; title: string }[];
  categories: { id: string; title: string }[];
  call: string;
  category: string;
  es: boolean;
  pageSize?: number;
  search?: string;
}) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [text, setText] = useState(search);
  function update(c: string, k: string, size = pageSize, q = search) {
    start(() =>
      router.push(inboxHref({ call: c, category: k, size, page: 1, q }), {
        scroll: false,
      }),
    );
  }
  return (
    <section className="live-card" aria-busy={pending}>
      <form
        role="search"
        className="inbox-search"
        onSubmit={(event) => {
          event.preventDefault();
          update(call, category, pageSize, inboxSearch(text));
        }}
      >
        <label htmlFor="inbox-search-input">
          {es ? "Buscar expedientes" : "Search applications"}
        </label>
        <div className="inbox-search-controls">
          <input
            id="inbox-search-input"
            type="search"
            value={text}
            maxLength={200}
            disabled={pending}
            onChange={(event) => setText(event.target.value)}
            aria-describedby="inbox-search-help"
            placeholder={
              es
                ? "Código, proyecto, proponente u organización, persona de contacto"
                : "Reference, project, applicant or organization, contact person"
            }
          />
          <button
            type="submit"
            className="button primary"
            disabled={pending}
            aria-busy={pending}
          >
            <ActionLabel
              busy={pending}
              pendingLabel={es ? "Buscando…" : "Searching…"}
            >
              <Search size={16} aria-hidden="true" />
              {es ? "Buscar" : "Search"}
            </ActionLabel>
          </button>
          <button
            type="button"
            className="button secondary"
            disabled={pending || (!text && !search)}
            onClick={() => {
              setText("");
              update(call, category, pageSize, "");
            }}
          >
            <X size={16} aria-hidden="true" />
            {es ? "Limpiar" : "Clear"}
          </button>
        </div>
        <small id="inbox-search-help">
          {es
            ? "Busca en todos los expedientes de los filtros seleccionados, sin distinguir mayúsculas ni tildes. Para consultar años anteriores, seleccione Todas las convocatorias."
            : "Searches all applications within the selected filters, ignoring case and accents. Select All calls to include previous years."}
        </small>
      </form>
      <div className="form-grid">
        <label>
          {es ? "Convocatoria" : "Call"}
          <select
            disabled={pending}
            value={call}
            onChange={(e) => update(e.target.value, category)}
          >
            <option value="all">
              {es ? "Todas las convocatorias" : "All calls"}
            </option>
            {calls.map((c) => (
              <option key={c.id} value={c.id}>
                {c.title}
              </option>
            ))}
          </select>
        </label>
        <label>
          {es ? "Categoría de subvención" : "Grant category"}
          <select
            disabled={pending}
            value={category}
            onChange={(e) => update(call, e.target.value)}
          >
            <option value="all">
              {es ? "Todas las categorías" : "All categories"}
            </option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.title}
              </option>
            ))}
          </select>
        </label>
        <label>
          {es ? "Expedientes por página" : "Applications per page"}
          <select
            value={pageSize}
            disabled={pending}
            onChange={(e) => update(call, category, Number(e.target.value))}
          >
            {[10, 25, 50].map((n) => (
              <option key={n} value={n}>
                {n}
              </option>
            ))}
          </select>
        </label>
      </div>
      {pending && (
        <p role="status">
          <ActionLabel busy pendingLabel={es ? "Procesando…" : "Processing…"}>
            {""}
          </ActionLabel>
        </p>
      )}
    </section>
  );
}
