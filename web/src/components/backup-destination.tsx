"use client";
import {
  Download,
  Database,
  FileSpreadsheet,
  FolderArchive,
} from "lucide-react";
import { ActionLabel } from "./submit-button";
import { useRef, useState } from "react";
import { zip } from "fflate";
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
  const [content, setContent] = useState<"data" | "both">("data");
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
        (content === "data" ? ".xlsx" : ".zip");
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
                description: content === "data" ? "Excel" : "ZIP",
                accept:
                  content === "data"
                    ? {
                        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet":
                          [".xlsx"],
                      }
                    : { "application/zip": [".zip"] },
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
      const returnedIds = (plan.records.applications || []).map(
        (a: { id: string }) => a.id,
      );
      if (
        returnedIds.length !== chosen.length ||
        chosen.some((a) => !returnedIds.includes(a.id))
      )
        throw new Error(
          es
            ? "La cantidad de expedientes no coincide con la selección. Actualice la página y vuelva a intentar."
            : "Application count does not match your selection. Refresh and try again.",
        );
      const workbook = summaryWorkbook(plan.records, locale);
      const entries: Record<string, Uint8Array> = {
        "Listado-expedientes.xlsx": workbook,
      };
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
      let blob: Blob;
      if (content === "data") {
        blob = new Blob([new Uint8Array(workbook)], {
          type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        });
      } else {
        setMessage(
          es ? "Comprimiendo expedientes…" : "Compressing applications…",
        );
        const packed = await new Promise<Uint8Array<ArrayBuffer>>(
          (resolve, reject) =>
            zip(entries, { level: 1 }, (error, result) =>
              error ? reject(error) : resolve(new Uint8Array(result)),
            ),
        );
        blob = new Blob([packed], { type: "application/zip" });
      }
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
              ? "El navegador no permite guardar en esa ubicación. Elija otra ubicación o use Descargar archivo."
              : "The browser does not allow saving to that location. Choose another location or use Download file."
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
  const ready = !busy && chosen.length > 0 && chosen.length <= 200;
  const callTitle = (id: string) => calls.find((c) => c.id === id)?.title || id;
  return (
    <>
      <h1>{es ? "Descargas y respaldos" : "Downloads and backups"}</h1>
      <div className="backup-options">
        <button
          type="button"
          className={
            "live-card backup-option " + (content === "data" ? "selected" : "")
          }
          aria-pressed={content === "data"}
          disabled={busy}
          onClick={() => {
            setContent("data");
            setMessage("");
          }}
        >
          <FileSpreadsheet aria-hidden size={26} />
          <strong>
            {es ? "Descargar listado en Excel" : "Download Excel list"}
          </strong>
          <span>
            {es
              ? "Un archivo .xlsx con una fila por expediente. Para consultar, analizar o compartir información."
              : "One .xlsx file with one row per application. For consulting, analysing or sharing information."}
          </span>
        </button>
        <button
          type="button"
          className={
            "live-card backup-option " + (content === "both" ? "selected" : "")
          }
          aria-pressed={content === "both"}
          disabled={busy}
          onClick={() => {
            setContent("both");
            setMessage("");
          }}
        >
          <FolderArchive aria-hidden size={26} />
          <strong>
            {es ? "Descargar expedientes" : "Download applications"}
          </strong>
          <span>
            {es
              ? "Un ZIP con los documentos y el listado Excel de los expedientes elegidos."
              : "A ZIP with the documents and Excel list of your selected applications."}
          </span>
        </button>
        <section className="live-card backup-option">
          <Database aria-hidden size={26} />
          <strong>
            {es ? "Respaldo completo del sistema" : "Full system backup"}
          </strong>
          <span>
            {es
              ? "Base de datos y todos los documentos para recuperar el sistema. Exclusivo para administradores."
              : "Database and all documents for system recovery. Administrators only."}
          </span>
          <strong>{es ? "No configurado" : "Not configured"}</strong>
          <span>
            {es
              ? "Último respaldo completo: no registrado. Se habilitará cuando exista un mecanismo de recuperación verificado. Las descargas de esta pantalla no sustituyen ese respaldo."
              : "Last full backup: not recorded. Available once a verified recovery mechanism is configured. Downloads on this page do not replace a full backup."}
          </span>
          <button type="button" className="button secondary" disabled>
            {es ? "Preparar respaldo completo" : "Prepare full backup"}
          </button>
        </section>
      </div>
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
            {es ? "Descargar archivo" : "Download file"}
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
              ? "Al pulsar Guardar respaldo como…, elija el nombre y la ubicación del archivo: una carpeta local, Google Drive sincronizado o un dispositivo externo. No se solicita acceso a toda la carpeta. Si su navegador no ofrece esta opción, se utilizará la descarga normal."
              : "Click Save backup as… to choose the filename and location: a local folder, synced Google Drive or external device. Access to the entire folder is not requested. Browsers without this option use a normal download."}
          </p>
        )}
      </section>
      <section className="live-card">
        <h2>{es ? "3. Revisar y descargar" : "3. Review and download"}</h2>
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
              : "Excel")}{" "}
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
          {content === "data"
            ? es
              ? `Se generará un archivo Excel con ${chosen.length} filas de expedientes, más la cabecera. No incluye JSON ni documentos.`
              : `One Excel file with ${chosen.length} application rows plus the header. No JSON or documents.`
            : es
              ? `Se generará un ZIP con los documentos y un Excel de ${chosen.length} expedientes. No es un respaldo completo del sistema.`
              : `A ZIP with documents and an Excel list of ${chosen.length} applications. This is not a full system backup.`}
        </p>
        <ul>
          {chosen.map((a) => (
            <li key={a.id}>
              {a.reference_code} · {a.title}
            </li>
          ))}
        </ul>
        <button
          className="button primary backup-download"
          disabled={!ready}
          aria-busy={busy}
          onClick={backup}
        >
          <ActionLabel
            busy={busy}
            pendingLabel={es ? "Procesando…" : "Processing…"}
          >
            <Download size={18} aria-hidden />
            {content === "data"
              ? es
                ? "Guardar Excel…"
                : "Save Excel…"
              : es
                ? "Guardar expedientes…"
                : "Save applications…"}
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
