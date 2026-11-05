import type { ReactNode } from "react";
import { ActionLink } from "./action-link";

export function BackLink({ href, children }: { href: string; children: ReactNode }) {
  return (
    <ActionLink kind="back" href={href}>{children}</ActionLink>
  );
}
