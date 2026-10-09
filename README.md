# Portal de postulaciones y salvaguardas GLF

Aplicación en desarrollo: Next.js 16, React 19 y TypeScript para Vercel; Supabase Auth, Postgres y Storage privado. El asistente RAG con E5 se ejecutará en un equipo autorizado del GLF y conserva la decisión humana.

## Separación del prototipo

`index.html` y `main` mantienen el prototipo de Stitch publicado en GitHub Pages. La aplicación funcional está en `web/`, en la rama `feat/full-grants-platform`. Vercel debe usar **Root Directory: web**. No fusionar esta rama a main durante la revisión del prototipo.

## Desarrollo y verificación

```powershell
cd web
npm ci
Copy-Item .env.example .env.local
# Completar las variables con el proyecto de pruebas; nunca usar service_role.
npm run dev
```

```powershell
npm run lint
npm test
npm run build
npm audit --omit=dev
```

`npm test` ejecuta las migraciones y las políticas con PostgreSQL/PGlite, prueba transiciones y permisos, validaciones de archivos/CSV/retornos de autenticación y genera PDF ficticios. No sustituye las pruebas de Auth y Storage en Supabase alojado. `.test-artifacts/` contiene resultados locales ignorados por Git.

## Funcionalidad implementada

- Portal ES/EN, idioma del navegador y selector persistente, registro, recuperación de contraseña y segundo factor obligatorio para el personal.
- Fase 1: screening A–G sin mitigación. Fase 2: evaluación completa A–Q y planificación del PGAS, según la aclaración más reciente de Ulf (ver REQUIREMENTS_ULF_2026-10-06.md).
- Convocatorias configurables; borradores de Nota Conceptual y matriz de riesgos, guardado manual, varias actividades/riesgos/medidas, validación al enviar, control de concurrencia y versiones enviadas inmutables.
- Anexos privados, descargas autorizadas, PDF separados de Nota Conceptual y matriz, QR a la versión autenticada. El PDF se genera desde la versión congelada; todavía no se archiva como binario definitivo.
- Revisión por área, correcciones autorizadas, invitación a segunda fase, revisión de la propuesta completa, decisión humana y convenio firmado como hitos diferentes.
- Reportes internos y CSV sobre versiones enviadas; montos solicitado, aprobado y convenido separados. No contienen seguimiento de ejecución ni impactos alcanzados.
- RLS y mutaciones por funciones autorizadas; no hay permisos directos del cliente para cambiar estados, roles ni decisiones. El borrador inicial es privado del solicitante.

## Estado y límites

La aplicación compila y pasa pruebas locales; **todavía no está validada como sistema de producción**. No hay un proyecto Supabase conectado ni una vista previa Vercel confirmada. Consulte [DEPLOYMENT.md](DEPLOYMENT.md) para la preparación y [HANDOFF_DESARROLLO.md](HANDOFF_DESARROLLO.md) para continuidad.

Pendientes principales: integración alojada y pruebas con usuarios reales de prueba; catálogo oficial de Ulf; formato definitivo de segunda fase; E5 local; archivo binario de PDF; comparación final contra el formato institucional y límite de páginas; edición/versionado de convocatorias; administración completa de usuarios; indicadores estructurados aprobados por GLF. Los archivos tienen un límite web de 4 MB y no cuentan aún con antivirus. No introducir expedientes reales durante estas pruebas.

`/demo` conserva una demostración aislada con datos ficticios. No representa persistencia, autorización ni decisiones institucionales.
