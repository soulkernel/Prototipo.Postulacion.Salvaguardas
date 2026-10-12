"use client";
import { ActionLabel } from "./submit-button";
import { useRef, useState } from "react";
import { zip, strToU8 } from "fflate";
import { statusLabel } from "@/lib/fields";
import { summaryWorkbook } from "@/lib/backup-workbook";
import type { Locale } from "@/lib/domain";

type SaveFile = {
  createWritable(): Promise<{
    write(data: Blob): Promise<void>;
    close(): Promise<void>;
    abort(): Promise<void>;
  }>;
};
export function BackupDestination({
  locale,
  calls,
  applications,
  defaultCallId,
  categories,
}: {
  applications: {
    id: string;
    call_id: string;
    reference_code: string;
    title: string;
    category: string;
    proponent: string;
    status: string;
  }[];
  defaultCallId: string;
  categories: { id: string; title: string }[];
  locale: Locale;
  calls: { id: string; title: string }[];
}) {
  const es = locale === "es";
  const [scope, setScope] = useState<"all" | "call" | "selected">("all");
  const [selected, setSelected] = useState<string[]>([]);
  const [search, setSearch] = useState("");
  const [destination, setDestination] = useState<"file" | "download">("file");
  const [call, setCall] = useState(
    defaultCallId === "all" ? "" : defaultCallId,
  );
  const [category, setCategory] = useState("");
  const [content, setContent] = useState<"data" | "documents" | "both">("both");
  const [busy, setBusy] = useState(false);
  const flight = useRef(false);
  const [message, setMessage] = useState("");
  async function backup() {
    if (!ready || flight.current) return;
    flight.current = true;
    setBusy(true);
    setMessage(es ? "Preparando el respaldo…" : "Preparing backup…");
    try {
      const filename =
        "GLF-respaldo-" +
        new Date().toISOString().replace(/[:.]/g, "-") +
        ".zip";
      let target: SaveFile | undefined;
      if (destination === "file") {
        const picker = (
          window as unknown as {
            showSaveFilePicker?: (options: {
              suggestedName: string;
              startIn: string;
              types: {
                description: string;
                accept: Record<string, string[]>;
              }[];
            }) => Promise<SaveFile>;
          }
        ).showSaveFilePicker;
        if (picker) {
          // Must run from this click, before fetching or compressing the backup.
          target = await picker.call(window, {
            suggestedName: filename,
            startIn: "downloads",
            types: [
              {
                description: "Respaldo GLF (ZIP)",
                accept: { "application/zip": [".zip"] },
              },
            ],
          });
        }
      }
      const selection = {
        scope: "selected",
        applications: chosen.map((a) => a.id),
        content,
      };
      const response = await fetch("/internal/backups/export", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(selection),
        cache: "no-store",
      });
      if (!response.ok) {
        const detail = await response.json();
        throw new Error(detail.error || "Export failed");
      }
      const plan = await response.json();
      const entries: Record<string, Uint8Array> = {};
      if (content !== "documents")
        entries["Resumen-expedientes.xlsx"] = summaryWorkbook(
          plan.records,
          locale,
        );
      for (const [name, rows] of Object.entries(plan.records))
        entries["datos/" + name + ".json"] = strToU8(
          JSON.stringify(rows, null, 2),
        );
      for (let i = 0; i < plan.downloads.length; i++) {
        const document = plan.downloads[i];
        setMessage(
          (es ? "Descargando archivo " : "Downloading file ") +
            (i + 1) +
            " / " +
            plan.downloads.length,
        );
        const download = await fetch(document.url, {
          cache: "no-store",
          credentials: "omit",
          referrerPolicy: "no-referrer",
        });
        if (!download.ok)
          throw new Error(
            es
              ? "No se pudo descargar un archivo. El respaldo no se guardó."
              : "A file could not be downloaded. Backup was not saved.",
          );
        const bytes = new Uint8Array(await download.arrayBuffer());
        const hash = Array.from(
          new Uint8Array(await crypto.subtle.digest("SHA-256", bytes)),
        )
          .map((b) => b.toString(16).padStart(2, "0"))
          .join("");
        if (bytes.length !== document.bytes || hash !== document.sha256)
          throw new Error(
            es
              ? "Falló la verificación de integridad. No se guardó el respaldo."
              : "Integrity check failed. Backup was not saved.",
          );
        entries[document.path] = bytes;
        plan.manifest.files.push({
          path: document.path,
          bytes: bytes.length,
          sha256: hash,
        });
      }
      if (entries["Resumen-expedientes.xlsx"]) {
        const bytes = entries["Resumen-expedientes.xlsx"];
        const sha256 = Array.from(
          new Uint8Array(
            await crypto.subtle.digest("SHA-256", new Uint8Array(bytes)),
          ),
        )
          .map((b) => b.toString(16).padStart(2, "0"))
          .join("");
        plan.manifest.files.push({
          path: "Resumen-expedientes.xlsx",
          bytes: bytes.length,
          sha256,
        });
      }
      entries["manifest.json"] = strToU8(
        JSON.stringify(plan.manifest, null, 2),
      );
      entries["LEAME.txt"] = strToU8(
        "GLF - Copia del expediente de negocio. Datos JSON y archivos originales. Consulte manifest.json para integridad y alcance. No incluye Auth, secretos, corpus RAG ni configuración. No es un volcado transaccional de PostgreSQL.\n",
      );
      setMessage(es ? "Comprimiendo respaldo…" : "Compressing backup…");
      const packed = await new Promise<Uint8Array<ArrayBuffer>>(
        (resolve, reject) =>
          zip(entries, { level: 1 }, (error, result) =>
            error ? reject(error) : resolve(new Uint8Array(result)),
          ),
      );
      const blob = new Blob([packed], { type: "application/zip" });
      if (target) {
        const writable = await target.createWritable();
        try {
          await writable.write(blob);
          await writable.close();
        } catch (error) {
          await writable.abort();
          throw error;
        }
        setMessage(
          es
            ? "Respaldo guardado correctamente en la ubicación elegida."
            : "Backup saved successfully to the selected location.",
        );
      } else {
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = filename;
        link.click();
        setTimeout(() => URL.revokeObjectURL(url), 60000);
        setMessage(
          es
            ? "Archivo preparado. Compruebe que la descarga terminó antes de cerrar."
            : "File prepared. Check that the download finished before closing.",
        );
      }
    } catch (e) {
      const error = e as Error;
      setMessage(
        error.name === "AbortError"
          ? es
            ? "Guardado cancelado. Puede volver a intentarlo; sus datos no han cambiado."
            : "Save cancelled. You can try again; your data is unchanged."
          : error.name === "SecurityError" || error.name === "NotAllowedError"
            ? es
              ? "El navegador no permite guardar en esa ubicación. Elija otra ubicación o use Descargar ZIP."
              : "The browser does not allow saving to that location. Choose another location or use Download ZIP."
            : error.message,
      );
    } finally {
      flight.current = false;
      setBusy(false);
    }
  }
  const filtered = applications.filter(
    (a) =>
      (!call || a.call_id === call) && (!category || a.category === category),
  );
  const chosen =
    scope === "selected"
      ? filtered.filter((a) => selected.includes(a.id))
      : filtered;
  const visible = filtered.filter((a) =>
    (a.title + " " + a.reference_code + " " + a.proponent)
      .toLowerCase()
      .includes(search.toLowerCase()),
  );
  const ready =
    !busy && chosen.length > 0 && chosen.length <= 200 && content !== undefined;
  const callTitle = (id: string) => calls.find((c) => c.id === id)?.title || id;
  return (
    <>
      <h1>{es ? "Respaldos" : "Backups"}</h1>
      <section className="live-card">
        <h2>{es ? "1. Qué respaldar" : "1. What to back up"}</h2>
        <fieldset disabled={busy}>
          <legend>{es ? "Alcance del respaldo" : "Backup scope"}</legend>
          {(
            [
              [
                "all",
                es
                  ? "Todos los expedientes que coincidan con los filtros"
                  : "All matching applications",
              ],

              [
                "selected",
                es ? "Expedientes específicos" : "Specific applications",
              ],
            ] as const
          ).map(([value, label]) => (
            <label
              key={value}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: ".5rem",
                marginRight: "1.5rem",
                marginBottom: ".75rem",
              }}
            >
              <input
                style={{ width: "auto" }}
                type="radio"
                name="backup-scope"
                checked={scope === value}
                onChange={() => {
                  setScope(value);
                  setMessage("");
                }}
              />
              {label}
            </label>
          ))}
        </fieldset>
        {
          <label>
            {es ? "Convocatoria" : "Call"}
            <select
              disabled={busy}
              value={call}
              onChange={(e) => {
                setCall(e.target.value);
                setSelected([]);
                setMessage("");
              }}
            >
              <option value="">
                {es ? "Todas las convocatorias" : "All calls"}
              </option>
              {calls.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.title} (
                  {applications.filter((a) => a.call_id === c.id).length})
                </option>
              ))}
            </select>
          </label>
        }
        <label>
          {es ? "Categoría de subvención" : "Grant category"}
          <select
            disabled={busy}
            value={category}
            onChange={(e) => {
              setCategory(e.target.value);
              setSelected([]);
              setMessage("");
            }}
          >
            <option value="">
              {es ? "Todas las categorías" : "All categories"}
            </option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.title}
              </option>
            ))}
          </select>
        </label>
        <p>
          {filtered.length}{" "}
          {es
            ? "expedientes coinciden con los filtros."
            : "applications match the filters."}
        </p>
        {scope === "selected" && (
          <>
            <label>
              {es
                ? "Buscar por referencia o proyecto"
                : "Search reference or project"}
              <input
                value={search}
                disabled={busy}
                onChange={(e) => setSearch(e.target.value)}
              />
            </label>
            <p>
              {es ? "Seleccionados: " : "Selected: "}
              {selected.length}{" "}
              <button
                className="button secondary"
                disabled={busy || !selected.length}
                onClick={() => setSelected([])}
              >
                {es ? "Limpiar selección" : "Clear selection"}
              </button>
            </p>
            <div
              className="table-scroll"
              style={{ maxHeight: "360px", overflow: "auto" }}
            >
              <table>
                <thead>
                  <tr>
                    <th>{es ? "Elegir" : "Select"}</th>
                    <th>{es ? "Referencia" : "Reference"}</th>
                    <th>{es ? "Proyecto" : "Project"}</th>
                    <th>{es ? "Proponente" : "Applicant"}</th>
                    <th>{es ? "Estado" : "Status"}</th>
                    <th>{es ? "Convocatoria" : "Call"}</th>
                  </tr>
                </thead>
                <tbody>
                  {visible.map((a) => (
                    <tr key={a.id}>
                      <td>
                        <input
                          type="checkbox"
                          aria-label={
                            (es ? "Seleccionar " : "Select ") + a.reference_code
                          }
                          disabled={
                            busy ||
                            (!selected.includes(a.id) && selected.length >= 200)
                          }
                          checked={selected.includes(a.id)}
                          onChange={(e) =>
                            setSelected((current) =>
                              e.target.checked
                                ? [...current, a.id]
                                : current.filter((id) => id !== a.id),
                            )
                          }
                        />
                      </td>
                      <td>{a.reference_code}</td>
                      <td>{a.title}</td>
                      <td>{a.proponent || "—"}</td>
                      <td>{statusLabel(a.status, locale)}</td>
                      <td>{callTitle(a.call_id)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {!visible.length && (
              <p>
                {es
                  ? "No hay expedientes recibidos que coincidan con estos filtros."
                  : "No received applications match these filters."}
              </p>
            )}
          </>
        )}
        <p>
          {es ? "Expedientes incluidos: " : "Included applications: "}
          <strong>{chosen.length}</strong>
        </p>
        {chosen.length === 0 && (
          <p>
            {es
              ? "Seleccione expedientes recibidos para habilitar el respaldo. Los borradores aún no enviados no se incluyen."
              : "Select received applications to enable backup. Unsubmitted drafts are excluded."}
          </p>
        )}
        {chosen.length > 200 && (
          <p role="alert">
            {es
              ? "Elija una convocatoria o hasta 200 expedientes por copia."
              : "Choose a call or up to 200 applications per backup."}
          </p>
        )}
      </section>
      <section className="live-card">
        <h2>{es ? "2. Contenido y destino" : "2. Content and destination"}</h2>
        <label>
          {es ? "Contenido del respaldo" : "Backup content"}
          <select
            disabled={busy}
            value={content}
            onChange={(e) => setContent(e.target.value as typeof content)}
          >
            <option value="both">
              {es ? "Datos en Excel y documentos" : "Excel data and documents"}
            </option>
            <option value="data">{es ? "Datos en Excel" : "Excel data"}</option>
            <option value="documents">{es ? "Documentos" : "Documents"}</option>
          </select>
        </label>
        <fieldset disabled={busy}>
          <legend>{es ? "Destino" : "Destination"}</legend>
          <label
            style={{
              display: "inline-flex",
              gap: ".5rem",
              marginRight: "1.5rem",
            }}
          >
            <input
              style={{ width: "auto" }}
              type="radio"
              name="backup-destination"
              checked={destination === "download"}
              onChange={() => setDestination("download")}
            />
            {es ? "Descargar ZIP" : "Download ZIP"}
          </label>
          <label style={{ display: "inline-flex", gap: ".5rem" }}>
            <input
              style={{ width: "auto" }}
              type="radio"
              name="backup-destination"
              checked={destination === "file"}
              onChange={() => setDestination("file")}
            />
            {es ? "Guardar como…" : "Save as…"}
          </label>
        </fieldset>
        {destination === "file" && (
          <p>
            {es
              ? "Al pulsar Guardar respaldo como…, elija el nombre y la ubicación del archivo ZIP: una carpeta local, Google Drive sincronizado o un dispositivo externo. No se solicita acceso a toda la carpeta. Si su navegador no ofrece esta opción, se utilizará la descarga normal."
              : "Click Save backup as… to choose the ZIP filename and location: a local folder, synced Google Drive or external device. Access to the entire folder is not requested. Browsers without this option use a normal download."}
          </p>
        )}
      </section>
      <section className="live-card">
        <h2>{es ? "3. Revisar y respaldar" : "3. Review and back up"}</h2>
        <p>
          <strong>
            {es ? "Se respaldarán " : "Backup will include "}
            {chosen.length}
            {es ? " expedientes" : " applications"}
          </strong>
          {" · " +
            (call
              ? callTitle(call)
              : es
                ? "Todas las convocatorias"
                : "All calls") +
            " · " +
            (categories.find((c) => c.id === category)?.title ||
              (es ? "Todas las categorías" : "All categories")) +
            " · " +
            (content === "both"
              ? es
                ? "Excel y documentos"
                : "Excel and documents"
              : content === "data"
                ? "Excel"
                : es
                  ? "Documentos"
                  : "Documents")}{" "}
          ·{" "}
          {destination === "file"
            ? es
              ? "Elegir ubicación al guardar"
              : "Choose location when saving"
            : es
              ? "Descarga ZIP"
              : "ZIP download"}
        </p>
        <p>
          {es
            ? "El contenido corresponde a la opción seleccionada. Los datos incluyen Excel y registros JSON; los documentos incluyen los archivos originales. Se verifica la integridad de los archivos antes de guardar. El ZIP no tiene contraseña ni cifrado adicional."
            : "Content follows the selected option. Data includes Excel and JSON records; documents include original files. File integrity is checked before saving. The ZIP has no password or additional encryption."}
        </p>
        <button
          className="button"
          disabled={!ready}
          aria-busy={busy}
          onClick={backup}
        >
          <ActionLabel
            busy={busy}
            pendingLabel={es ? "Preparando respaldo…" : "Preparing backup…"}
          >
            {destination === "file"
              ? es
                ? "Guardar respaldo como…"
                : "Save backup as…"
              : es
                ? "Crear y descargar respaldo"
                : "Create and download backup"}
          </ActionLabel>
        </button>
        <p role="status" aria-live="polite">
          {message}
        </p>
      </section>
      <section className="live-card">
        <h2>{es ? "Estado de la automatización" : "Automation status"}</h2>
        <p>
          {es
            ? "Copias automáticas: no activadas. Guardar un archivo local no permite ejecutar tareas con el navegador cerrado. La programación diaria y semanal requiere un servicio de respaldo configurado. Las copias manuales no se eliminan automáticamente."
            : "Automatic backups: not enabled. Saving a local file cannot run tasks when the browser is closed. Daily and weekly schedules require a configured backup service. Manual backups are not automatically deleted."}
        </p>
        <p>
          {es
            ? "Esta copia conserva el expediente de negocio. No sustituye el respaldo técnico de Supabase, las cuentas de autenticación ni la configuración del despliegue."
            : "This preserves the business dossier. It does not replace technical Supabase backups, authentication accounts or deployment configuration."}
        </p>
      </section>
    </>
  );
}
