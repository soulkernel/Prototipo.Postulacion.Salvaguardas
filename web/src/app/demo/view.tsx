"use client";
import dynamic from "next/dynamic";
const Demo = dynamic(
  () => import("@/components/portal-app").then((m) => m.PortalApp),
  { ssr: false, loading: () => <p>Cargando demostración / Loading demo…</p> },
);
export function DemoClient() {
  return <Demo />;
}
