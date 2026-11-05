"use client";
import { useRef, useState, useId } from "react";
import { UploadCloud } from "lucide-react";
import { uploadSelectionError } from "@/lib/upload-selection";
import type { Locale } from "@/lib/domain";
export function FileDropField({
  locale,
  accept,
  disabled = false,
  onChange,
  required = true,
  label,
}: {
  locale: Locale;
  accept: string;
  disabled?: boolean;
  onChange?: () => void;
  required?: boolean;
  label?: string;
}) {
  const es = locale === "es",
    ref = useRef<HTMLInputElement>(null),
    id = useId();
  const [dragging, setDragging] = useState(false),
    [error, setError] = useState("");
  function check(files: File[]) {
    const code = uploadSelectionError(files, accept);
    ref.current?.setCustomValidity(
      code
        ? es
          ? "Revise el archivo seleccionado."
          : "Check the selected file."
        : "",
    );
    setError(
      code === "single"
        ? es
          ? "Seleccione un solo archivo."
          : "Select one file."
        : code === "size"
          ? es
            ? "El archivo debe tener contenido y no superar 4 MB."
            : "The file must not be empty or exceed 4 MB."
          : code === "format"
            ? es
              ? "El formato no está permitido. Revise los formatos indicados."
              : "Unsupported format. Check the listed formats."
            : "",
    );
    return !code;
  }
  return (
    <div
      className={`file-drop-zone ${dragging ? "is-dragging" : ""} ${disabled ? "is-disabled" : ""}`}
      onDragOver={(e) => {
        e.preventDefault();
        if (!disabled) setDragging(true);
      }}
      onDragLeave={() => setDragging(false)}
      onDrop={(e) => {
        e.preventDefault();
        setDragging(false);
        if (disabled) return;
        const files = Array.from(e.dataTransfer.files);
        onChange?.();
        if (!check(files)) return;
        const transfer = new DataTransfer();
        transfer.items.add(files[0]);
        if (ref.current) {
          ref.current.files = transfer.files;
        }
      }}
    >
      <span className="file-drop-hint" id={id}>
        <UploadCloud size={23} aria-hidden="true" />
        {es
          ? "Arrastre un archivo aquí o selecciónelo desde su dispositivo"
          : "Drop one file here or select it from your device"}
      </span>
      <input
        ref={ref}
        type="file"
        name="file"
        accept={accept}
        required={required}
        disabled={disabled}
        aria-label={
          label
            ? `${es ? "Seleccionar archivo" : "Select file"}: ${label}`
            : es
              ? "Seleccionar archivo"
              : "Select file"
        }
        aria-describedby={id}
        aria-invalid={Boolean(error)}
        onChange={(e) => {
          const files = Array.from(e.target.files || []);
          if (files.length) {
            if (!check(files)) e.target.value = "";
          } else {
            setError("");
            e.target.setCustomValidity("");
          }
          onChange?.();
        }}
      />
      <small>
        {es
          ? "Un archivo por carga · máximo 4 MB. Puede reemplazarlo antes de guardarlo."
          : "One file per upload · maximum 4 MB. You can replace it before saving."}
      </small>
      {error && (
        <span className="auth-error" role="alert">
          {error}
        </span>
      )}
    </div>
  );
}
