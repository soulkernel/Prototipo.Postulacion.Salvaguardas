export type InboxItem = {
  id: string;
  reference_code: string;
  status: string;
  title: string;
  proponent: string;
  contact: string;
  stage: number;
  call_id: string;
  category: string;
  submitted_at: string;
};
export type InboxPage = {
  items: InboxItem[];
  total: number;
  page: number;
  pages: number;
  page_size: number;
  in_review: number;
  shortlisted: number;
  signed: number;
};
export function inboxPaging(query: { page?: string; size?: string }) {
  const n = Number(query.page);
  return {
    page: Number.isSafeInteger(n) && n > 0 ? Math.min(n, 1000000) : 1,
    size: [10, 25, 50].includes(Number(query.size)) ? Number(query.size) : 10,
  };
}

export function inboxSearch(value?: string) {
  return (value || "").trim().replace(/\s+/gu, " ").slice(0, 200);
}

export function inboxHref(input: {
  call: string;
  category: string;
  page: number;
  size: number;
  q?: string;
}) {
  const query = new URLSearchParams({
    call: input.call,
    category: input.category,
    page: String(input.page),
    size: String(input.size),
  });
  const search = inboxSearch(input.q);
  if (search) query.set("q", search);
  return "/internal?" + query;
}
