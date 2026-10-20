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

Las tablas de presentación corresponden exclusivamente a Revisar y enviar, la consulta interna y los PDF. No convertir las cajas de captura de Nota conceptual en tablas editables. Conservar las fichas y controles acordados; el texto de tablas importadas debe verse legible al consultar o editar, sin Markdown visible, y las modificaciones deben reflejarse en las salidas.

El resumen del proyecto se captura en una sola caja de texto con un límite total de palabras. No exigir seis subcampos. Usar projectSummary para leer borradores históricos en su orden original; al editar, guardar summary y vaciar summary_parts. Validaciones, avance, revisión externa e interna y PDF deben coincidir. Mantener independientes los resultados e indicadores detallados.

## Resultados por fase (decisión del usuario, 20/10/2026)
En fase 1, cada ficha de resultados solicita únicamente el objetivo específico asociado y el resultado esperado, en ese orden. Indicador de impacto, meta propuesta, unidad y evidencia corresponden a fase 2, que reutiliza los mismos UUID y vínculos. No volver a exigir esos detalles en la nota conceptual ni borrar valores históricos ya guardados. Las validaciones y el progreso deben tomar la etapa real del expediente; los PDF y la revisión usan un formato versionado que conserva los documentos preparados y firmados anteriores. Conservar la edición de los borradores narrativos antiguos sin conversión automática. Ver el alcance y las decisiones para continuidad en `../docs/Decision_resultados_por_fase_20261020.txt`.

## Seguimiento vinculado (decisión del usuario, 20/10/2026)
La nota conceptual sí recoge indicadores propuestos de avance/éxito en Seguimiento y evaluación, después de Actividades. Cada ficha usa el rótulo exacto «Parámetro de evaluación que propone», una actividad o resultado ya ingresado, el indicador y la estrategia. Mostrar sus objetivos específicos sin copiarlos ni inferir vínculos actividad-resultado. Guardar por tipo + UUID y conservar fichas pendientes si se elimina su referente. Metas y método detallado corresponden a fase 2. Mantener la narrativa monitoring histórica, sin convertirla automáticamente, y el formato de documentos anteriores. Ver `../docs/Decision_seguimiento_vinculado_20261020.txt` antes de ampliar el seguimiento o implementar mediciones.
