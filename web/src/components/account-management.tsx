"use client";
import { useActionState, useState } from "react";
import { useRouter } from "next/navigation";
import {
  changeAccount,
  createAcademicAccount,
  checkAccountService,
  type AccountActionState,
} from "@/app/internal/users/account-actions";
import { accountErrors, type ManagedAccount } from "@/lib/account-management";
import { SubmitButton } from "./submit-button";
import { roleLabels } from "@/lib/fields";
import type { Role } from "@/lib/domain";
import Link from "./feedback-link";
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
  requestTime,
}: {
  account: ManagedAccount;
  es: boolean;
  administrator: boolean;
  self: boolean;
  requestTime: number;
}) {
  const [operation, setOperation] = useState("");
  const [state, action] = useActionState(
    changeAccount,
    {} as AccountActionState,
  );
  const expired =
    account.access_kind === "academic" &&
    Date.parse(account.access_expires_at || "") <= requestTime;
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
      : [...(!expired ? ["reactivate"] : []), "archive"];
  return (
    <article className="live-card account-card">
      <div className="account-row">
        <div>
          <h3>{account.full_name || account.email}</h3>
          <p>{account.email}</p>
          <p>
            {account.access_kind === "academic"
              ? es
                ? "Evaluador académico"
                : "Academic evaluator"
              : roleLabels[account.role as Role]?.[es ? 0 : 1]}{" "}
            ·{" "}
            {account.archived_at
              ? es
                ? "Archivado"
                : "Archived"
              : expired
                ? es
                  ? "Vencido"
                  : "Expired"
                : account.active
                  ? es
                    ? "Activo"
                    : "Active"
                  : es
                    ? "Inactivo"
                    : "Inactive"}
          </p>
          {account.access_expires_at && (
            <p>
              {es ? "Vence: " : "Expires: "}
              {new Intl.DateTimeFormat(es ? "es" : "en", {
                dateStyle: "long",
                timeZone: "Pacific/Galapagos",
              }).format(new Date(account.access_expires_at))}
            </p>
          )}
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
            {es ? "Motivo *" : "Reason *"}
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
              operation === "delete"
                ? "button danger-outline"
                : "button secondary"
            }
          >
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
  requestTime,
}: {
  accounts: ManagedAccount[];
  es: boolean;
  administrator: boolean;
  userId: string;
  requestTime: number;
}) {
  const [search, setSearch] = useState(""),
    [filter, setFilter] = useState("unarchived"),
    [kind, setKind] = useState("all"),
    [role, setRole] = useState("all");
  const shown = accounts.filter((a) => {
    const expired =
      a.access_kind === "academic" &&
      Date.parse(a.access_expires_at || "") <= requestTime;
    return (
      (!search ||
        `${a.full_name} ${a.email}`
          .toLocaleLowerCase()
          .includes(search.toLocaleLowerCase())) &&
      (kind === "all" || a.access_kind === kind) &&
      (role === "all" || a.role === role) &&
      (filter === "all" ||
        (filter === "archived"
          ? !!a.archived_at
          : filter === "active"
            ? a.active && !expired && !a.archived_at
            : filter === "inactive"
              ? (!a.active || expired) && !a.archived_at
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
                  ["inactive", "Inactivos o vencidos"],
                  ["archived", "Archivados"],
                  ["all", "Todos"],
                ]
              : [
                  ["unarchived", "Unarchived"],
                  ["active", "Active"],
                  ["inactive", "Inactive or expired"],
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
          {es ? "Tipo de acceso" : "Access type"}
          <select value={kind} onChange={(e) => setKind(e.target.value)}>
            <option value="all">{es ? "Todos" : "All"}</option>
            <option value="standard">{es ? "Habitual" : "Standard"}</option>
            <option value="academic">{es ? "Académico" : "Academic"}</option>
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
        {shown.length} {es ? "cuentas" : "accounts"}
      </p>
      {shown.map((a) => (
        <AccountControls
          key={a.id + ":" + a.account_revision}
          account={a}
          es={es}
          administrator={administrator}
          self={a.id === userId}
          requestTime={requestTime}
        />
      ))}
    </section>
  );
}
export function AcademicAccountForm({ es }: { es: boolean }) {
  const [service, serviceAction] = useActionState(
    checkAccountService,
    {} as AccountActionState,
  );
  const [state, action] = useActionState(
    createAcademicAccount,
    {} as AccountActionState,
  );
  const [hidden, setHidden] = useState(false);
  const router = useRouter();
  return (
    <section className="live-card">
      <h2>
        {es
          ? "Crear acceso académico temporal"
          : "Create temporary academic access"}
      </h2>
      <p>
        {es
          ? "Vigencia: tres meses desde su creación. Ingreso con correo y contraseña, sin doble factor. Solo ejemplos de evaluación y consultas RAG; no concede acceso a expedientes institucionales."
          : "Valid for three months from creation. Email/password sign-in without MFA. Evaluation examples and RAG queries only; no institutional application access."}
      </p>
      <Link href="/evaluation">
        {es ? "Vista previa del acceso académico" : "Preview academic access"}
      </Link>
      <form action={serviceAction} className="live-actions">
        <SubmitButton
          className="button secondary"
          pendingLabel={es ? "Verificando…" : "Checking…"}
        >
          {es ? "Verificar servicio de cuentas" : "Check account service"}
        </SubmitButton>
        {service.ok && (
          <span role="status">
            {es ? "Servicio disponible" : "Service available"}
          </span>
        )}
        <ErrorMessage code={service.error} es={es} />
      </form>
      {!state.ok ? (
        <form action={action} className="live-form">
          <label>
            {es ? "Nombre completo *" : "Full name *"}
            <input
              name="full_name"
              required
              minLength={2}
              maxLength={200}
              autoComplete="off"
            />
          </label>
          <label>
            {es ? "Correo electrónico *" : "Email *"}
            <input
              name="email"
              type="email"
              required
              maxLength={254}
              autoComplete="off"
            />
          </label>
          <label className="checkbox">
            <input name="confirmed" type="checkbox" required />
            {es
              ? "Confirmo el correo y autorizo crear este acceso de evaluación. No se enviará ningún correo automáticamente."
              : "I confirm the email and authorize evaluation access. No email will be sent automatically."}
          </label>
          <SubmitButton
            className="button primary"
            pendingLabel={es ? "Creando acceso…" : "Creating access…"}
          >
            {es ? "Crear acceso por tres meses" : "Create three-month access"}
          </SubmitButton>
          <ErrorMessage code={state.error} es={es} />
        </form>
      ) : (
        <div role="status">
          <p>
            {es
              ? "Cuenta creada. Guarde la contraseña antes de salir; no se mostrará nuevamente."
              : "Account created. Save the password before leaving; it will not be shown again."}
          </p>
          <p>{state.email}</p>
          <p>
            {es ? "Enlace: " : "Link: "}
            https://glf-postulaciones.vercel.app/evaluation
          </p>
          {!hidden && (
            <label>
              {es ? "Contraseña asignada" : "Assigned password"}
              <input
                type="text"
                readOnly
                value={state.password}
                autoComplete="off"
                spellCheck={false}
              />
            </label>
          )}
          <p>
            {es ? "Vence: " : "Expires: "}
            {state.expires_at &&
              new Intl.DateTimeFormat(es ? "es" : "en", {
                dateStyle: "long",
                timeZone: "Pacific/Galapagos",
              }).format(new Date(state.expires_at))}
          </p>
          <button
            type="button"
            className="button secondary"
            onClick={() => {
              setHidden(true);
              router.refresh();
            }}
          >
            {es ? "Ya guardé la contraseña · ocultar" : "Password saved · hide"}
          </button>
        </div>
      )}
    </section>
  );
}
