export type ManagedAccount = {
  id: string;
  full_name: string;
  email: string;
  role: string;
  active: boolean;
  user_admin_scope: string;
  access_kind: string;
  archived_at: string | null;
  account_revision: number;
};
export const accountOperations = [
  "deactivate",
  "reactivate",
  "revoke_sessions",
  "archive",
  "unarchive",
  "delete",
] as const;
export const accountErrors: Record<string, [string, string]> = {
  GLF_FORBIDDEN: [
    "No tiene permiso para realizar esta operación.",
    "You are not authorized to perform this operation.",
  ],
  GLF_SELF_ACCOUNT_CHANGE: [
    "No puede modificar el acceso de su propia cuenta aquí.",
    "You cannot change your own account access here.",
  ],
  GLF_LAST_ADMIN: [
    "Debe permanecer al menos un administrador activo.",
    "At least one active administrator must remain.",
  ],
  GLF_CONCURRENT_CHANGE: [
    "La cuenta cambió. Actualice el listado antes de continuar.",
    "The account changed. Refresh the list before continuing.",
  ],
  GLF_REASON_REQUIRED: [
    "Indique un motivo de 3 a 500 caracteres.",
    "Enter a reason of 3–500 characters.",
  ],
  GLF_DEACTIVATE_FIRST: [
    "Desactive la cuenta antes de archivarla.",
    "Deactivate the account before archiving it.",
  ],
  GLF_ARCHIVE_FIRST: [
    "La cuenta debe estar desactivada y archivada antes de eliminarla.",
    "Deactivate and archive the account before deleting it.",
  ],
  GLF_CANNOT_REACTIVATE: [
    "Primero quite la cuenta del archivo.",
    "Unarchive first.",
  ],
  GLF_ACCOUNT_HAS_HISTORY: [
    "La cuenta tiene expedientes, documentos o actuaciones vinculadas y no puede eliminarse. Manténgala desactivada y archivada.",
    "Linked applications, documents or activity prevent deletion. Keep the account inactive and archived.",
  ],
  GLF_ACCOUNT_DELETE_FORBIDDEN: [
    "No se cumplen las condiciones para eliminar esta cuenta.",
    "This account does not meet the deletion conditions.",
  ],
  GLF_ACCOUNT_DELETE_FAILED: [
    "No se pudo eliminar la cuenta; continúa desactivada. Puede tener archivos o referencias vinculadas.",
    "Deletion failed; the account remains inactive. Files or linked records may prevent deletion.",
  ],
  GLF_DELETION_PENDING: [
    "Hay una eliminación pendiente para esta cuenta. Consulte al administrador.",
    "Account deletion is pending. Contact the administrator.",
  ],
  GLF_INVALID_OPERATION: [
    "Revise los datos y confirme la operación.",
    "Check the input and confirm the operation.",
  ],
  GLF_SERVICE_UNAVAILABLE: [
    "El servicio de administración no está disponible. Intente nuevamente.",
    "Account administration is unavailable. Try again.",
  ],
};
