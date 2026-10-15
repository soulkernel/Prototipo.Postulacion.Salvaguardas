import type { Locale } from "@/lib/domain";

/** Reading guidance is deterministic; it does not invent a normative interpretation. */
export function EvidenceReading({
  name,
  text,
  locator,
  locale,
}: {
  name: string;
  text: string;
  locator: string;
  locale: Locale;
}) {
  const es = locale === "es";
  const clean = text.replace(/\s+/g, " ").trim();
  const preview =
    clean.length > 650
      ? clean.slice(
          0,
          clean.lastIndexOf(" ", 650) > 400 ? clean.lastIndexOf(" ", 650) : 650,
        ) + "…"
      : clean;
  const definitions = /definicion|definición|definiciones|definitions/i.test(
    name,
  );
  const exclusions = /exclusi[oó]n|exclusion/i.test(name);
  return (
    <div className="evidence-reading">
      <p className="evidence-guide">
        {es
          ? `Este pasaje procede de «${name}»${locator ? `, ${locator}` : ""}. ${definitions ? "Ayuda a comprender los términos utilizados; una definición no establece, por sí sola, una obligación para este proyecto." : exclusions ? "Consúltelo para identificar prohibiciones expresas y verificar si la actividad reúne las condiciones descritas." : "Puede aportar criterios para revisar la actividad o el riesgo. Compruebe su alcance y condiciones antes de aplicarlo al proyecto."}`
          : `This passage comes from “${name}”${locator ? `, ${locator}` : ""}. ${definitions ? "It explains terminology; a definition alone does not impose a requirement on this project." : exclusions ? "Use it to identify explicit prohibitions and check whether the activity meets the stated conditions." : "It may provide criteria for reviewing the activity or risk. Check its scope and conditions before applying it to the project."}`}
      </p>
      <h4>
        {es
          ? "Lectura rápida · extracto literal"
          : "Quick reading · verbatim excerpt"}
      </h4>
      <blockquote>{preview}</blockquote>
      {/\bVEAS\b/i.test(text) && (
        <p className="evidence-guide">
          {es
            ? "La fuente utiliza la denominación VEAS. Verifique el formato vigente de la convocatoria antes de aplicar esa referencia."
            : "The source uses the term VEAS. Check the call’s current assessment form before applying this reference."}
        </p>
      )}
      <details>
        <summary>
          {es
            ? "Ver fragmento original completo"
            : "View full original passage"}
        </summary>
        <p className="rag-answer">{text}</p>
      </details>
    </div>
  );
}
