"use client";
import { useSyncExternalStore, useTransition } from "react";
import { RefreshCw, ArrowLeft, LoaderCircle } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";

export function useEnglish() {
  return useSyncExternalStore(() => () => {}, () => document.documentElement.lang.startsWith("en"), () => false);
}
export function PageLoading() {
  const en = useEnglish();
  return <main id="main-content" className="page-feedback" aria-busy="true"><section className="live-card"><p role="status"><LoaderCircle className="busy-spinner" size={20} aria-hidden="true" /> {en ? "Loading information…" : "Cargando información…"}</p></section></main>;
}
export function PageError({error, reset}: {error: Error & {digest?: string}; reset: () => void}) {
  const en = useEnglish();
  const [pending, startTransition] = useTransition();
  const router = useRouter();
  return <main id="main-content" className="page-feedback"><section className="live-card" role="alert">
    <h1 className="application-section-title">{en ? "Information could not be loaded" : "No se pudo cargar la información"}</h1>
    <p>{en ? "Check your connection and try again. If you were confirming an operation, check its status before repeating it." : "Compruebe su conexión e inténtelo de nuevo. Si estaba confirmando una operación, compruebe su estado antes de repetirla."}</p>
    <div className="live-actions"><button type="button" className="button primary" disabled={pending} aria-busy={pending} onClick={() => startTransition(() => { router.refresh(); reset(); })}><RefreshCw size={18} aria-hidden="true" />{pending ? en ? "Retrying…" : "Reintentando…" : en ? "Try again" : "Reintentar"}</button><Link href="/" className="button secondary"><ArrowLeft size={18} aria-hidden="true" />{en ? "Go to home" : "Ir al inicio"}</Link></div>
    {error.digest && <p className="field-help">{en ? "Support reference" : "Referencia para soporte"}: {error.digest}</p>}
  </section></main>;
}
