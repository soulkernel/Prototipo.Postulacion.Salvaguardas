# Preparación de entornos nuevos

## Estado

El usuario autorizó crear proyectos específicos nuevos de Supabase y Vercel. Nombres propuestos: `glf-postulaciones-preview`. Esta guía prepara su configuración; no acredita que los proyectos ya existan. Mantener la prueba separada del futuro entorno institucional y usar datos ficticios.

## Supabase

1. Iniciar sesión en la organización autorizada y crear un proyecto nuevo. El titular establece y conserva la contraseña de la base en su gestor; no enviarla por chat ni incluirla en Git.
2. Seleccionar región disponible próxima a los usuarios y al cómputo web, revisando requisitos institucionales de alojamiento antes de casos reales. Empezar en plan gratuito si está disponible y no contratar planes de pago sin autorización.
3. Aplicar, en orden y mediante migraciones, los cuatro archivos de `supabase/migrations`. Nunca aplicarlos a otra base ya existente sin revisar su historial. No se han aplicado remotamente todavía.
4. Activar confirmación de correo, política de contraseña de al menos 12 caracteres, MFA TOTP, límites de Auth y SMTP autorizado para pruebas fuera del equipo. Verificar capacidad y límites del plan. La configuración del frontend por sí sola no impone estas políticas en Auth.
5. Configurar Site URL y URLs de redirección exactas: URL de la vista previa y `/auth/callback`. Evitar comodines de dominios ajenos. Probar registro, confirmación, recuperación y cierre global de sesión.
6. Registrar una cuenta de administración con correo verificado. El propietario de la base asigna el primer rol administrator a su UUID mediante SQL controlado y registra esa operación. Los roles posteriores se asignan desde la interfaz con MFA. No crear cuentas compartidas.
7. Verificar RLS, bucket `application-files` privado y ausencia de permisos directos de escritura. Ensayar dos solicitantes y cada rol del personal, con y sin segundo factor.

## Vercel

1. Crear proyecto nuevo vinculado a `soulkernel/Prototipo.Postulacion.Salvaguardas`, directorio raíz `web`, framework Next.js y Node 24.
2. Desplegar **feat/full-grants-platform** como vista previa. Mantener `main` y GitHub Pages intactos. No activar un dominio institucional ni promocionar a producción todavía.
3. Configurar las variables del entorno Preview: `NEXT_PUBLIC_SITE_URL` (URL exacta estable de la vista previa), `NEXT_PUBLIC_SUPABASE_URL` y `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`. Son configuración pública; jamás colocar `service_role`, contraseña de base o token personal en variables NEXT_PUBLIC.
4. Las funciones operan con JWT del usuario y RLS; no se requiere una clave administrativa. No añadir datos reales al build ni a logs.
5. Confirmar los archivos de fuente PDF incluidos en el trazado de despliegue y probar las dos descargas, QR, anexos y navegación bilingüe.
6. Mantener la protección de acceso de Preview que permita el plan. La protección de Vercel no reemplaza Auth/RLS de la aplicación.

## Prueba de aceptación antes de producción

- Solicitante A nunca ve ni modifica solicitudes o archivos de B, ni siquiera invocando directamente las API.
- El personal sin MFA no accede al expediente; cada rol solo ejecuta su función. Una cuenta inactiva queda sin acceso.
- Guardar en dos pestañas detecta conflicto; enviar congela contenido y anexos; correcciones requieren autorización y nuevo envío, aun si vence su plazo.
- Revisión de salvaguardas vinculada a la versión exacta; invitación no es aprobación; CAT no puede emitir aprobación; monto convenido no supera aprobado.
- Verificar fechas inclusivas, montos/categorías, cofinanciamiento, trimestre, anexos requeridos y catálogo real.
- Dos PDF separados, traducciones y formato institucional validados; QR exige acceso autorizado; anexos se descargan con autorización.
- Reportes conciliados con versiones enviadas y convenios; sin datos personales por defecto, sin mezclar metas con impactos logrados.
- Plan de backups/restauración, retención, incidentes, revisión de acceso y cargas maliciosas definido con GLF.

## Límites explícitos

- La ruta de carga admite 4 MB para ajustarse al límite de solicitud de Vercel. El bucket tiene capacidad por objeto de 25 MB, pero eso no aumenta el límite del formulario. Para más tamaño implementar carga firmada directa con controles equivalentes.
- PDF regenerado desde versión inmutable: falta archivo binario definitivo y su huella, además de prueba de re-descarga del QR en el entorno alojado.
- Validador de firma de archivo no es antivirus ni inspección completa de OOXML. Falta cuarentena/escaneo y limpieza de cargas huérfanas.
- Noto Sans embebida en PDF garantiza acentos ES/EN sin depender de fuentes del servidor; Arial en interfaz. El uso/licencia de Arial embebida y la maquetación oficial final deben resolverse si se exige esa fuente en el producto definitivo.
- E5 local y corpus todavía no integrados. No presentar el buscador preparado en SQL como inferencia operativa.

## Avance remoto verificado — 2026-10-06

- Supabase creado: `glf-postulaciones`, organización GLF, ref `dcxhuwghakdjcnrqkziq`, región us-west-2, plan Free.
- URL: https://dcxhuwghakdjcnrqkziq.supabase.co
- Instaladas las migraciones 202610050001 a 202610060005 en una transacción mediante SQL Editor. Resultado: Success. No rows returned.
- Verificación remota: 14 tablas public; 0 tablas public/private sin RLS; bucket application-files privado; authenticated no lee private.role_events; 0 permisos directos INSERT/UPDATE/DELETE/TRUNCATE para anon/authenticated en public.
- La quinta migración protege adicionalmente el registro privado de cambios de roles. 14 pruebas de base locales pasan con ella.
- IMPORTANTE: aplicación manual por SQL Editor; aún NO se ha conciliado el historial de Supabase CLI. Antes de cualquier db push, registrar/repair las cinco versiones como aplicadas; no ejecutar de nuevo las migraciones iniciales.
- Pendiente: políticas Auth, URL de redirección, cuenta administradora autorizada, pruebas integrales de Auth/Storage y despliegue Vercel.
- Vercel aún no creado: GitHub solicita Confirm access en https://github.com/settings/installations/153846223 antes de autorizar el repositorio. Nombre elegido: glf-postulaciones. Mantener main/prototipo intactos y usar feat/full-grants-platform, raíz web.
- No se han cargado expedientes reales ni obtenido contraseñas de base.

## Vercel y Auth — avance 2026-10-06
- Permiso GitHub Vercel aprobado expresamente por el usuario y guardado para el repositorio específico, conservando seguimiento-glf.
- Proyecto Vercel creado: glf-postulaciones, ID prj_QKNHR91b7cJ76x750PgMRzX0TJ98, equipo schubert1-3992s-projects; Git conectado; raíz web, Next.js, Node 24.
- Uso de datos del proyecto para entrenar modelos de Vercel desactivado.
- Tres variables públicas configuradas en Preview: URL Supabase, publishable key y NEXT_PUBLIC_SITE_URL. No se usa service_role.
- URL estable Preview: https://glf-postulaciones-git-feat-full-819731-schubert1-3992s-projects.vercel.app
- Supabase Site URL y redirect exacto /auth/callback configurados a esa URL. Confirm email activado, anonymous sign-in desactivado y longitud mínima de contraseña 12 guardada.
- Commit 9eac0f8 subido. Vercel hizo un primer despliegue como Production (BEeGNLXxqh6e78WujJ8tw9yBSwnW), sin variables Production. No usar ese despliegue: iniciado redeploy explícito Preview 2sDkHSFeuZTbJxdZkgFjnHbw3KEc con las tres variables. Main/GitHub Pages permanecen intactos.
- Dominio automático antiguo project-v1no4.vercel.app aún asociado a Production; no es el enlace de pruebas.

## Administrador inicial — 2026-10-06
- El titular autorizó expresamente habilitar su cuenta confirmada como administrator.
- Aplicado por SQL Editor en transacción, comprobando identidad/correo confirmado, ausencia de otro administrador inicial y registrando previous_role/assigned_role en private.role_events. Resultado verificado: Schubert Lombeida Manjarrez, administrator, active=true.
- No se modificaron credenciales ni se redujo la exigencia AAL2 para personal interno. El titular debe completar personalmente su autenticador para acceder al panel.
- Sigue pendiente completar invitaciones de personal interno, desactivación con auditoría y prueba integrada del módulo. No se han enviado invitaciones a terceros.


## Servicio E5 en la nube — 2026-10-06
- Hugging Face Space Schubertlm/glf-e5-inference: Protected, CPU Basic gratuito, app.py/requirements.txt/Dockerfile cargados por el titular; estado Running verificado.
- El titular guardó GLF_E5_API_KEY como secreto tanto en HF como en Vercel Preview para feat/full-grants-platform. No se leyó el valor.
- GLF_E5_ENDPOINT configurado en Vercel Preview: https://schubertlm-glf-e5-inference.hf.space/embed.
- Redeploy del commit 4b33b79 iniciado: 5r2W2qtN6zwm9feaxMCveoMoJ3Ks. Pendiente confirmación final y consulta autenticada.
- Corpus todavía no importado/indexado/aprobado. No afirmar que el RAG completo ni generación de evaluación estén operativos.
