"use client";
import { useEffect } from "react";
import type { CompletionIssue } from "@/lib/completion-guidance";
import type { Locale } from "@/lib/domain";
export function CompletionFeedback({
  issues,
  step,
  focusIssue,
  locale,
}: {
  issues: CompletionIssue[];
  step: number;
  focusIssue: CompletionIssue | null;
  locale: Locale;
}) {
  useEffect(() => {
    const cleanup: (() => void)[] = [];
    for (const issue of issues.filter((i) => i.step === step)) {
      // Summary budget renders its own live, contextual validation messages.
      if (issue.id.startsWith("summary_budget") || issue.id.startsWith("sgas_")) continue;
      const target = document.querySelector<HTMLElement>(issue.selector);
      if (!target) continue;
      const control = target.matches("input,textarea,select")
        ? target
        : target.querySelector<HTMLElement>("input,textarea,select,button");
      const container = target.matches("input,textarea,select")
        ? target.closest("label") || target.parentElement
        : target;
      if (!container) continue;
      const oldInvalid = control?.getAttribute("aria-invalid"),
        oldDescription = control?.getAttribute("aria-describedby");
      container.classList.add("validation-pending");
      const existing = container.querySelector<HTMLElement>(
        '[data-field-message="error"]',
      );
      const note = existing || document.createElement("small");
      if (!existing) {
        note.className = "validation-field-message";
        note.id = "validation-" + issue.id;
        note.textContent = issue.text;
        container.appendChild(note);
      }
      control?.setAttribute("aria-invalid", "true");
      const description = [oldDescription, note.id].filter(Boolean).join(" ");
      control?.setAttribute("aria-describedby", description);
      cleanup.push(() => {
        container.classList.remove("validation-pending");
        if (!existing) note.remove();
        if (control) {
          // Do not overwrite attributes React has already refreshed, for example
          // when a financial field regains focus and hides its warning.
          if (control.getAttribute("aria-invalid") === "true") {
            if (oldInvalid === null || oldInvalid === undefined)
              control.removeAttribute("aria-invalid");
            else control.setAttribute("aria-invalid", oldInvalid);
          }
          if (control.getAttribute("aria-describedby") === description) {
            if (oldDescription === null || oldDescription === undefined)
              control.removeAttribute("aria-describedby");
            else control.setAttribute("aria-describedby", oldDescription);
          }
        }
      });
    }
    return () => cleanup.reverse().forEach((fn) => fn());
  }, [issues, step]);
  useEffect(() => {
    if (!focusIssue || focusIssue.step !== step) return;
    const target = document.querySelector<HTMLElement>(focusIssue.selector);
    if (!target) return;
    target.scrollIntoView({ block: "center", behavior: "smooth" });
    const control = target.matches("input,textarea,select,button")
      ? target
      : target.querySelector<HTMLElement>("input,textarea,select,button");
    (control || target).focus({ preventScroll: true });
  }, [focusIssue, step]);
  if (!issues.some((i) => i.step === step) || step === 5) return null;
  return (
    <aside className="completion-step-notice" role="status">
      {locale === "es"
        ? "Revise los campos resaltados. Los pendientes se actualizan mientras corrige los datos."
        : "Review the highlighted fields. Pending items update as you correct the data."}
    </aside>
  );
}
