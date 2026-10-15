<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

## Respuesta visual de operaciones
Todo botón que inicia una operación asíncrona debe mostrar inmediatamente indicador de carga y texto de progreso ES/EN, aria-busy y bloqueo mientras está pendiente; restaurar el estado al finalizar o fallar. Usar SubmitButton dentro de formularios con Server Actions/Next Form; ActionLabel y estado busy para operaciones de cliente. Conservar validación, permisos y restricciones disabled existentes. No añadir esperas artificiales. Los controles locales de añadir/quitar/abrir se actualizan directamente.

## Controles de eliminación
En formularios externos e internos, usar el mismo icono Trash2 de lucide-react para quitar o eliminar elementos. Usar RemoveButton para controles locales y para abrir confirmaciones, con aria-label específico y título ES/EN; no mostrar el texto «Quitar» en el control. Las confirmaciones de eliminación definitiva conservan texto explícito junto a la papelera, advertencias, permisos y estados pendientes. No confundir desarchivar, cerrar o desmarcar con eliminar.

## Presentación comprensible de expedientes
El resumen web externo e interno y el PDF deben usar la misma estructura conceptSections. Incluir introducciones breves y relaciones en lenguaje natural, conservando el contenido del postulante sin inventar indicadores, metas o requisitos. Presentar datos relacionados en tablas y textos narrativos en párrafos/listas. No reproducir espacios de extracción ni inferir celdas de tablas ambiguas. Mantener compatibles los expedientes históricos y sus versiones firmadas.
