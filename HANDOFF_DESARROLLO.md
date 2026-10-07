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
- Una actividad puede asociarse con varios riesgos y un riesgo con varias salvaguardas. Según la aclaración más reciente de Ulf, Fase 1 exige únicamente A–G (screening); Fase 2 exige la matriz A–Q con mitigación y planificación/PGAS. Catálogo oficial de salvaguardas pendiente de entrega/aprobación por Ulf; mientras tanto, las propuestas del solicitante deben distinguirse claramente de medidas aprobadas.
- Matriz de Ulf: probabilidad y severidad inherentes/residuales de 1–5; puntaje = producto; bandas por riesgo: 1–4 bajo, 5–9 medio, 10–15 alto, 16–25 muy alto. Cronograma trimestral hasta 12 trimestres, duración inclusiva. La suma de puntajes por actividad puede mostrarse como suma; **no hay bandas confirmadas para asignar categoría global automática**. No mapear categorías A/B/C a la escala de Ulf.
- Postulación enviada queda bloqueada. Solo GLF autoriza reapertura registrada con plazo. La invitación a Fase 2, aprobación formal y convenio firmado son hitos distintos, documentados por separado. Comité/consejo conserva decisión humana.
- Reportería interna al cierre: recibidas, no calificadas/no avanzadas, invitadas/seleccionadas, propuestas completas, aprobadas y convenios firmados; clasificación por tipo y montos; indicadores ambientales/sociales **esperados o comprometidos**, claramente distintos de impacto observado. El sistema entrega datos a Comunicación, no publica ni escribe noticias. Monitoreo de ejecución es otro sistema futuro.
- El E5 `intfloat/multilingual-e5-small` recupera fragmentos del corpus con documento, página/sección y referencia verificable; no evalúa cumplimiento, no asigna puntajes ni decide. Correr localmente en equipo GLF autorizado; nunca servir el modelo desde Vercel ni exponer el equipo en internet.
- Diseño sobrio/minimalista, marca GLF; se extrajo el logo embebido del prototipo existente a `web/public/glf-logo.png`. No incluir documentos de expedientes reales ni datos personales en demos.

## Aclaración más reciente de Ulf (6 de octubre)

Ver REQUIREMENTS_ULF_2026-10-06.md. Se separaron screening y PGAS en servidor, interfaz, panel y PDF mediante una cuarta migración. Las observaciones de Gaby siguen pendientes; no inventar su contenido. El index.html de revisión continúa sin cambios.

## Implementación actual (6 de octubre)

Código funcional publicado en la rama `feat/full-grants-platform`, commit `ed4d2fb`. Pull request **en borrador**: https://github.com/soulkernel/Prototipo.Postulacion.Salvaguardas/pull/1 . CI Linux de ese commit completada correctamente: https://github.com/soulkernel/Prototipo.Postulacion.Salvaguardas/actions/runs/37469587258 . No se fusionó a main; `index.html` no forma parte de los cambios.

La aplicación real está en las rutas raíz, /applicant e /internal; el antiguo demo ficticio quedó explícitamente separado en /demo. Se corrigieron los errores de compilación anteriores y se añadieron Auth, formularios conectables a Supabase, versiones inmutables, anexos privados, PDF, funciones de workflow, RLS y reportería. El E5 todavía NO está implementado: solo hay tabla vectorial y RPC de recuperación preparados.

El usuario confirmó que no hay proyectos Supabase/Vercel existentes y autorizó preparar proyectos nuevos. Se abrieron los servicios en Chrome; ambos requieren iniciar sesión. Se le pidió hacerlo directamente, sin compartir secretos. No se creó proyecto, aplicó migración ni confirmó despliegue remoto aún.

## Arquitectura y seguridad implementadas

- Next 16.3.8 / React 19.2.8, Supabase SSR, validación Zod. Las acciones usan el JWT del usuario; no hay service_role en la web.
- Cuatro migraciones aún NO aplicadas a una base real; se pueden corregir antes del primer despliegue. Después de aplicadas, cualquier cambio requiere una migración nueva.
- Mutaciones solo por RPC security definer con search_path vacío y comprobación de rol, estado, revisión y plazo; permisos de ejecución PUBLIC revocados. RLS en tablas/Storage. El borrador inicial pertenece solo al aplicante; personal accede después del primer envío.
- MFA aal2 requerido en código y base para roles de personal; perfiles inactivos quedan sin acceso. Primer administrador requiere bootstrap por propietario de base. No confiar roles de metadatos del registro.
- Guardado MANUAL de borrador, aviso de cambios sin guardar, control optimista de revisión. Envío crea una versión inmutable con anexos registrados. Reapertura requiere GLF y plazo; para revisar o decidir se exige reenvío, aunque el plazo de corrección haya expirado.
- Revisión por área; segunda fase solo por invitación humana y esquema oficial configurado; nueva revisión A&S sobre versión actual para aprobar. CAT únicamente recomienda. Monto aprobado independiente; convenio no excede aprobado y firmas no anteceden aprobación.
- Reportes basados en última versión ENVIADA, no en borradores de corrección. Montos solicitado/aprobado/convenido distintos; indicadores narrativos aún no agregados.
- PDF separados de concepto y matriz, ES/EN, fuentes Noto Sans embebidas, QR autenticado a versión persistida. Se generan desde snapshot; NO son todavía un binario archivado. Anexos por separado, enlaces firmados breves, bucket privado.
- CSP nonce, anti-enmarcado, no-store en respuestas privadas, retorno Auth de mismo origen, validación de archivos y neutralización CSV.

## Verificación realizada

- 20 pruebas automatizadas: 14 de PostgreSQL/PGlite ejecutando migraciones/RLS/transiciones y 6 de dominio/archivos/PDF. Incluyen aislamiento, escalada de rol denegada, MFA, conflicto de edición, bloqueo tras envío, corrección/reenvío, revisión vigente, aprobación y techo del convenio. Reejecutar tras cambios.
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

## Relevo de despliegue 2026-10-06
Supabase glf-postulaciones (dcxhuwghakdjcnrqkziq) YA tiene las cinco migraciones instaladas; auditoría remota correcta (14 tablas public, todas con RLS, bucket privado, sin escritura directa). Véase último bloque de DEPLOYMENT.md. No repetir instalación inicial. Falta conciliar historial CLI, Auth y conectar frontend. Vercel bloqueado en verificación de identidad GitHub del titular. Las pestañas Supabase/Vercel/GitHub se conservan para continuación. Nueva migración 202610060005 protege private.role_events; 14 pruebas DB pasan.

## Estado al entregar enlace
Preview 2sDkHSFeuZTbJxdZkgFjnHbw3KEc alcanzó Ready (57 s). Registro abierto en URL estable y comprobado visualmente en inglés; cambio ES/EN funciona. No se ha registrado usuario ni probado autenticación/envío/PDF reales. MFA TOTP está Enabled en Supabase. Commit fb3f596 subido corrige texto inicial (screening sin medidas en fase1); despliegue automático de ese commit aún por verificar. Siguiente paso: titular crea cuenta desde /register y confirma correo; posteriormente asignar primer administrador con autorización y realizar pruebas de roles. Sigue pendiente conciliación historial migraciones CLI y SMTP de pruebas.

## Recuperacion de importacion 2026-10-06
Vercel logs del fallo 18:04:38 muestran POST HF /embed sin llamada posterior import_evidence: fallo en inferencia. Commit ff9fe04 agrega reintentos limitados (5), codigos seguros, conserva archivo con onSubmit y checkpoint en memoria por SHA256. Reanuda en misma pagina; al recargar se reinicia recorrido pero DB evita duplicados. Pruebas corpus-upload (2), tsc y eslint correctos. Nueva vista previa Fsjnjo7Vjey85N1XLMCrSRrMi4UH en construccion. Corpus completo y causa HTTP exacta aun no verificados; no aprobar fuentes automaticamente.

## Flujo funcional 2026-10-07
Commit fc0b2a9: /demo redirige a portada; shell por rol; categorias por convocatoria. Migracion 007 instalada con exito via SQL d9cc90fc-11ef-42b8-a9d1-3113f39f9e6c, no repetir. prepared_documents separados de envios/reportes, PDF previo inmutable con QR, adjunto concept_signed PDF requerido para primer envio fase1. Validacion criptografica de firma pendiente; comprobacion actual solo tipo y fecha posterior a preparacion. Revisar endurecimiento en reenvios de correccion donde status pueda seguir submitted: trigger actual exige transicion de estado. 15 DB tests, PDF y build pasan. Firma/adjuntos todavia sin ensayo alojado integral con cuenta postulante. No hay convocatoria abierta publicada aun. Dominio corto glf-postulaciones.vercel.app vinculado Preview rama y exceptuado de Vercel Auth con aprobacion humana; Supabase siteURL/env todavia alias largo funcional. Observaciones GLF siguen autoridad.

Actualizacion: migracion 008 instalada con exito; wrapper submit_application comprueba documentos actuales tambien para reenvios. Funcion core sin permisos authenticated. Pruebas DB 15 pasan. Sustituye el pendiente de trigger en parrafo anterior.

## Revision uniforme 2026-10-07
Commit 6bb34d2 retira portal-app.tsx y demo/view.tsx de web (prototipo main intacto), navegación por rol con destinos reales, categorías 3 tarjetas, CSS uniforme/mobile. Interno muestra payload última versión enviada, no borrador de corrección. 21 pruebas, lint, tsc y build pasan. No declarar aceptación E2E: faltan cuentas de técnicos/invitaciones, convocatoria abierta y aprobación corpus. Se solicitaron correos/administrador por pregunta asíncrona. Portada minimalista f00909e validada visualmente y registro navega. Usuario pide mismo diseño en todas pantallas, solo funcional. Seguimiento ejecución futuro incluye Paulina/Gabriela/Ulf/Verónica; todavía fuera alcance actual. No asignar permisos a nombres sin autorización/correos.

Aclaracion titular: ver ADMINISTRACION_GLF_REQUISITOS.md. Monica y Schubert generales; Ulf y Paulina administracion por area independiente de roles tecnicos. No dar permiso de usuarios a Veronica/Gabriela/Danny. Nombre Paulina Kummer difiere del listado previo Couenberg; correo pendiente confirmar antes de invitacion.

Nombre confirmado por el titular: Paulina Counmberg (apellido exacto), misma persona y mismo correo paulina.couenberg@glf.org.ec. Sustituye variantes previas; no volver a pedir confirmacion.


## Depuracion y accesos 2026-10-07
Migraciones 009 y 010 instaladas con Success via SQL Editor. No repetir. Administración de usuarios por ámbito independiente del rol técnico: administrator general; grants_manager con scope projects; sustainability_reviewer con scope sustainability. Delegación solo administrador y sin autoasignación. Auditoría privada guarda ámbito anterior/nuevo. staff_invitation_drafts con RLS, RPC controlado, sin creación Auth ni correos. Preparados 6 contactos GLF; ninguna invitación enviada ni permiso concedido a esas personas. Nombre definitivo Paulina Counmberg, paulina.couenberg@glf.org.ec.
Convocatoria GLF-PRUEBA-INTERNA-2026 published, 3 categorías, apertura 2026-10-07 02:18:18 UTC y cierre 2026-11-06 02:18:18 UTC (30 días; Galápagos 6 octubre 20:18 a 5 noviembre 20:18). Datos exclusivamente ficticios, parámetros de prueba, sin validez oficial. phase2_schema vacío: NO declarar fase2 lista ni emitir invitación de fase2 hasta configurar formato oficial.
Auditoría corpus remoto: 3549 fragmentos y 0 aprobados. UI deshabilita consulta mientras no haya fuentes aprobadas; falta flujo de validación por documento/version, no aprobar masivamente. Se solicitó al titular crear cuenta EXTERNA de prueba distinta del administrador y confirmar correo, sin compartir contraseña, para ensayo alojado integral. Pendientes: ensayo externo PDF/firma/anexos/envío y revisión interna, aprobación corpus, envío de invitaciones solo tras autorización futura explícita. Propuestas de acceso NO son usuarios internos creados. Claves y MFA se ingresan por titular.
Pruebas actuales: 17 DB + 6 dominio/PDF = 23 pasan; lint/build correctos antes de último ajuste de estado corpus; build final en curso al redactar este bloque. Historial CLI no conciliado: nunca db push inicial. Dominio corto Preview glf-postulaciones.vercel.app; conservar prototipo main/Pages. Acceso administrativo a pruebas externas requiere cuenta separada, no degradar rol Schubert.

Verificacion final del lote: commit 5da20ab subido a GitHub; Vercel BdjZGpVGKaPKWcwifTUZhXZyS8sP Ready 44s. Modulo /internal/users verificado en navegador con sesión Schubert MFA: 6 propuestas correctas, Paulina Counmberg, Ulf/Paulina con delegación preparada, Schubert único usuario existente y protegido contra cambio propio. 23 pruebas, lint y build final correctos. Dominio corto abre login sin Vercel Auth; la sesión antigua del titular está en alias largo. Debe probar cuenta externa en corto. No declarar listo para invitaciones todavía.

## Confirmacion de correo 2026-10-07
Incidente titular: registro en alias corto, correo de Supabase, regreso con error credentials. Se verificó Supabase Site URL y NEXT_PUBLIC_SITE_URL Preview con alias largo; templates UI indica SMTP propio requerido o Pro para editar plantillas. Site URL Supabase y variable Preview Vercel ahora https://glf-postulaciones.vercel.app. Allow list conserva callback largo y agrega callback corto y login corto?confirmation=return, verificado guardado. Commit 47d59e2: signUp/resend devuelve tras verificación Supabase a login explícito, no depende de PKCE entre dispositivos; callback antiguo con code sin sesión muestra instrucciones de ingreso, no error de registro; callback token_hash soporta email/signup/recovery para futura plantilla SSR. Mensaje claro registro, error email_not_confirmed/enlace vencido/reenvío. No desactivada confirmación ni MFA. Lint/tsc/build pasan. Pendiente verificar Ready y navegación alojada al redactar.
SMTP y remitente Galapagos Life Fund NO configurados: se preguntó cuenta institucional autorizada o proveedor con dominio propio, sin pedir secretos por chat. Template bilingüe listo en supabase/templates/confirm-signup.html, todavía NO instalado; asunto propuesto Galapagos Life Fund — Confirme su correo electrónico. No contratar plan Pro ni proveedor sin autorización. No emitir invitaciones internas. Falta ensayo real del correo nuevo y login con cuenta externa por titular, contraseña privada.
Verificación alojada: deployment CS5meYz5tR1C44fUr7HjtcSBh5h2 Ready 37s (47d59e2). IAB sin sesión verifica mensaje register?sent=1, callback legacy con código ficticio devuelve login?confirmation=signin sin error rojo y token_hash ficticio devuelve error de enlace específico; desplegable reenvío abre formulario correctamente. No se ha enviado correo nuevo ni comprobado confirmación real después de este cambio. SMTP queda pendiente de respuesta humana. No afirmar correo remitente GLF ya activo.
Teléfono: selector internacional con Ecuador +593 inicial, número móvil/fijo, libphonenumber-js/max versión fijada, normalización E.164 manteniendo concept.phone. Validación navegador y servidor al preparar/enviar; borradores parciales conservados hasta completar. Migración 011 instalada Success (SQL 1da61c0f-fb53-4b8c-8081-38b7371f04f8): valida largo <=32 en borradores y formato E.164 en completitud, wrapper privado conserva validaciones previas y no cambia datos ni permisos. Pruebas ECU móvil/fijo, US, excesos/letras/código inválido, DB bloquea números malformados; 19 DB + 7 dominio/PDF pasan, lint/build correctos. No valida propiedad del número ni envía SMS. Pendiente Ready y comprobación visual alojada después de publicar.

## Ajustes del formulario 2026-10-07
Teléfono 9add570 Ready verificado; financiero f6ebbb9 Vercel success. Validación financiera inmediata por campo y bloqueo de Continuar: categoría, cofinanciamiento y administrativo sobre total solicitado+cofinanciamiento; total destacado en tiempo real. Topes del servidor ya existían. Correo a2fa296 Vercel success: cuenta autenticada como inicial en nuevas postulaciones y borradores editables vacíos; no sobrescribe correo guardado ni expediente bloqueado.
Datos reutilizables 9f5ac16: createDraft consulta exclusivamente applications del titular (applicant_id=user.id, RLS), más reciente por updated_at/created_at/id con nombre de proponente no vacío, antes de crear nueva solicitud. Copia solo applicant_type/applicant_name/contact_name/email/phone/address; email de cuenta como respaldo. Tipo solo si admitido por convocatoria. No mezcla organizaciones de distintas postulaciones; datos editables, copiados al nuevo expediente y no vinculados al anterior. Título, actividades, riesgos, presupuesto y fechas empiezan vacíos. Prueba de selección de campos, independencia y primera solicitud pasa; 19 DB, 8 dominio y PDF pasan, lint/build correctos. Push realizado; verificar Vercel success antes de declarar desplegado. Sin cambios Supabase ni invitaciones. Remitente Supabase queda intacto por petición expresa del titular hasta disponer correo institucional GLF.

Geografía y domicilio: provincia (24 provincias Ecuador), ciudad/localidad (opciones frecuentes según provincia + Otra con texto obligatorio) y dirección específica. Galápagos ofrece cuatro cabeceras pobladas + otra localidad; no deriva elegibilidad de domicilio. Reutiliza province/city/address con datos de último expediente; title vacío y project_islands vacío en nuevo proyecto. Islas múltiples: Todo Galápagos exclusivo, San Cristóbal/Santa Cruz/Isabela/Floreana/Baltra/Otras con texto condicional. Datos adicionales en JSON concept sin cambios de columnas Supabase. Campos históricos reciben valores vacíos al editar, conservando address/location previos; no inventar ubicación. UI y Server Actions validan geografía al continuar y preparar/enviar; SQL RPC todavía no tiene restricciones nuevas de geografía (reforzar en siguiente migración antes de producción oficial). PDF incluye campos estructurados, arrays separados por coma. Reportería territorial/filtros aún no incorporados. Pruebas 19 DB + 11 dominio/PDF, lint/build correctos. Sin envíos de invitaciones.
Campos obligatorios 61d17ff, aviso junto a botones 0dc5ba2 y validación por paso eb0989d Vercel success verificado. Última consulta de pasos enumera faltantes y montos inválidos juntos; guardar borradores sigue permitido.
