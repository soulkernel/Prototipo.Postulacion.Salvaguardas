<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

## Respuesta visual de operaciones
Todo botón que inicia una operación asíncrona debe mostrar inmediatamente indicador de carga y texto de progreso ES/EN, aria-busy y bloqueo mientras está pendiente; restaurar el estado al finalizar o fallar. Usar SubmitButton dentro de formularios con Server Actions/Next Form; ActionLabel y estado busy para operaciones de cliente. Conservar validación, permisos y restricciones disabled existentes. No añadir esperas artificiales. Los controles locales de añadir/quitar/abrir se actualizan directamente.
