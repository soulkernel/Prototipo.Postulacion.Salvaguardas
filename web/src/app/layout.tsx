import type { Metadata } from "next";
import { getLocale } from "@/lib/locale";
import "./globals.css";
import "./live.css";
export const metadata: Metadata = {
  title: "Portal de postulaciones | Galápagos Life Fund",
  description:
    "Postulaciones, salvaguardas ambientales y sociales y convocatorias del Galápagos Life Fund.",
  robots: { index: false, follow: false },
};
export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang={await getLocale()}>
      <body>
        <a className="skip-link" href="#main-content">
          Saltar al contenido / Skip to content
        </a>
        {children}
      </body>
    </html>
  );
}
