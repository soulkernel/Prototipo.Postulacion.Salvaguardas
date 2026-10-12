"use client";
import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { ActionLabel } from "./submit-button";
export function InboxFilters({
  calls,
  categories,
  call,
  category,
  es,
}: {
  calls: { id: string; title: string }[];
  categories: { id: string; title: string }[];
  call: string;
  category: string;
  es: boolean;
}) {
  const router = useRouter();
  const [pending, start] = useTransition();
  function update(c: string, k: string) {
    start(() =>
      router.push(`/internal?${new URLSearchParams({ call: c, category: k })}`),
    );
  }
  return (
    <section className="live-card" aria-busy={pending}>
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
