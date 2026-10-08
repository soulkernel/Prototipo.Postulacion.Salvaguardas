"use client";
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
}: {
  userId: string;
  locale: Locale;
  calls: { id: string; title: string }[];
}) {
  const es = locale === "es";
  const [folder, setFolder] = useState<Destination>();
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
      });
      await destinationStore(userId, handle);
      setFolder(handle);
      setMessage(
        es
          ? "Destino guardado en este navegador. Google Drive sincronizará los archivos si esta carpeta pertenece a su unidad sincronizada."
          : "Destination saved in this browser. Google Drive will sync files if this is a synced folder.",
      );
    } catch (error) {
      if ((error as Error).name !== "AbortError")
        setMessage(
          es
            ? "No se pudo guardar el destino. Revise el permiso de la carpeta."
            : "Unable to save destination. Check folder permission.",
        );
    }
  }
  async function backup(toFolder: boolean) {
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
      const response = await fetch(
        "/internal/backups/export" +
          (call ? "?call=" + encodeURIComponent(call) : ""),
        { cache: "no-store" },
      );
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
  return (
    <>
      <h1>{es ? "Respaldos" : "Backups"}</h1>
      <section className="live-card">
        <h2>{es ? "Destino del respaldo" : "Backup destination"}</h2>
        <p>
          {es
            ? "Seleccione una carpeta de su computador, de Google Drive para escritorio o de un dispositivo externo conectado. No se solicita ni se guarda la contraseña de Google. El destino se recuerda únicamente en este navegador."
            : "Select a local folder, a Google Drive for desktop folder or a connected external device folder. Your Google password is never requested or stored. The destination is remembered only in this browser."}
        </p>
        <p>
          <strong>{es ? "Carpeta: " : "Folder: "}</strong>
          {folder?.name || (es ? "Sin seleccionar" : "Not selected")}
        </p>
        <button className="button secondary" disabled={busy} onClick={choose}>
          {es ? "Seleccionar carpeta" : "Select folder"}
        </button>
      </section>
      <section className="live-card">
        <h2>{es ? "Crear copia manual" : "Create manual backup"}</h2>
        <label>
          {es ? "Alcance" : "Scope"}
          <select
            value={call}
            onChange={(e) => setCall(e.target.value)}
            disabled={busy}
          >
            <option value="">
              {es
                ? "Todos los expedientes recibidos"
                : "All received applications"}
            </option>
            {calls.map((c) => (
              <option key={c.id} value={c.id}>
                {c.title}
              </option>
            ))}
          </select>
        </label>
        <p>
          {es
            ? "Incluye los datos del expediente, versiones remitidas, revisiones, decisiones y archivos originales disponibles. Se verifican las huellas SHA-256 de los archivos. El ZIP no lleva contraseña ni cifrado adicional."
            : "Includes application data, submitted versions, reviews, decisions and available original files. File SHA-256 fingerprints are verified. The ZIP has no password or additional encryption."}
        </p>
        <div className="live-nav">
          <button
            className="button"
            disabled={busy || !folder}
            onClick={() => backup(true)}
          >
            {busy
              ? es
                ? "Preparando…"
                : "Preparing…"
              : es
                ? "Respaldar en carpeta"
                : "Back up to folder"}
          </button>
          <button
            className="button secondary"
            disabled={busy}
            onClick={() => backup(false)}
          >
            {es ? "Descargar ZIP" : "Download ZIP"}
          </button>
        </div>
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
