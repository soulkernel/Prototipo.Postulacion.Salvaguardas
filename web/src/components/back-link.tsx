import { ArrowLeft } from "lucide-react";
import type { ReactNode } from "react";
import Link from "./feedback-link";

export function BackLink({ href, children }: { href: string; children: ReactNode }) {
  return (
    <Link className="button back-link" href={href}>
      <ArrowLeft size={18} aria-hidden="true" />
      <span>{children}</span>
    </Link>
  );
}
