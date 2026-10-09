"use client";
import { ActionLabel } from "./submit-button";
import { useEffect, useState } from "react";
import { zip, strToU8 } from "fflate";
import type { Locale } from "@/lib/domain";

type Destination = {
  name: string;
  getDirectoryHandle(
    name: string,
    options: { create: boolean },
  ): Promise<Destination>;
  getFileHandle(
    name: string,
    options: { create: boolean },
  ): Promise<{
    createWritable(): Promise<{
      write(data: Blob): Promise<void>;
      close(): Promise<void>;
      abort(): Promise<void>;
    }>;
  }>;
  requestPermission(options: { mode: string }): Promise<string>;
};
const storeName = "glf-backup-destinations";
async function destinationStore(
  key: string,
  value?: Destination,
): Promise<Destination | undefined> {
  return new Promise((resolve, reject) => {
    const opening = indexedDB.open(storeName, 1);
    opening.onupgradeneeded = () => opening.result.createObjectStore("handles");
    opening.onerror = () => reject(opening.error);
    opening.onsuccess = () => {
      const db = opening.result;
      const transaction = db.transaction(
        "handles",
        value ? "readwrite" : "readonly",
      );
      const request = value
        ? transaction.objectStore("handles").put(value, key)
        : transaction.objectStore("handles").get(key);
      let result: Destination | undefined;
      request.onsuccess = () => {
        result = value || request.result;
      };
      transaction.oncomplete = () => {
        db.close();
        resolve(result);
      };
      transaction.onerror = () => {
        db.close();
        reject(transaction.error);
      };
    };
  });
}
export function BackupDestination({
  userId,
  locale,
  calls,
  applications,
}: {
  applications: {
    id: string;
    call_id: string;
    reference_code: string;
    title: string;
  }[];
  userId: string;
  locale: Locale;
  calls: { id: string; title: string }[];
}) {
  const es = locale === "es";
  const [folder, setFolder] = useState<Destination>();
  const [scope, setScope] = useState<"all" | "call" | "selected">("all");
  const [selected, setSelected] = useState<string[]>([]);
  const [search, setSearch] = useState("");
  const [destination, setDestination] = useState<"folder" | "download">(
    "download",
  );
  const [folderMessage, setFolderMessage] = useState("");
  const [call, setCall] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  useEffect(() => {
    destinationStore(userId)
      .then(setFolder)
      .catch(() => {});
  }, [userId]);
  async function choose() {
    const picker = (
      window as unknown as {
        showDirectoryPicker?: (options: {
          mode: string;
          id: string;
          startIn: string;
        }) => Promise<Destination>;
      }
    ).showDirectoryPicker;
    if (!picker) {
      setMessage(
        es
          ? "Use Chrome o Edge para seleccionar una carpeta. También puede descargar el respaldo y guardarlo manualmente."
          : "Use Chrome or Edge to select a folder. You can also download and save the backup manually.",
      );
      return;
    }
    try {
      const handle = await picker.call(window, {
        mode: "readwrite",
        id: "glf-backups",
        startIn: "documents",
      });
      await destinationStore(userId, handle);
      setFolder(handle);
      setDestination("folder");
      setFolderMessage(
        es
          ? "Destino guardado en este navegador. Google Drive sincronizará los archivos si esta carpeta pertenece a su unidad sincronizada."
          : "Destination saved in this browser. Google Drive will sync files if this is a synced folder.",
      );
    } catch (error) {
      if ((error as Error).name !== "AbortError")
        setFolderMessage(
          es
            ? "No se pudo guardar el destino. Seleccione una subcarpeta dedicada y revise su permiso de escritura."
            : "Unable to save destination. Check folder permission.",
        );
    }
  }
  async function backup(toFolder: boolean) {
    if (!ready) return;
    setBusy(true);
    setMessage(es ? "Preparando el respaldo…" : "Preparing backup…");
    try {
      if (
        toFolder &&
        (!folder ||
          (await folder.requestPermission({ mode: "readwrite" })) !== "granted")
      )
        throw new Error(
          es
            ? "Autorice el acceso a la carpeta seleccionada."
            : "Allow access to the selected folder.",
        );
      const selection =
        scope === "call"
          ? { scope, call }
          : scope === "selected"
            ? { scope, applications: selected }
            : { scope };
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
      const filename =
        "GLF-respaldo-" +
        new Date().toISOString().replace(/[:.]/g, "-") +
        ".zip";
      if (toFolder && folder) {
        const subfolder = await folder.getDirectoryHandle("GLF-Respaldos", {
          create: true,
        });
        const file = await subfolder.getFileHandle(filename, { create: true });
        const writable = await file.createWritable();
        try {
          await writable.write(blob);
          await writable.close();
        } catch (e) {
          await writable.abort();
          throw e;
        }
        setMessage(
          es
            ? "Respaldo guardado en " +
                folder.name +
                " / GLF-Respaldos / " +
                filename +
                ". La sincronización depende de Google Drive."
            : "Backup saved in " +
                folder.name +
                " / GLF-Respaldos / " +
                filename +
                ". Synchronization depends on Google Drive.",
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
      setMessage((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  const chosen =
    scope === "all"
      ? applications
      : scope === "call"
        ? applications.filter((a) => a.call_id === call)
        : applications.filter((a) => selected.includes(a.id));
  const visible = applications.filter(
    (a) =>
      (!call || a.call_id === call) &&
      (a.title + " " + a.reference_code)
        .toLowerCase()
        .includes(search.toLowerCase()),
  );
  const ready =
    !busy &&
    chosen.length > 0 &&
    chosen.length <= 200 &&
    (scope !== "call" || !!call) &&
    (destination !== "folder" || !!folder);
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
                  ? "Todos los expedientes recibidos"
                  : "All received applications",
              ],
              ["call", es ? "Una convocatoria" : "One call"],
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
        {scope !== "all" && (
          <label>
            {es ? "Convocatoria" : "Call"}
            <select
              disabled={busy}
              value={call}
              onChange={(e) => {
                setCall(e.target.value);
                setMessage("");
              }}
            >
              <option value="">
                {scope === "call"
                  ? es
                    ? "Seleccione una convocatoria"
                    : "Select a call"
                  : es
                    ? "Todas las convocatorias"
                    : "All calls"}
              </option>
              {calls.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.title} (
                  {applications.filter((a) => a.call_id === c.id).length})
                </option>
              ))}
            </select>
          </label>
        )}
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
        <h2>{es ? "2. Dónde guardar" : "2. Where to save"}</h2>
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
              checked={destination === "folder"}
              onChange={() => setDestination("folder")}
            />
            {es ? "Guardar en una carpeta" : "Save to folder"}
          </label>
        </fieldset>
        {destination === "folder" && (
          <>
            <p>
              {es
                ? "Seleccione una subcarpeta dedicada en su computador, Google Drive sincronizado o dispositivo externo; por ejemplo, Respaldos GLF. Chrome puede bloquear la raíz de una unidad y las carpetas protegidas del sistema. Si aparece ese aviso, elija otra carpeta."
                : "Select a dedicated subfolder on your computer, synced Google Drive or external device, for example GLF Backups. Chrome may block a drive root or protected system folders. If that warning appears, choose another folder."}
            </p>
            <p>
              <strong>{es ? "Carpeta: " : "Folder: "}</strong>
              {folder?.name || (es ? "Sin seleccionar" : "Not selected")}
            </p>
            <button
              className="button secondary"
              disabled={busy}
              onClick={choose}
            >
              {folder
                ? es
                  ? "Cambiar carpeta"
                  : "Change folder"
                : es
                  ? "Seleccionar carpeta"
                  : "Select folder"}
            </button>
            <p role="status">{folderMessage}</p>
            <p>
              {es
                ? "No se solicita la contraseña de Google. El destino se recuerda por usuario en este navegador."
                : "Google passwords are not requested. The destination is remembered per user in this browser."}
            </p>
          </>
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
          {scope === "call" && call ? " · " + callTitle(call) : ""} ·{" "}
          {destination === "folder"
            ? folder?.name ||
              (es ? "Seleccione una carpeta" : "Select a folder")
            : es
              ? "Descarga ZIP"
              : "ZIP download"}
        </p>
        <p>
          {es
            ? "Incluye datos, versiones remitidas, revisiones, decisiones y archivos originales. Se verifica la integridad de los archivos antes de guardar. El ZIP no tiene contraseña ni cifrado adicional."
            : "Includes data, submitted versions, reviews, decisions and original files. File integrity is checked before saving. The ZIP has no password or additional encryption."}
        </p>
        <button
          className="button"
          disabled={!ready}
          aria-busy={busy}
          onClick={() => backup(destination === "folder")}
        >
          <ActionLabel
            busy={busy}
            pendingLabel={es ? "Preparando respaldo…" : "Preparing backup…"}
          >
            {destination === "folder"
              ? es
                ? "Respaldar en carpeta"
                : "Back up to folder"
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
            ? "Copias automáticas: no activadas. Una carpeta seleccionada no permite ejecutar tareas con el navegador cerrado. La programación diaria y semanal requiere un servicio de respaldo configurado. Las copias manuales no se eliminan automáticamente."
            : "Automatic backups: not enabled. A selected folder cannot run tasks when the browser is closed. Daily and weekly schedules require a configured backup service. Manual backups are not automatically deleted."}
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
