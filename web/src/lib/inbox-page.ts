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
