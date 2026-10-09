# Auditoría del portal GLF — 8 de octubre de 2026

Versión de aplicación: 0.1.1. Las 18 comprobaciones HTTP del despliegue aprobaron después de la corrección de la API del corpus.

## Alcance y conclusión

Revisión de código, pruebas de PostgreSQL con todas las migraciones, controles en la base Supabase real, navegación interna autenticada y pruebas HTTP anónimas sobre el despliegue. Se conservaron los datos existentes. No se publicaron nuevas convocatorias, no se enviaron invitaciones y no se adoptaron decisiones sobre expedientes.

La auditoría encontró defectos corregibles y funcionalidades aún pendientes. No equivale a certificar que todos los flujos han sido ejecutados en producción: actualmente existen tres borradores y cero expedientes remitidos.

## Hallazgos corregidos

| Hallazgo | Corrección | Verificación |
|---|---|---|
| `anon` y `authenticated` conservaban TRUNCATE en `prepared_documents`; RLS no protege TRUNCATE. | Migración 014 revoca todos los permisos directos y concede solamente SELECT al rol autenticado. No vacía ni cambia registros. | Aplicada en Supabase; consulta devuelve únicamente `authenticated / SELECT`. Prueba de regresión comprueba TRUNCATE, INSERT, UPDATE, DELETE, TRIGGER y REFERENCES. |
| La bandeja interna consultaba el título del payload editable. | Consulta la última versión remitida; no muestra modificaciones de título de un borrador posterior. | Lint y compilación; pruebas existentes cubren la inmutabilidad y las fases. La vista con expedientes remitidos requiere la prueba funcional indicada abajo. |
| La bandeja podía truncarse por el límite predeterminado de filas. | Paginación de expedientes y de versiones, orden estable con ID. | Lint y compilación. No hay volumen real suficiente para una prueba de carga. |
| El respaldo de medidas no paginaba y omitía las referencias del catálogo. | Pagina las medidas e incorpora las entradas del catálogo referenciadas. | Lint y compilación. Respaldo con documentos remitidos pendiente de prueba funcional. |
| La API del corpus devolvía una redirección HTML ante acceso anónimo. | Respuesta JSON 403; exige administrador activo y AAL2 antes de procesar. | Prueba HTTP anónima después del despliegue. |
| Dos archivos de pruebas no se ejecutaban con `npm test`. | Se incorporan las pruebas de embeddings y reintentos de carga del corpus. | 43 pruebas: 23 de base de datos y 20 de dominio, PDF, selección de respaldo, embeddings y carga. |
| Enlace secundario de usuarios conservaba una denominación anterior. | Se uniforma a Gestión de usuarios. | Compilación y navegación. |
| La revisión interna omitía los campos de la propuesta completa y podía continuar con consultas incompletas. | Se muestran los campos de Fase 2, se identifica su PDF correctamente y se usa la fase de la última versión enviada para los riesgos. Ante un error de consulta o ausencia de versión se detiene la visualización. | Lint y compilación; comprobación con un expediente de Fase 2 pendiente. |

## Base Supabase real

Consultas de solo lectura; no se extrajeron contraseñas, tokens ni contenido personal para este informe.

| Comprobación | Resultado |
|---|---:|
| Tablas públicas sin RLS | 0 |
| Restricciones sin validar, esquemas public/private | 0 |
| Documentos vinculados a versiones de otro expediente | 0 |
| Convenios vinculados a documentos de otro expediente | 0 |
| Riesgos vinculados a actividades de otro expediente | 0 |
| Expedientes remitidos sin versión congelada | 0 |
| Documentos registrados sin objeto en Storage | 0 |
| Objetos del bucket sin documento registrado | 0 |
| Perfiles sin cuenta Auth | 0 |
| Funciones SECURITY DEFINER sin search_path fijo | 0 |
| Bucket de expedientes público | 0 |
| Convocatorias publicadas con fechas inválidas | 0 |
| Invitaciones enviadas | 0 |
| Borradores / expedientes remitidos | 3 / 0 |
| Fragmentos del corpus / aprobados | 3.549 / 0 |

Los ceros relativos a recepción, convenios y versiones deben interpretarse junto con la ausencia de expedientes remitidos. No prueban por sí solos el funcionamiento completo de esos procesos. Las pruebas de PostgreSQL cubren envío, bloqueo, correcciones, revisión por rol, decisiones, importes, firma y separación de fases con datos de prueba aislados.

## Navegación, botones y seguridad

- Pantallas internas de expedientes, convocatorias, RAG, reportes, respaldos y usuarios cargan con la sesión administrativa y segundo factor.
- Convocatorias: creación incompleta conserva Vista previa y Publicar desactivados; el borrador guardado abre una vista previa ES/EN y permite volver sin publicar.
- Respaldos: funcionan los controles de alcance total, convocatoria y expedientes específicos. Sin expedientes recibidos, el botón de descarga permanece desactivado y explica la causa.
- Gestión de usuarios: las invitaciones permanecen pendientes; el cambio del propio rol está desactivado. Se comprobó el servicio sin enviar mensajes.
- Las rutas externas e internas protegidas redirigen al acceso cuando se consultan sin cookies. Inicio, acceso, registro e icono responden; `/demo` redirige al inicio. Las APIs no permiten escrituras anónimas.
- Pruebas de dominio: montos, cofinanciamiento, gastos administrativos, campos obligatorios, teléfonos, geografía, límites de palabras, selección de respaldos y redirecciones seguras.
- PDF: prueba de fuentes, paginación e imagen QR. No se ha verificado aún una firma electrónica real seguida de carga y envío en el despliegue.
- Dependencias de producción: `npm audit --omit=dev` reportó cero vulnerabilidades. Lint y compilación de producción aprobados.

## Pendientes que impiden declarar validación funcional completa

1. Ejecutar con cuenta externa un expediente de prueba completo: borrador, reapertura, PDF, firma fuera del portal, anexos y envío. Comprobar con otra cuenta que no accede a ese expediente.
2. Sobre ese expediente, probar revisión, corrección autorizada, invitación a fase 2, PGAS, revisión y decisiones, convenio y descarga. No sustituir la decisión humana por un resultado RAG.
3. Descargar un respaldo no vacío, abrir ZIP, comparar documentos y hashes, probar carpeta local/Drive sincronizado y revisar restauración de negocio. El selector nativo de carpeta requiere comprobación manual.
4. El corpus está cargado pero no aprobado. Falta el flujo de validación/aprobación de fuentes; no aprobarlo automáticamente ni anunciar la consulta RAG como operativa. Falta comprobar inferencia y evidencia citada una vez aprobadas fuentes.
5. Exportación consolidada XLSX por convocatoria y todas las convocatorias pendiente. Actualmente existe CSV de reporte; no presentarlo como Excel completo de expedientes.
6. Respaldos automáticos y recuperación técnica integral no están activados. El ZIP manual no incluye Auth, secretos ni configuración de despliegue y no es una instantánea transaccional. Puede incluir el estado editable de expedientes que ya fueron remitidos, además de sus versiones congeladas.
7. Correo remitente institucional/SMTP pendiente. No cambiarlo a una cuenta personal ni enviar invitaciones antes de la autorización del usuario.
8. Seguimiento, control financiero y cierre de ejecución se mantienen como módulo posterior, según el alcance acordado.

## Continuidad

La migración 014 se aplicó individualmente en el editor SQL. Las migraciones anteriores fueron aplicadas manualmente; no ejecutar `db push` ni repetirlas sin reconciliar el historial. Mantener la base de pruebas hasta revisión de técnicos y autorización explícita de arranque de producción. No ejecutar limpieza ni reseteo como parte de esta auditoría.

El comprobador reutilizable `web/scripts/audit-http.mjs` no usa cookies y no crea registros; valida rutas y rechazo de peticiones anónimas vacías. Ejecutarlo con Node y acceso a Internet. Las capturas de evidencia se guardan localmente fuera del material a publicar.
