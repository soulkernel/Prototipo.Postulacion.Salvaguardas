"use client";

import { useEffect, useState } from "react";

export function DeadlineCountdown({ deadline, serverNow, locale, stage = 1 }: {
  deadline: string | null;
  serverNow: number;
  locale: "es" | "en";
  stage?: number;
}) {
  const [now, setNow] = useState(serverNow);
  useEffect(() => {
    const start = performance.now();
    const tick = () => setNow(serverNow + performance.now() - start);
    tick();
    const interval = window.setInterval(tick, 60_000);
    const end = deadline ? Date.parse(deadline) : NaN;
    const timeout = Number.isFinite(end) && end > serverNow && end - serverNow < 2_147_483_647
      ? window.setTimeout(tick, end - serverNow) : undefined;
    document.addEventListener("visibilitychange", tick);
    return () => {
      window.clearInterval(interval);
      window.clearTimeout(timeout);
      document.removeEventListener("visibilitychange", tick);
    };
  }, [deadline, serverNow]);
  if (!deadline || !Number.isFinite(Date.parse(deadline))) return null;
  const remaining = Date.parse(deadline) - now;
  const es = locale === "es";
  const minutes = Math.ceil(Math.max(0, remaining) / 60_000);
  const days = Math.floor(minutes / 1440);
  const hours = Math.floor((minutes % 1440) / 60);
  const mins = minutes % 60;
  const tone = remaining <= 0 ? "closed" : remaining <= 86_400_000 ? "urgent" : remaining <= 259_200_000 ? "soon" : "open";
  return <aside className={`deadline-countdown ${tone}`} aria-label={es ? "Plazo de presentación" : "Submission deadline"}>
    <strong>{remaining <= 0
      ? stage === 1 ? (es ? "Convocatoria cerrada" : "Call closed") : (es ? "Plazo de propuesta completa finalizado" : "Full proposal deadline passed")
      : `${es ? "Tiempo restante" : "Time remaining"}: ${days} ${es ? "días" : "days"} · ${hours} h · ${mins} min`}</strong>
    <span>{stage === 1 ? (es ? "Cierre de notas conceptuales: " : "Concept note deadline: ") : (es ? "Cierre de propuesta completa: " : "Full proposal deadline: ")}
      <time dateTime={deadline}>{new Intl.DateTimeFormat(es ? "es-EC" : "en-GB", { dateStyle: "long", timeStyle: "short", timeZone: "Pacific/Galapagos", hourCycle: "h23" }).format(new Date(deadline))}</time>
      {es ? " · hora de Galápagos" : " · Galapagos time"}</span>
  </aside>;
}
