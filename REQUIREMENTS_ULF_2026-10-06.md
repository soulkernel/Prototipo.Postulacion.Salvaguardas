# Actualización de requisitos — observaciones de Ulf

Fuente: mensaje de Ulf Hardter compartido por Schubert en esta conversación el 6 de octubre de 2026. Esta aclaración prevalece sobre las decisiones anteriores que pedían mitigación durante la Nota Conceptual.

## Fase 1: Nota Conceptual y screening

Solicitar exclusivamente las columnas A–G de la matriz: actividad principal, riesgo o impacto asociado, descripción breve, probabilidad, gravedad, categoría numérica (producto) y nivel de riesgo. Las escalas 1–5 muestran Muy baja, Baja, Media, Alta y Muy alta, y sus equivalentes en inglés.

No solicitar salvaguardas, mitigación, valoración residual, ubicación de implementación de la medida, costo, responsable ni trimestres del PGAS en esta fase. La ubicación general del proyecto y el presupuesto general de la Nota Conceptual son campos distintos y se mantienen.

## Fase 2: propuesta técnica y PGAS

Solo para expedientes invitados formalmente. Completar la matriz A–Q: identificación y evaluación, salvaguardas/medidas, riesgo mitigado, ubicación, costo, responsable y planificación trimestral. Los datos de screening permanecen en el expediente y las versiones enviadas se conservan.

La matriz completa integra el PGAS; su estructura narrativa/anexos definitivos no se inventan: deben ajustarse al formato oficial de propuesta técnica y a las observaciones pendientes de GLF. La aprobación sigue siendo humana.

## Observaciones de uso

Los botones Añadir Nueva Actividad y Añadir Riesgo del index.html publicado ejecutan alertas de simulación. La aplicación Next.js tiene acciones de edición del borrador; su comprobación completa con autenticación y persistencia depende de conectar Supabase.

El prototipo contiene un botón de cambio al panel GLF; la causa del fallo reportado por Ulf no está confirmada. La aplicación nueva protege ese panel por cuenta, rol y MFA. Se debe entregar acceso autorizado de prueba al personal antes de pedirle validar el panel. No eliminar autenticación para simular acceso.

El prototipo publicado se conserva sin cambios mientras se revisa. Estas correcciones se implementan en feat/full-grants-platform. No afirmar que Ulf ya ve los cambios en GitHub Pages.

## Pendientes institucionales

- Hoja de observaciones de Gaby sobre el contenido de la Nota Conceptual.
- Catálogo de salvaguardas aprobado por Ulf y formato definitivo de propuesta técnica/PGAS.
- Revisión con Ulf y responsables de convocatorias sobre el flujo conectado de ambas fases.

## Trazabilidad técnica

Migración 202610060004_separate_screening_and_pgas.sql: validación de servidor según etapa registrada, sin confiar en una etapa remitida por el navegador. El screening no exige los campos de segunda fase y rechaza intentos de ingresarlos anticipadamente. La propuesta completa sí exige todos los campos de mitigación e implementación.

Formulario y panel interno muestran la información correspondiente a la fase. El PDF utiliza la etapa del snapshot enviado, no el estado posterior del expediente; un screening ya enviado no se transforma retroactivamente en un PGAS.
