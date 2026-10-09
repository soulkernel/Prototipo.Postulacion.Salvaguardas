"use client";
import { useFormStatus } from "react-dom";
import type { ReactNode } from "react";

export function ActionLabel({
  busy,
  pendingLabel,
  children,
}: {
  busy: boolean;
  pendingLabel: string;
  children: ReactNode;
}) {
  return busy ? (
    <span className="action-progress" role="status">
      <span className="action-spinner" aria-hidden="true" />
      {pendingLabel}
    </span>
  ) : (
    children
  );
}

export function SubmitButton({
  children,
  pendingLabel,
  className = "button primary",
  disabled = false,
}: {
  children: ReactNode;
  pendingLabel: string;
  className?: string;
  disabled?: boolean;
}) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      className={className}
      disabled={disabled || pending}
      aria-busy={pending}
    >
      <ActionLabel busy={pending} pendingLabel={pendingLabel}>
        {children}
      </ActionLabel>
    </button>
  );
}
