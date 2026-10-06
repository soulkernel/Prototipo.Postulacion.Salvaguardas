# Relevo de desarrollo — Plataforma de postulaciones y salvaguardas GLF

**Actualizado:** 6 de octubre de 2026 (Galápagos)
**Repositorio local:** `D:\GDRIVE LOCAL\CONSULTORIAS\SALVAGUARDAS GLF\portal-app`
**Rama activa:** `feat/full-grants-platform`
**Remoto:** `https://github.com/soulkernel/Prototipo.Postulacion.Salvaguardas.git`

Este archivo deja el contexto para continuar el trabajo en otro modelo. Es un relevo técnico y no una declaración de que el sistema ya esté listo para producción.

## Objetivo del sistema

Construir una aplicación GLF para gestionar el proceso de subvenciones de extremo a extremo: portal bilingüe para aplicantes; Nota Conceptual y matriz A&S de Ulf; gestión de convocatorias; revisión técnica y coordinación interna; compuerta de decisión CAT/comité/consejo; propuesta completa para invitados; convenios; y reportes internos de cierre. Vercel aloja la aplicación web, Supabase aporta Auth/Postgres/Storage con RLS, y el asistente E5 se ejecuta localmente en un equipo autorizado del GLF. El sistema sirve a postulantes, al personal responsable (Ulf, Paulina y Gabriela) y a las instancias de decisión.

## Decisiones que hay que preservar

- El sitio de Stitch enviado a revisión está publicado en GitHub Pages. Se conserva íntegro en `main` mientras el GLF lo revisa. La solución funcional se desarrolla en una rama de este mismo repositorio; nunca se sobrescribe el prototipo ni se fusiona a `main` sin revisión explícita.
- `main` conserva el `index.html` del sitio publicado; la nueva aplicación Next.js está en `web/`, por lo que Vercel debe usar `web` como Root Directory. Las migraciones se guardan en `supabase/`.
- El portal externo y el espacio de personal son áreas separadas. Roles internos: `grants_manager` (Paulina), `sustainability_reviewer` (Ulf), `project_coordinator` (Gabriela, San Cristóbal), `committee_member` y `administrator`. Los roles reales provienen del perfil Supabase, no de una elección del navegador.
- Solicitantes y convocatorias deben admitir las categorías configuradas para cada convocatoria; español e inglés, inicializados desde el idioma del navegador con selector manual.
- Fase 1 replica el formato oficial de Nota Conceptual proporcionado y sustituye VEAS por la matriz de Ulf, conforme a decisión expresa del usuario. La Nota Conceptual y la matriz son documentos independientes del expediente. El formulario oficial completo de Fase 2 todavía debe validarse; sus campos no se deben inventar.
- Una actividad puede asociarse con varios riesgos y un riesgo con varias salvaguardas. Los campos establecidos en la matriz de riesgo son obligatorios. Catálogo oficial de salvaguardas pendiente de entrega/aprobación por Ulf; mientras tanto, las propuestas del solicitante deben distinguirse claramente de medidas aprobadas.
- Matriz de Ulf: probabilidad y severidad inherentes/residuales de 1–5; puntaje = producto; bandas por riesgo: 1–4 bajo, 5–9 medio, 10–15 alto, 16–25 muy alto. Cronograma trimestral hasta 12 trimestres, duración inclusiva. La suma de puntajes por actividad puede mostrarse como suma; **no hay bandas confirmadas para asignar categoría global automática**. No mapear categorías A/B/C a la escala de Ulf.
- Postulación enviada queda bloqueada. Solo GLF autoriza reapertura registrada con plazo. La invitación a Fase 2, aprobación formal y convenio firmado son hitos distintos, documentados por separado. Comité/consejo conserva decisión humana.
- Reportería interna al cierre: recibidas, no calificadas/no avanzadas, invitadas/seleccionadas, propuestas completas, aprobadas y convenios firmados; clasificación por tipo y montos; indicadores ambientales/sociales **esperados o comprometidos**, claramente distintos de impacto observado. El sistema entrega datos a Comunicación, no publica ni escribe noticias. Monitoreo de ejecución es otro sistema futuro.
- El E5 `intfloat/multilingual-e5-small` recupera fragmentos del corpus con documento, página/sección y referencia verificable; no evalúa cumplimiento, no asigna puntajes ni decide. Correr localmente en equipo GLF autorizado; nunca servir el modelo desde Vercel ni exponer el equipo en internet.
- Diseño sobrio/minimalista, marca GLF; se extrajo el logo embebido del prototipo existente a `web/public/glf-logo.png`. No incluir documentos de expedientes reales ni datos personales en demos.

## Implementación actual (6 de octubre)

La aplicación real está en las rutas raíz, /applicant e /internal; el antiguo demo ficticio quedó explícitamente separado en /demo. Se corrigieron los errores de compilación anteriores y se añadieron Auth, formularios conectables a Supabase, versiones inmutables, anexos privados, PDF, funciones de workflow, RLS y reportería. El E5 todavía NO está implementado: solo hay tabla vectorial y RPC de recuperación preparados.

El usuario confirmó que no hay proyectos Supabase/Vercel existentes y autorizó preparar proyectos nuevos. Se abrieron los servicios en Chrome; ambos requieren iniciar sesión. Se le pidió hacerlo directamente, sin compartir secretos. No se creó proyecto, aplicó migración ni confirmó despliegue remoto aún.

## Arquitectura y seguridad implementadas

- Next 16.3.8 / React 19.2.8, Supabase SSR, validación Zod. Las acciones usan el JWT del usuario; no hay service_role en la web.
- Tres migraciones iniciales aún NO aplicadas a una base real; se pueden corregir antes del primer despliegue. Después de aplicadas, cualquier cambio requiere una migración nueva.
- Mutaciones solo por RPC security definer con search_path vacío y comprobación de rol, estado, revisión y plazo; permisos de ejecución PUBLIC revocados. RLS en tablas/Storage. El borrador inicial pertenece solo al aplicante; personal accede después del primer envío.
- MFA aal2 requerido en código y base para roles de personal; perfiles inactivos quedan sin acceso. Primer administrador requiere bootstrap por propietario de base. No confiar roles de metadatos del registro.
- Guardado MANUAL de borrador, aviso de cambios sin guardar, control optimista de revisión. Envío crea una versión inmutable con anexos registrados. Reapertura requiere GLF y plazo; para revisar o decidir se exige reenvío, aunque el plazo de corrección haya expirado.
- Revisión por área; segunda fase solo por invitación humana y esquema oficial configurado; nueva revisión A&S sobre versión actual para aprobar. CAT únicamente recomienda. Monto aprobado independiente; convenio no excede aprobado y firmas no anteceden aprobación.
- Reportes basados en última versión ENVIADA, no en borradores de corrección. Montos solicitado/aprobado/convenido distintos; indicadores narrativos aún no agregados.
- PDF separados de concepto y matriz, ES/EN, fuentes Noto Sans embebidas, QR autenticado a versión persistida. Se generan desde snapshot; NO son todavía un binario archivado. Anexos por separado, enlaces firmados breves, bucket privado.
- CSP nonce, anti-enmarcado, no-store en respuestas privadas, retorno Auth de mismo origen, validación de archivos y neutralización CSV.

## Verificación realizada

- 19 pruebas automatizadas: 13 de PostgreSQL/PGlite ejecutando migraciones/RLS/transiciones y 6 de dominio/archivos/PDF. Incluyen aislamiento, escalada de rol denegada, MFA, conflicto de edición, bloqueo tras envío, corrección/reenvío, revisión vigente, aprobación y techo del convenio. Reejecutar tras cambios.
- Compilación de producción y TypeScript pasan; ESLint pasa. La caché persistente de build Turbopack falló repetidamente al reabrirse en esta carpeta sincronizada Windows. Se desactivó con experimental.turbopackFileSystemCacheForBuild=false; la compilación no depende de esa caché.
- npm audit --omit=dev: 0 vulnerabilidades conocidas al verificar. El audit completo registra 5 altas en cadena de herramientas de desarrollo braces/micromatch, sin corrección automática disponible; no ocultarlas ni aplicar --force.
- Cuatro PDF ficticios generados (dos tipos por dos idiomas); comprobada paginación e imágenes QR por prueba automatizada y revisión visual representativa. Falta cotejo institucional integral, QR decodificado y navegación autenticada alojada.
- Navegador: portada, cambio ES/EN, redirección de /internal a login sin sesión, registro móvil 390x844 legible, sin errores de consola observados. No se han probado todavía formularios autenticados con backend alojado.
- CI configurada en .github/workflows/web-checks.yml. El resultado remoto se debe consultar después del push; no equiparar configuración con CI aprobada.

## Próximo trabajo prioritario

1. Verificar sesión del usuario en Supabase/Vercel y crear proyectos de prueba siguiendo DEPLOYMENT.md. Pedir al usuario que establezca cualquier contraseña nueva directamente; nunca imprimir tokens ni pegarlos en conversación.
2. Aplicar migraciones en proyecto nuevo y configurar Auth/correo/MFA/URLs. Probar dos solicitantes y los roles internos, incluyendo intentos directos de bypass de RLS y descarga ajena.
3. Completar el cotejo de Nota Conceptual contra formato institucional, presupuesto detallado y límite de seis páginas, sin inventar reglas. Catálogo oficial de Ulf y formato final de fase 2 siguen pendientes de aprobación.
4. Archivar PDF definitivos como binarios con huella/versionado. Diseñar carga directa segura para anexos mayores de 4 MB, escaneo/cuarentena y limpieza de huérfanos. La firma de bytes no es antivirus.
5. Completar edición/versionado de convocatoria, gestión de cuentas/activación, filtros y paginación operativa, mensajes de validación más específicos y pruebas de accesibilidad en los formularios conectados.
6. Implementar E5 CPU local con corpus autorizado y versionado, fuentes citadas y pruebas de recuperación. Ingresar nuevos expedientes aprobados al corpus no equivale a reentrenamiento automático.
7. Validar con personal GLF antes de producción, definir backup/restauración, retención, administración institucional y protección de datos. Mantener main y prototipo publicado sin cambios.

## Archivos y comandos

- README.md: ejecución y alcance real; DEPLOYMENT.md: entornos y aceptación.
- web/src/lib/domain.ts y fields.ts: modelo y etiquetas; src/lib/pdf.ts: PDF; src/proxy.ts: sesión y cabeceras.
- web/src/app/applicant y internal: interfaz/acciones; supabase/migrations: permisos y reglas transaccionales.
- Ejecutar desde web: npm run lint; npm test; npm run build; npm audit --omit=dev.
- .test-artifacts, .env.local, .next y node_modules ignorados. No subir corpus/expedientes reales al repositorio público.
- gh funciona fuera del sandbox mediante credenciales del llavero; dentro del sandbox puede informar token inválido aunque no lo sea. No volver a autenticar sin comprobarlo.
- El resumen de versiones Git/PR se debe verificar con git status, git log y gh pr view; nunca inferir push a partir de commit local.
