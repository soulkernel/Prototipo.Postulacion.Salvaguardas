# Auditoría funcional y de integridad — 10 de octubre de 2026

Versión corregida: 0.4.16.

## Resultado verificado

- 66 pruebas aprobadas: 28 de base de datos SQL en PGlite y 38 de dominio/documentos. ESLint, TypeScript y compilación de producción aprobados.
- Supabase publicado: 11 expedientes conservados; cero documentos, versiones o preparados huérfanos; cero expedientes sin perfil de solicitante; cero archivos registrados sin objeto de almacenamiento; cero tablas públicas sin RLS.
- Navegador publicado: listado de borradores, navegación hacia guía y nueva postulación, traducción ES/EN y regreso a español. Acceso externo a /internal redirige al portal externo.
- Expediente de prueba interislas: navegación entre secciones, vínculos con objetivos, revisión, recuperación de enlaces de documentos preparados y descarga efectiva de ambos PDF. Nombres incluyen referencia, versión, fecha/hora Galápagos e idioma. Envío deshabilitado sin los dos PDF firmados.
- Pruebas SQL verifican aislamiento entre solicitantes, permisos de roles/MFA, bloqueo de expedientes enviados, versiones y correcciones autorizadas, requisitos de presentación, límites financieros y compuertas de propuesta completa y convenio.
- Pruebas de documentos verifican fuentes, paginación, QR, nombres, texto, metadatos del comprobante y correspondencia de anexos con la versión recibida.

## Corrección realizada

Una carga firmada podía superar la comprobación inicial y coincidir con una edición y preparación desde otro dispositivo. Se agregó register_signed_document: bloquea el expediente durante el registro y comprueba propietario, estado editable, revisión esperada, fase, tipo PDF y preparación correspondiente al contenido. La API utiliza esta operación para documentos firmados de fase 1. El timestamp devuelto corresponde al registro efectivo en la base de datos. Prueba de regresión incluida. Migración 202610110025 aplicada y verificada en Supabase.

## Límites y comprobaciones pendientes

Esta auditoría no certifica ausencia absoluta de defectos. No se enviaron borradores existentes ni se cambiaron decisiones institucionales para probar. Falta una prueba operativa con dos documentos realmente firmados: carga, envío explícitamente autorizado, descarga automática del comprobante y apertura de sus QR con la cuenta autorizada. La verificación criptográfica de firma corresponde al GLF y no está automatizada. Los controles internos, exportaciones/respaldos y RAG cuentan con revisión de código/pruebas aplicables, pero no se repitió en esta sesión su recorrido completo autenticado ni una inferencia real del proveedor. No se probó entrega de correos nuevos. Los fallos de hidratación históricos que figuraban en la consola no reaparecieron durante la navegación y recarga actuales.

No se eliminaron expedientes, no se enviaron postulaciones y no se emitieron invitaciones. Una carga rechazada después de almacenar puede dejar un objeto privado sin registro: no se considera recibido ni aparece en el expediente; la limpieza de estos objetos debe hacerse mediante una tarea controlada futura.
