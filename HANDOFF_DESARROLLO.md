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

Resumen estructurado: source Formatos y Normativa de postulación/Formato-de-Nota-Conceptual-web.docx verificado: resumen máximo 500 palabras, sin límites individuales de palabras para otros apartados; máximo oficial 6 páginas (control global PDF pendiente). summary_parts JSON con contexto/problema/amenazas/justificación/solución/resultados; concept.summary conserva concatenación sin subtítulos para conteo SQL existente. SaveDraft regenera canonical summary desde partes; UI y Server Actions verificar partes completas/límite conjunto antes de preparar/enviar. PDF renderiza seis subtítulos; anteriores sin partes mantienen resumen original. Editor muestra resumen anterior íntegro en Contexto con indicación de redistribuir, no modifica silenciosamente. Otros apartados: contador de palabras y 12.000 caracteres (límite existente), no inventar tope 500 por campo. Campos geografía existentes en JSON; guardrails SQL para geografía/partes adicionales pendientes, no afirmar producción oficial completa. Nuevos menús/header y textos 69b836c/b24d12b/aaad950 Vercel success. Resumen test frontera 500/501 y parte faltante pasa, PDF estructurado y lint/tsc/build pasan.

## Sesión recordada — 7 octubre 2026
- Login y verificación MFA ofrecen Mantenerme conectado por 90 días en este navegador. Caducidad absoluta, sin extensión por refresco; desmarcado usa cookies de sesión.
- Login reconoce sesiones existentes; seguridad redirige si ya existe aal2. MFA y RLS permanecen obligatorios para personal interno; no se implementa bypass de segundo factor.
- Preferencia aplicada a cookies SSR, proxy y cliente navegador; cierre de sesión elimina preferencia. Pruebas de política de cookies, DB, dominio, PDF, lint y build aprobadas. Prueba real con cuenta y autenticador pendiente.


## Invitaciones de personal interno — 7 octubre 2026
- Migración 202610070012 aplicada por SQL Editor, consulta 2bde6291-bd2e-4404-b0cd-b8f3094e6b83, Success. No rows returned. No repetirla ni ejecutar db push sin reconciliar historial.
- Edge Function staff-invitations desplegada desde editor; usa secretos internos de Supabase, getUser/getClaims, AAL2 y validación de rol/delegación más RPC transaccional. Vercel no recibe service_role.
- Módulo prepara/edita, revisa, confirma envío, reenvía y cancela; estados auditados. Envíos limitados y con bloqueo/concurrencia. Usuario invitado inactivo hasta activación, email confirmado y contraseña establecida; luego MFA obligatorio. No asignar roles desde metadata.
- Ruta exacta https://glf-postulaciones.vercel.app/auth/activate añadida a Auth allowlist. La activación consume tokens de fragmento, limpia URL, verifica destinatario en DB y acepta desde Server Action. Puede abrirse en otro dispositivo.
- SMTP personalizado deshabilitado, confirmado en dashboard. Servicio de correo de pruebas puede rechazar destinatarios fuera del equipo Supabase. Consulta pendiente al titular sobre SMTP; no se enviaron invitaciones reales ni se crearon cuentas reales durante pruebas.
- Pruebas locales: 21 DB y 14 dominio/PDF, lint y build pasan. Comprobación alojada de servicio y UI pendiente al publicar. Activación real/entrega a bandeja requieren prueba autorizada y destinatario humano.


- QA alojada del módulo completada en Chrome con Schubert AAL2: seis invitaciones pendientes, edición Ulf conserva Sostenibilidad/delegación; revisión de envío muestra destinatario y checkbox obligatorio. Comprobar servicio devolvió Servicio conectado, sin correos enviados. Captura scratch/invitaciones-personal-glf.png. Vercel a841530 Success. Entrega real de correo y activación humana siguen pendientes por SMTP/prueba autorizada.

## 2026-10-07 — Convocatorias: borrador, vista previa y publicación
- Editor conservado tras guardar; permite retomar borradores desde el listado.
- Guardar / Vista previa / Publicar juntos. La vista previa y publicación se deshabilitan si hay cambios sin guardar; publicar también exige campos y reglas válidos.
- Se guardan borradores incompletos con un código identificador. Fechas nulas exclusivamente en borrador.
- Vista previa ES/EN con fechas en Galápagos, categorías, montos, plazos, requisitos, anexos y privacidad. No inicia postulaciones.
- Confirmación explícita con resumen y casilla obligatoria antes de publicar. Publicado queda sin edición de bases en este módulo.
- Migración 013 aplicada remotamente en una transacción mediante SQL Editor (consulta d088a0f5-a58d-481b-be46-0997ebd5e410), éxito confirmado. No ejecutar de nuevo.
- RPCs save_call_draft y publish_call_reviewed: permisos y MFA existentes, bloqueo de fila, control revision, registro privado de eventos. La ruta publish_call también valida contenido y fechas; publish_call_rules no se concede a usuarios.
- No se envían correos ni se publican convocatorias oficiales mediante esta verificación.
- QA publicada de d1633cf: 36 pruebas, lint, TypeScript y build correctos. Verificación con Chrome: guardado incompleto, retomar borrador, datos conservados, ES/EN, confirmación con casilla sin activar y bloqueo tras modificaciones. No se confirmó ninguna publicación.
- Borrador técnico QA-VISTA-PREVIA-20261007 (id 0dfd0147-9bde-49a3-9774-f675a41cbbaf), sin validez oficial, permanece sin publicar para revisión. Imagen de prueba local scratch/convocatoria-vista-previa.png; no incluir en Git.

## 2026-10-07 — Código sugerido de convocatoria
- Nueva convocatoria propone GLF-AAAA-NNN según año de Galápagos y el mayor consecutivo ya existente. Serie de pruebas independiente GLF-PRUEBA-AAAA-NNN, seleccionable en el formulario.
- Código editable hasta publicar; botón para recuperar la sugerencia. Cambiar serie/código/sugerencia requiere guardar nuevamente antes de vista previa/publicación. Códigos previos se conservan al editar.
- Guardado normaliza a mayúsculas y comprueba duplicados. Si otro usuario tomó el código, conserva los campos y propone uno disponible para revisar y reintentar. La restricción UNIQUE de Supabase resuelve colisiones simultáneas; no se reserva un número al abrir el formulario.
- Sin migración ni consulta SQL nueva. Serie de código es nomenclatura, no cambia por sí sola elegibilidad o validez de una convocatoria.
- 37 pruebas pasaron, incluidos independencia de series, cambio de año Galápagos, más de 999 y unicidad de la base de datos. Lint y TypeScript correctos.

## 2026-10-07 — Destino local de respaldos
- Decisión expresa: elegir carpeta local, Google Drive para escritorio o dispositivo externo; no pedir usuario/contraseña Google. Sin cifrado adicional del ZIP.
- /internal/backups requiere administrator y MFA (página y exportación). No se amplían roles. Selector File System Access en Chrome/Edge con permiso explícito; handle IndexedDB separado por usuario y navegador. Destino recordado no significa copia ni sincronización completada.
- Copia manual todos los expedientes recibidos o por convocatoria: JSON relacional, versiones, documentos originales, eventos/revisiones/decisiones/acuerdos. Anexos se descargan directamente de Storage con URLs firmadas 15 minutos; nunca incluir las URLs en ZIP. SHA-256 y tamaño se verifican antes de escribir. ZIP asíncrono en navegador, manifiesto de hashes, fallback descarga estándar.
- Límites actuales: 200 expedientes / 128 MB sin comprimir; datos del plan máximo 4 MB. Lecturas secuenciales, no snapshot transaccional. No incluir borradores sin remitir, Auth/secretos, configuración ni corpus RAG. No equiparar esta copia al respaldo técnico completo.
- Automatización diaria/semanal y retención 30 días/8 semanas NO activadas: requieren runner independiente o servicio cloud configurado. Copias manuales no se borran. Delegación de permiso backup, auditoría de jobs, exportación Excel y dossier ZIP individual continúan pendientes del alcance anterior. No afirmar que todo el módulo de expedientes está terminado.
- Despliegue 9072632 confirmado Success. QA Chrome admin AAL2: módulo visible, selección por convocatoria, descarga real en Downloads. ZIP prueba de vista previa (0 expedientes) contiene 13 archivos, 11 hashes validados. Picker nativo/escritura en destino elegido y anexos reales aún requieren prueba humana. 37 pruebas previas, lint/TypeScript/build pasan. No se enviaron invitaciones ni se cambiaron permisos.

## 2026-10-07 — Selección explícita de respaldos
- Pantalla en tres pasos: alcance (todos / convocatoria / expedientes específicos), destino (descarga / carpeta) y resumen antes de ejecutar. Convocatorias con conteo, búsqueda por referencia/proyecto, filtro de convocatoria y selección múltiple. Sólo remitidos; títulos desde versiones remitidas. Vacío o >200 no habilita copia.
- Selector orientado inicialmente a Documentos; guía para escoger subcarpeta dedicada, incluyendo Drive y dispositivo externo. Chrome conserva sus bloqueos de carpetas protegidas. No se eluden.
- Exportación POST mismo origen, administrator+AAL2, esquema discriminado estricto; rechaza selección vacía, duplicada, inválida o ambigua. IDs seleccionados comprobados antes de emitir URLs: faltantes producen 409. RLS intacta.
- 38 pruebas pasan, incluido riesgo de convertir selección vacía en exportación completa; lint, TypeScript y compilación pasan. QA alojada pendiente tras publicación.
- Vercel 385c26d Success. QA Chrome administrador AAL2: tres radios visibles, convocatoria muestra conteo y resumen; selección específica muestra filtro/buscador/tabla; destino carpeta muestra orientación. Ambos calls actualmente tienen 0 expedientes remitidos: botón deshabilitado verificado. No se generaron expedientes ficticios para forzar prueba. Descarga con selección no vacía y selector nativo/escritura requieren expediente remitido y prueba humana. Captura local scratch/respaldos-seleccion-expedientes.png (no subir a Git).

## 2026-10-08 — Portal externo separado
- /applicant es Nueva postulación: sólo convocatorias abiertas/categorías. No consulta ni muestra expedientes.
- /applicant/applications es Mis postulaciones: exclusivamente aplicaciones del usuario conectado, con filtro explícito applicant_id y RLS existente. Incluye borradores para retomarlos, estados remitidos y propuesta completa cuando corresponde.
- Navegación usa rutas distintas; marca activa diferenciada. Enlace de regreso del editor apunta al listado propio. Usuarios internos siguen fuera de estas rutas por requireViewer applicant.
- 38 pruebas pasan incluyendo aislamiento de usuarios en DB, lint y build; QA alojada pendiente publicación y sesión externa.

## 2026-10-08 — Guía de postulación e icono institucional
- Fuente revisada https://galapagoslifefund.org.ec/es/2convocatoria/ y Manual de Procedimientos GLF 2025 vinculado. Segunda convocatoria cerrada 02-02-2026; tabla/eligibilidad se presentan como referencia identificada. Reglas operativas de tarjetas provienen de la convocatoria configurada, sin alterar límites ni eligibilidad ni publicar convocatorias.
- /applicant/guide (sólo applicant): etapas 1/2, categorías, consulta breve de elegibilidad/documentos/envío/correcciones y enlace institucional. Nuevo menú Cómo postular. Identificación/evaluación inicial sin mitigación fase1; PGAS fase2 conforme última instrucción Ulf.
- /applicant: explicación breve Nota Conceptual antes de tarjetas; instrucción de escoger categoría; duración y cofinanciamiento separados. No reintroducir expedientes.
- Icono SVG usa el símbolo del logo existente, con colores originales; se elimina favicon estándar Next. No reconstruir marca con IA.
- Nota de ambigüedad límite USD250k web(ambas categorías) frente a manual(grande >250k): no inventar regla; manda configuración de la convocatoria.
- Lint/TypeScript/build correctos; QA visual portal externo pendiente sesión applicant.

## 2026-10-08 — Reglas generales confirmadas por Schubert
- El usuario confirma montos, categorías y elegibilidad vigentes para convocatorias anteriores y futuras; no presentarlos como reglas históricas/exclusivas de segunda convocatoria. Cambios futuros requieren decisión del directorio y actualización del portal.
- Guía ES/EN: elimina fecha de cierre y referencia histórica de categorías; Consulta rápida usa Quiénes pueden postular. Conserva datos y fuente institucional, sin nota sobre solapamiento USD250k en la interfaz. No alterar fechas de convocatorias ni estados.
- Esta instrucción reemplaza el tratamiento histórico del apartado previo de relevo.

## 2026-10-08 — Limpieza institucional y prioridades
- Retirados de guía ES/EN enlace Información institucional del GLF y del pie global la frase Postulaciones / Salvaguardas / Decisiones trazables. Pie conserva nombre institucional únicamente.
- Aclaración Schubert: prioridades temáticas y lineamientos sí cambian por convocatoria; categorías, montos, elegibilidad y plazos de categorías siguen comunes hasta decisión de directorio. Evitar referencias/comentarios editoriales innecesarios en interfaz lista para revisión GLF.

## 2026-10-08 — Pie y versión
- Pie aprobado: © 2026 Galápagos Life Fund · v0.1.0, sin Todos los derechos reservados. Mismo contenido ES/EN.
- Versión se importa desde web/package.json (fuente única), actualmente 0.1.0. Commit exacto continúa en historial Git/Vercel.

## 2026-10-08 — Convocatoria presentada sin avisos de prueba
- Solicitud expresa: retirar Prueba interna y descripción de datos ficticios; versión preparada para pruebas reales. Cambio en datos, sin ocultar por CSS ni sustituir lógica.
- Ejecutada operación supabase/operations/20261008_call_presentation.sql en SQL Editor. Título Convocatoria de subvenciones GLF / GLF grant call; descripción vacía ES/EN. ID 9e195a21-938c-459c-8a08-f955bfdc4d05; status published conservado, reglas/fechas/código sin cambios. Revisión incrementada y evento privado presentation_text_updated. Consulta a5445272-c90d-4d71-b50b-84f2c1aca876 guardada; no repetir operación por su guardia de contenido.
- Al hidratar sql/new se abrió snippet anterior 013; primer fill dejó texto parcial. Consulta produjo exclusivamente error de sintaxis, sin cambios DB. Snippet original 013 restaurado desde repo y guardado SIN ejecutarlo. Luego se abrió consulta independiente y se aplicó operación correcta con resultado verificado.
- Evidencia local scratch/convocatoria-texto-depurado.png, no subir.
- Usuario quiere reinicio de datos DESPUÉS de pruebas reales, no ahora. No hay eliminación realizada ni programada. Antes de limpieza: inventario, copia verificada y acuerdo de alcance (expedientes/anexos/cuentas de prueba/corpus); preservar esquema, permisos, configuración y accesos administrativos necesarios. No interpretar el plan futuro como orden inmediata de eliminar base completa.

## Alineación estratégica — 2026-10-08, versión 0.2.0
- Selecciones estructuradas dentro de concept.strategic_alignment, almacenadas en el JSONB del expediente y sus versiones; sin borrar datos ni crear una segunda fuente de verdad.
- Objetivo general y hasta 10 específicos, identificadores UUID, contribución prevista por objetivo, selección múltiple de políticas Plan Galápagos 2030, objetivos ODS y líneas generales GLF.
- Catálogo inicial comprobado: 17 políticas del anexo 6 del Plan, sus relaciones con los 17 ODS y 7 líneas del Manual GLF sección 3. Etiquetas abreviadas bilingües; enlaces a fuentes. Los cruces son a nivel de política/objetivo ODS, no de las 169 metas. No se declara completo el catálogo de estrategias del Plan.
- Sugerencias ODS deterministas según políticas elegidas; no autoselección ni puntuaciones. Se mantienen selecciones previas si cambia una política; el aplicante decide retirarlas.
- Conjunto del proyecto cubre los tres marcos, cada objetivo tiene contribución y alguna referencia; no se fuerzan los tres marcos en cada específico. Borradores incompletos siguen guardándose.
- Actividades permiten asociar objetivos específicos; al retirar un objetivo se limpian sus asociaciones en el editor. Validación de referencias también en servidor/BD.
- Compatibilidad: texto anterior se conserva en legacy_text al organizarlo. No se convierte automáticamente en selecciones. Los expedientes anteriores sin estructura siguen compatibles.
- PDF bilingüe y revisión interna generan texto desde identificadores y catálogo, sin confiar en etiquetas enviadas por cliente. Priorización específica de convocatorias y elegibilidad permanecen distintas de las líneas generales seleccionables.
- Migración 015 aplicada manualmente en SQL Editor, transacción con Success. Consulta posterior confirma wrapper anterior presente y 3 expedientes conservados. No repetir ni db push sin conciliar historial CLI.
- Pruebas: 24 de base y 24 TypeScript pasan, incluyendo referencias falsas, duplicados, cobertura y PDF con alineación. UI probada en Chrome mediante ruta local temporal, retirada antes de compilar/publicar.
- No se enviaron invitaciones ni se alteraron expedientes existentes. No se añadió planificación del Parque Nacional Galápagos.
- Despliegue verificado: commit e9c5d9e; Vercel CpEXjzuJ2aXStqK8aR4LXqjFANHE Ready, Preview con alias glf-postulaciones.vercel.app. Página publicada confirma footer v0.2.0. No confundir este estado de revisión con apertura oficial de una convocatoria.

## Objetivos y selectores laterales — versión 0.2.1
- Cada objetivo tiene su propia caja de texto y, al lado, selectores compactos de Plan Galápagos 2030, ODS y GLF. Las selecciones múltiples se muestran como etiquetas removibles; los ODS relacionados con las políticas elegidas aparecen primero.
- Botón + para añadir específicos; eliminación independiente. Un objetivo general permanece único. La contribución prevista se registra en un campo separado del objetivo.
- En móvil los selectores quedan debajo. Chrome verifica añadir/eliminar específicos, quitar/reseleccionar referencias y ausencia de desbordamiento a 390 px. Lint aprobado; ruta de prueba temporal retirada.
- Sin cambios de esquema, permisos ni expedientes; migración 015 no se repite. No se envían invitaciones.

## Registro individual de riesgos — versión 0.3.0, 2026-10-09
- concept.risk_register opcional contiene UUID, dimensión y nombre; numeración visible RA/RS por dimensión. Nuevos borradores inicializan registro vacío. Históricos conservan texto y requieren acción Organizar; no se altera su contenido automáticamente.
- Riesgos de actividades referencian source_id del registro; nombre/dimensión se sincronizan al editar y guardar. Una actividad admite varios riesgos y un riesgo varias actividades, cada asociación mantiene probabilidad/gravedad/puntaje independiente. Al cambiar la selección se reinicia la calificación inicial y residual.
- Registro vinculado no puede eliminarse hasta retirar asociaciones. Completar exige vincular cada registro al menos a una actividad; referencias falsas y duplicados en la misma actividad se rechazan. Borradores permiten campos pendientes.
- Narrativas y PDF usan numeración derivada del registro; matriz incluye código asociado. UUID persiste aunque se renumeren filas al eliminar. Medidas y PGAS continúan únicamente en fase 2.
- Migración 016 aplicada en transacción en SQL Editor: Success; consulta posterior confirma wrapper y 3 expedientes conservados. No repetir migración. Permisos no se amplían.
- Lint y 51 pruebas pasan (25 BD, 26 TypeScript). Chrome verifica añadir/quitar filas ambientales y sociales y ancho móvil sin desbordamiento. Ruta local temporal retirada antes de publicar.

## Respuesta visual uniforme — versión 0.3.1
- Preparar nota conceptual y cierre de sesión usan SubmitButton compartido; formularios internos de revisión, reapertura, decisiones, convenios y roles/delegaciones también. Prop disabled conserva restricciones anteriores además de pending.
- Reportes usa Next Form GET con estado pendiente. RAG, importación corpus y respaldo muestran spinner ActionLabel y aria-busy; los flujos de autenticación, MFA y edición ya lo implementaban.
- Criterio permanente documentado en web/AGENTS.md: progreso visible inmediato, bloqueo de repetición y recuperación al terminar; sin demoras artificiales en producción.
- Chrome verificó componente compartido con operación temporal: Preparando… y botón deshabilitado durante espera; recupera etiqueta/habilitación al terminar. Ruta temporal retirada. Sin cambios de datos, permisos ni invitaciones.
