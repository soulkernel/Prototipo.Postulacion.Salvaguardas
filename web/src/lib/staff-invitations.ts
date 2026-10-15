import { z } from "zod";
import { roles, type Locale, type Role } from "./domain";
export const invitationInput = z
  .object({
    email: z
      .email()
      .max(254)
      .transform((v) => v.toLowerCase()),
    full_name: z
      .string()
      .trim()
      .min(2)
      .max(200)
      .refine(
        (value) =>
          !Array.from(value).some(
            (c) => c.charCodeAt(0) < 32 || c.charCodeAt(0) === 127,
          ),
      ),
    role: z.enum(roles).refine((v) => v !== "applicant"),
    scope: z.enum(["none", "projects", "sustainability"]),
  })
  .refine(
    (v) =>
      v.scope === "none" ||
      (v.scope === "projects" && v.role === "grants_manager") ||
      (v.scope === "sustainability" && v.role === "sustainability_reviewer"),
  );
export function invitationRoles(role: Role, scope: string): Role[] {
  return role === "administrator"
    ? roles.filter((r) => r !== "applicant")
    : role === "grants_manager" && scope === "projects"
      ? ["project_coordinator"]
      : role === "sustainability_reviewer" && scope === "sustainability"
        ? ["sustainability_reviewer"]
        : [];
}
export function invitationError(code: string, locale: Locale) {
  const labels: Record<string, [string, string]> = {
    GLF_INVALID_INVITATION: [
      "Revise nombre, correo, rol y delegación. Todos deben ser válidos y compatibles.",
      "Check name, email, role and delegation. All must be valid and compatible.",
    ],
    GLF_FORBIDDEN: [
      "No tiene permiso para administrar esta invitación. Confirme su sesión y segundo factor.",
      "You cannot manage this invitation. Check your session and second factor.",
    ],
    GLF_ACCOUNT_EXISTS: [
      "Este correo ya tiene una cuenta. Gestione sus permisos en Cuentas existentes; no se enviará una invitación duplicada.",
      "This email already has an account. Manage its permissions under Existing accounts; no duplicate invitation will be sent.",
    ],
    GLF_VERSION_CONFLICT: [
      "La invitación cambió. Actualice la pantalla y revise los datos antes de continuar.",
      "The invitation changed. Refresh and review its details before continuing.",
    ],
    GLF_INVITATION_LOCKED: [
      "Este estado no permite la operación. Una invitación enviada debe cancelarse antes de cambiar sus datos.",
      "This status does not allow the action. Cancel a sent invitation before changing its details.",
    ],
    GLF_INVITATION_WAIT: [
      "Espere al menos un minuto antes de reenviar. Si un envío está en curso, espere cinco minutos antes de reintentarlo.",
      "Wait at least one minute before resending. If delivery is in progress, wait five minutes before retrying.",
    ],
    GLF_INVITATION_RATE_LIMIT: [
      "Alcanzó el límite de diez envíos por hora. Inténtelo más tarde.",
      "You reached the limit of ten sends per hour. Try again later.",
    ],
    email_address_not_authorized: [
      "Supabase no permite enviar a este destinatario con su correo de pruebas. Configure un servicio SMTP autorizado para enviar invitaciones al personal GLF.",
      "Supabase's test email service cannot send to this recipient. Configure an authorized SMTP service to invite GLF staff.",
    ],
    over_email_send_rate_limit: [
      "El proveedor alcanzó su límite de correos. Espere y vuelva a intentarlo.",
      "The email provider reached its sending limit. Wait and retry.",
    ],
    email_exists: [
      "El correo ya está registrado. Actualice la pantalla y revise la cuenta existente.",
      "This email is already registered. Refresh and review the existing account.",
    ],
    GLF_INVITATION_CONFIG: [
      "El servicio de invitaciones todavía no está configurado. No se envió ningún correo.",
      "The invitation service is not configured yet. No email was sent.",
    ],
    GLF_INVITATION_RECONCILE: [
      "No se pudo confirmar el registro del envío. Actualice la pantalla; no reenvíe inmediatamente. Contacte al administrador si permanece Enviando.",
      "Delivery tracking could not be confirmed. Refresh; do not resend immediately. Contact the administrator if the Sending state persists.",
    ],
    GLF_INVITATION_EXPIRED: [
      "La invitación venció o fue cancelada. Solicite un nuevo envío al administrador GLF.",
      "The invitation expired or was cancelled. Ask the GLF administrator to resend it.",
    ],
    GLF_INVITATION_RECIPIENT: [
      "La cuenta no corresponde al destinatario de esta invitación o no ha sido verificada.",
      "The account does not match this invitation's recipient or has not been verified.",
    ],
  };
  return (labels[code] || [
    "No se completó la operación. Revise el estado e inténtelo de nuevo.",
    "The action was not completed. Check its status and retry.",
  ])[locale === "es" ? 0 : 1];
}
export type StaffInvitation = {
  id: string;
  email: string;
  full_name: string;
  assigned_role: Role;
  user_admin_scope: string;
  status: "draft" | "sending" | "sent" | "failed" | "accepted" | "cancelled";
  updated_at: string;
  sent_at: string | null;
  expires_at: string | null;
  accepted_at: string | null;
  send_count: number;
  last_error: string | null;
  invited_user_id: string | null;
};
