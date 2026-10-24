"use client";
import NextLink, { useLinkStatus } from "next/link";
import { useSyncExternalStore, type ComponentProps } from "react";
import { ActionLabel } from "./submit-button";
function NavigationFeedback({ children }: { children: React.ReactNode }) {
  const { pending } = useLinkStatus();
  const en = useSyncExternalStore(
    () => () => {},
    () => document.documentElement.lang.startsWith("en"),
    () => false,
  );
  const label = en ? "Processing…" : "Procesando…";
  return (
    <span
      aria-busy={pending}
      onClickCapture={(event) => {
        if (pending) {
          event.preventDefault();
          event.stopPropagation();
        }
      }}
    >
      <ActionLabel busy={pending} pendingLabel={label}>
        {children}
      </ActionLabel>
    </span>
  );
}
export default function FeedbackLink({
  children,
  ...props
}: ComponentProps<typeof NextLink>) {
  return (
    <NextLink {...props}>
      <NavigationFeedback>{children}</NavigationFeedback>
    </NextLink>
  );
}
