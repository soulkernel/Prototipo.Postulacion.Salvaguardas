/** Display labels only. Original identifiers and text remain unchanged in stored evidence. */
export function evidenceSourceName(name: string) {
  const guidance = /ifc-ps-guidance-note-(\d+)/i.exec(name);
  if (guidance) return `IFC · Nota de orientación ${guidance[1]}`;
  if (/general-ehs-guidelines/i.test(name))
    return "Guías generales sobre medio ambiente, salud y seguridad";
  if (/GUIA_RECUPERACION_SALVAGUARDAS_POR_PROPUESTA/i.test(name))
    return "Guía de recuperación de salvaguardas por propuesta";
  return name
    .replace(/^CREF-\d+_ES_/, "")
    .replace(/^\d{8}[-_]/, "")
    .replace(/\.(pdf|txt|md)$/i, "")
    .replace(/[-_]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}
export function evidenceLocation(locator: string, es: boolean) {
  const page = /page markers ([\d, -]+)/i.exec(locator);
  if (page)
    return `${es ? "Referencia de página" : "Page reference"}: ${page[1].trim()}`;
  const chunk = /::0*(\d+)/.exec(locator);
  const part = /part (\d+)/i.exec(locator);
  if (chunk)
    return `${es ? "Fragmento" : "Passage"} ${chunk[1]}${part ? ` · ${es ? "segmento" : "segment"} ${part[1]}` : ""}`;
  return locator;
}
