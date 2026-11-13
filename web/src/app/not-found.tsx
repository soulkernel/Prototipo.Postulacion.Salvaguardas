import { getLocale } from "@/lib/locale";
import Link from "next/link";
export default async function NotFound() {
  const es = await getLocale() === "es";
  return <main id="main-content" className="page-feedback"><section className="live-card"><h1 className="application-section-title">{es ? "No encontramos esta página" : "Page not found"}</h1><p>{es ? "Compruebe la dirección o vuelva al inicio para acceder a las opciones disponibles para su cuenta." : "Check the address or go to home to see the options available for your account."}</p><Link href="/" className="button primary">{es ? "Ir al inicio" : "Go to home"}</Link></section></main>;
}
