import { requireViewer } from "@/lib/data";
import { getLocale } from "@/lib/locale";
import { Shell } from "@/components/shell";
export default async function AccessPage() {
  await requireViewer(["internal_member"]);
  const locale = await getLocale(),
    es = locale === "es";
  return (
    <Shell locale={locale} internal>
      <section className="live-card">
        <h1>{es ? "Su acceso interno GLF" : "Your GLF staff access"}</h1>
        <p>
          {es
            ? "Su cuenta está lista. Use este mismo correo y contraseña en las aplicaciones habilitadas para usted; cada aplicación verifica sus permisos y el segundo factor."
            : "Your account is ready. Use the same email and password in your authorized applications; each application checks your permissions and second factor."}
        </p>
        <div className="live-actions">
          <a
            className="button primary"
            href="https://glf-operaciones-kyc-archivo.vercel.app/"
          >
            {es ? "Ir a Proveedores y KYC" : "Go to Suppliers and KYC"}
          </a>
          <a className="button ghost" href="https://soulkernel.github.io/GLF/">
            {es ? "Centro de accesos GLF" : "GLF access hub"}
          </a>
        </div>
        <p>
          {es
            ? "No tiene asignadas funciones internas de Postulaciones y Salvaguardas. Si las necesita, coordine su autorización con la administración del GLF."
            : "You have no internal Grants and Safeguards permissions. Contact GLF administration if you need them."}
        </p>
      </section>
    </Shell>
  );
}
