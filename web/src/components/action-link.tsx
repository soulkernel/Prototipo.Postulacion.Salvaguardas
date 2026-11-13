import { ArrowLeft, BookOpen, Eye } from "lucide-react";
import type { ReactNode } from "react";
import Link from "./feedback-link";

export function ActionLink({
  href,
  children,
  kind = "view",
  compact = false,
  ariaLabel,
}: {
  href: string;
  children: ReactNode;
  kind?: "back" | "view" | "guide";
  compact?: boolean;
  ariaLabel?: string;
}) {
  const Icon = kind === "back" ? ArrowLeft : kind === "guide" ? BookOpen : Eye;
  return (
    <Link
      className={`button navigation-action${kind === "back" ? " back-link" : ""}${compact ? " compact" : ""}`}
      href={href}
      aria-label={ariaLabel}
    >
      <Icon size={18} aria-hidden="true" />
      <span>{children}</span>
    </Link>
  );
}
