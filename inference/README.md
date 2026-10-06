---
title: GLF E5 inference
sdk: docker
app_port: 7860
---

# Servicio E5 para el portal GLF

Copiar esta carpeta a un Docker Space en Hugging Face. Solo contiene código;
no subir corpus ni expedientes al repositorio del Space. Configurar
`GLF_E5_API_KEY` como **Secret**, al menos 32 caracteres aleatorios.
El mismo valor se configura exclusivamente como variable de servidor Vercel.
No incluirlo en Git, capturas, chats ni variables NEXT_PUBLIC.

En Vercel configurar `GLF_E5_ENDPOINT=https://<space>.hf.space/embed`
y `GLF_E5_API_KEY`. La API exige esa clave incluso si el Space es público.
Un Space privado requiere además configurar acceso Hugging Face;
esa autenticación adicional aún no está implementada en el cliente del portal.
No habilitar hardware de pago sin aprobar su costo.

Modelo fijo: intfloat/multilingual-e5-small; 384 dimensiones, prefijos query:
y passage:, normalización L2. Es recuperación, no generación de respuestas.
No mezclar embeddings generados con otros modelos en knowledge_chunks.
La primera carga descarga el modelo. CPU gratuita puede suspenderse y demorar
al reiniciar; validar disponibilidad y latencia antes de uso institucional.
Para reproducibilidad final fijar versiones exactas y revisión del modelo tras
validar el contenedor. No se ha ejecutado ni desplegado este contenedor todavía.

## Corpus

Origen: Ejecucion/Semana 2/Productos/GLF_SGAS_Corpus_ES/work/GLF_SGAS_Corpus_ES.
Revisar inventario y marcadores de página; separar originales, traducciones y
síntesis. Los pares IA de Semana 3 sirven para evaluación exploratoria, no como
validación experta. Importar con un proceso administrativo, manteniendo
document_name, document_version y locator únicos. Generar vectores con /embed
(kind=passage, lotes de hasta 8), fragmentando por tokens para evitar truncamiento
del modelo. Marcar approved=true solamente tras revisión autorizada.
La ingesta, aprobación/versionado del corpus y auditoría de consultas todavía
requieren implementación. No publicar datos personales ni expedientes en GitHub.

## Estado y pruebas pendientes

El panel llama a /embed desde Vercel y consulta match_evidence con la sesión
Supabase del revisor. No usa service_role ni expone secretos al navegador.
El servidor comprueba rol y MFA antes de inferencia. No envía expedientes
automáticamente; el revisor escribe una consulta sin datos personales.
Falta limitar consumo de consultas por cuenta de forma persistente antes de
activar el endpoint; no considerar este servicio listo para producción.
Falta prueba integrada: cuenta y Space, secreto, indexación, consultas bilingües,
fallos/reinicio, tiempos y revisión de resultados por Ulf. Consultas vacías o
servicio caído no representan cumplimiento ni una evaluación completada.
