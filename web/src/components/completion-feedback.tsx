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
      const note = document.createElement("small");
      note.className = "validation-field-message";
      note.id = "validation-" + issue.id;
      note.textContent = issue.text;
      container.appendChild(note);
      control?.setAttribute("aria-invalid", "true");
      control?.setAttribute(
        "aria-describedby",
        [oldDescription, note.id].filter(Boolean).join(" "),
      );
      cleanup.push(() => {
        container.classList.remove("validation-pending");
        note.remove();
        if (control) {
          if (oldInvalid === null || oldInvalid === undefined)
            control.removeAttribute("aria-invalid");
          else control.setAttribute("aria-invalid", oldInvalid);
          if (oldDescription === null || oldDescription === undefined)
            control.removeAttribute("aria-describedby");
          else control.setAttribute("aria-describedby", oldDescription);
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
  if (!issues.some((i) => i.step === step) || step === 3) return null;
  return (
    <aside className="completion-step-notice" role="status">
      {locale === "es"
        ? "Revise los campos resaltados. Los pendientes se actualizan mientras corrige los datos."
        : "Review the highlighted fields. Pending items update as you correct the data."}
    </aside>
  );
}
