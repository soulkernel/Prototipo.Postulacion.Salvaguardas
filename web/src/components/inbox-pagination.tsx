import Link from "./feedback-link";
import type { Locale } from "@/lib/domain";
export function InboxPagination({
  page,
  pages,
  total,
  pageSize,
  call,
  category,
  locale,
}: {
  page: number;
  pages: number;
  total: number;
  pageSize: number;
  call: string;
  category: string;
  locale: Locale;
}) {
  const es = locale === "es";
  const href = (n: number) =>
    `/internal?${new URLSearchParams({ call, category, page: String(n), size: String(pageSize) })}`;
  const numbers = [
    ...new Set([
      1,
      ...Array.from({ length: 5 }, (_, i) => page - 2 + i).filter(
        (n) => n >= 1 && n <= pages,
      ),
      pages,
    ]),
  ].sort((a, b) => a - b);
  return (
    <nav
      className="inbox-pagination"
      aria-label={es ? "Páginas de expedientes" : "Application pages"}
    >
      <p>
        {total
          ? `${(page - 1) * pageSize + 1}–${Math.min(page * pageSize, total)}`
          : "0"}{" "}
        {es ? "de" : "of"} {total} · {es ? "Página" : "Page"} {page}{" "}
        {es ? "de" : "of"} {pages}
      </p>
      <div className="pagination-links">
        {page > 1 ? (
          <Link className="button secondary" href={href(page - 1)}>
            {es ? "← Anterior" : "← Previous"}
          </Link>
        ) : (
          <span className="button secondary" aria-disabled="true">
            {es ? "← Anterior" : "← Previous"}
          </span>
        )}
        {numbers.map((n, i) => (
          <span key={n}>
            {i > 0 && numbers[i - 1] < n - 1 && (
              <span className="pagination-gap">…</span>
            )}
            {n === page ? (
              <span className="button primary" aria-current="page">
                {n}
              </span>
            ) : (
              <Link
                className="button secondary"
                href={href(n)}
                aria-label={`${es ? "Página" : "Page"} ${n}`}
              >
                {n}
              </Link>
            )}
          </span>
        ))}
        {page < pages ? (
          <Link className="button secondary" href={href(page + 1)}>
            {es ? "Siguiente →" : "Next →"}
          </Link>
        ) : (
          <span className="button secondary" aria-disabled="true">
            {es ? "Siguiente →" : "Next →"}
          </span>
        )}
      </div>
    </nav>
  );
}
