"use client";
import { Trash2 } from "lucide-react";
import { useActionState, useState } from "react";
import {
  changeAccount,
  type AccountActionState,
} from "@/app/internal/users/account-actions";
import { accountErrors, type ManagedAccount } from "@/lib/account-management";
import { SubmitButton } from "./submit-button";
import { roleLabels } from "@/lib/fields";
import type { Role } from "@/lib/domain";
function ErrorMessage({ code, es }: { code?: string; es: boolean }) {
  return code ? (
    <p role="alert" className="auth-error">
      {
        (accountErrors[code] || accountErrors.GLF_SERVICE_UNAVAILABLE)[
          es ? 0 : 1
        ]
      }
    </p>
  ) : null;
}
function AccountControls({
  account,
  es,
  administrator,
  self,
}: {
  account: ManagedAccount;
  es: boolean;
  administrator: boolean;
  self: boolean;
}) {
  const [operation, setOperation] = useState("");
  const [state, action] = useActionState(
    changeAccount,
    {} as AccountActionState,
  );
  const labels: Record<string, string> = es
    ? {
        deactivate: "Desactivar",
        reactivate: "Reactivar",
        archive: "Archivar",
        unarchive: "Quitar del archivo",
        revoke_sessions: "Cerrar todas las sesiones",
        delete: "Eliminar definitivamente",
      }
    : {
        deactivate: "Deactivate",
        reactivate: "Reactivate",
        archive: "Archive",
        unarchive: "Unarchive",
        revoke_sessions: "Close all sessions",
        delete: "Permanently delete",
      };
  const options = account.archived_at
    ? ["unarchive", ...(administrator ? ["delete"] : [])]
    : account.active
      ? ["deactivate", "revoke_sessions"]
      : ["reactivate", "archive"];
  return (
    <article className="live-card account-card">
      <div className="account-row">
        <div>
          <h3>{account.full_name || account.email}</h3>
          <p>{account.email}</p>
          <p>
            {roleLabels[account.role as Role]?.[es ? 0 : 1]} ·{" "}
            {account.archived_at
              ? es
                ? "Archivado"
                : "Archived"
              : account.active
                ? es
                  ? "Activo"
                  : "Active"
                : es
                  ? "Inactivo"
                  : "Inactive"}
          </p>
        </div>
        {!self && (
          <label>
            {es ? "Gestionar acceso" : "Manage access"}
            <select
              value={operation}
              onChange={(e) => setOperation(e.target.value)}
            >
              <option value="">
                {es ? "Seleccione una acción" : "Select an action"}
              </option>
              {options.map((o) => (
                <option key={o} value={o}>
                  {labels[o]}
                </option>
              ))}
            </select>
          </label>
        )}
      </div>
      {self && (
        <p>
          {es
            ? "Esta es su cuenta. No puede modificar su propio acceso aquí."
            : "This is your account. You cannot change your own access here."}
        </p>
      )}
      {operation && !state.ok && (
        <form
          action={action}
          className="live-form"
          key={operation + account.account_revision}
        >
          <input type="hidden" name="id" value={account.id} />
          <input
            type="hidden"
            name="revision"
            value={account.account_revision}
          />
          <input type="hidden" name="operation" value={operation} />
          <p className={operation === "delete" ? "auth-error" : ""}>
            {operation === "delete"
              ? es
                ? "Esta eliminación no se puede deshacer. Solo se permite si no existen expedientes, documentos ni actuaciones vinculadas."
                : "Deletion cannot be undone. It is allowed only if no applications, documents or activity are linked."
              : operation === "revoke_sessions"
                ? es
                  ? "Se bloquearán las sesiones actuales. La persona deberá iniciar sesión nuevamente."
                  : "Current sessions will be blocked. The person must sign in again."
                : es
                  ? "Se conservarán los expedientes y el historial de la cuenta."
                  : "Applications and account history will be preserved."}
          </p>
          <label>
            <span className="field-label">{es ? "Motivo *" : "Reason *"}</span>
            <textarea
              name="reason"
              required
              minLength={3}
              maxLength={500}
              spellCheck
              lang={es ? "es" : "en"}
            />
          </label>
          <label className="checkbox">
            <input type="checkbox" name="confirmed" required />
            {es
              ? `Confirmo: ${labels[operation]} — ${account.email}`
              : `I confirm: ${labels[operation]} — ${account.email}`}
          </label>
          <SubmitButton
            pendingLabel={es ? "Procesando…" : "Processing…"}
            className={
              operation === "delete" ? "button danger" : "button secondary"
            }
          >
            {operation === "delete" && <Trash2 size={16} aria-hidden="true" />}
            {labels[operation]}
          </SubmitButton>
          <ErrorMessage code={state.error} es={es} />
        </form>
      )}
      {state.ok && (
        <p role="status">
          {es
            ? "Operación completada. El listado se ha actualizado."
            : "Operation completed. The list has been updated."}
        </p>
      )}
    </article>
  );
}
export function AccountManagement({
  accounts,
  es,
  administrator,
  userId,
}: {
  accounts: ManagedAccount[];
  es: boolean;
  administrator: boolean;
  userId: string;
}) {
  const [search, setSearch] = useState(""),
    [filter, setFilter] = useState("unarchived"),
    [role, setRole] = useState("all");
  const shown = accounts.filter((a) => {
    return (
      (!search ||
        `${a.full_name} ${a.email}`
          .toLocaleLowerCase()
          .includes(search.toLocaleLowerCase())) &&
      (role === "all" || a.role === role) &&
      (filter === "all" ||
        (filter === "archived"
          ? !!a.archived_at
          : filter === "active"
            ? a.active && !a.archived_at
            : filter === "inactive"
              ? !a.active && !a.archived_at
              : !a.archived_at))
    );
  });
  return (
    <section>
      <h2>{es ? "Cuentas existentes" : "Existing accounts"}</h2>
      <div className="live-card live-form two-columns">
        <label>
          {es ? "Buscar por nombre o correo" : "Search name or email"}
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </label>
        <label>
          {es ? "Estado" : "Status"}
          <select value={filter} onChange={(e) => setFilter(e.target.value)}>
            {(es
              ? [
                  ["unarchived", "Sin archivar"],
                  ["active", "Activos"],
                  ["inactive", "Inactivos"],
                  ["archived", "Archivados"],
                  ["all", "Todos"],
                ]
              : [
                  ["unarchived", "Unarchived"],
                  ["active", "Active"],
                  ["inactive", "Inactive"],
                  ["archived", "Archived"],
                  ["all", "All"],
                ]
            ).map(([v, t]) => (
              <option key={v} value={v}>
                {t}
              </option>
            ))}
          </select>
        </label>
        <label>
          {es ? "Rol" : "Role"}
          <select value={role} onChange={(e) => setRole(e.target.value)}>
            <option value="all">{es ? "Todos" : "All"}</option>
            {Object.entries(roleLabels).map(([v, t]) => (
              <option key={v} value={v}>
                {t[es ? 0 : 1]}
              </option>
            ))}
          </select>
        </label>
      </div>
      <p aria-live="polite">
        {shown.length}{" "}
        {es
          ? shown.length === 1
            ? "cuenta"
            : "cuentas"
          : shown.length === 1
            ? "account"
            : "accounts"}
      </p>
      {shown.map((a) => (
        <AccountControls
          key={a.id + ":" + a.account_revision}
          account={a}
          es={es}
          administrator={administrator}
          self={a.id === userId}
        />
      ))}
    </section>
  );
}
