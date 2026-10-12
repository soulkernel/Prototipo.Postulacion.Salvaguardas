# Integración de métodos de apoyo GLF

## Estado al 12 de octubre de 2026

Implementación local: pestañas independientes E5 y BM25 + Qwen; acción de servidor autorizada para sostenibilidad y administración mediante el control MFA existente; validación del contrato de respuesta, origen de fuentes GLF y correspondencia de citas con evidencia; manejo de cuotas y fallos sin bloquear E5. Credencial del servicio exclusivamente en servidor. Destino permitido: HTTPS de Hugging Face Spaces, ruta /api/ask.

Space creado: https://huggingface.co/spaces/Schubertlm/glf-rag-bm25-qwen, Docker, CPU Basic gratuito. La creación del Space NO confirma que el servicio esté desplegado ni operativo. Archivos cargados y construcción iniciada en commit HF 0dbf51623cddd67c5eb92ffe32994d567dccbbab. Falta configurar secretos, verificar inferencia real, conectar variables en Vercel y desplegar el portal. La interfaz nueva aún no está publicada.

## Procedencia y alcance

rag-service/UPSTREAM.json fija la rama pública y el commit del compañero. Los ocho archivos conservados se compararon byte por byte sin diferencias. No se modifican recuperación BM25, abstención, validación de citas ni métricas de su código. prepare_space.py empaqueta solamente esos archivos públicos y su manifiesto; excluye expedientes, claves y el corpus ZIP privado.

La variante pública reconstruye sus fuentes desde PDF oficiales. No es el corpus privado de 585 fragmentos ni la ejecución local Ollama. Las métricas académicas de la variante local no certifican esta instalación. Modelo configurado originalmente: Qwen/Qwen2.5-7B-Instruct-1M:fastest.

E5 mantiene su servicio, corpus aprobado y controles actuales. La importación del corpus en Supabase afecta E5, no el corpus del servicio BM25.

## Publicación pendiente

1. Ejecutar python rag-service/prepare_space.py. Subir Dockerfile, README.md y service.zip generados en scratch/hf-rag-deploy al Space.
2. Configurar secretos HF_TOKEN y DEMO_ACCESS_CODE en Settings del Space. No publicar ni registrar sus valores en Git. HF_TOKEN necesita permiso de Inference Providers. Configurar GLOBAL_DAILY_LIMIT=60 y RATE_LIMIT_PER_HOUR=15.
3. Confirmar CPU Basic gratuito, sin almacenamiento ni hardware pagado. Mantener límite adicional de Inference Providers en USD 0 y sin recarga automática. Verificar si los créditos incluidos permiten consultas con este límite; no aumentar gasto automáticamente.
4. Verificar /healthz, rechazo de consultas sin credencial, consulta normativa y abstención. No consumir inferencia repetidamente para pruebas de carga.
5. Vercel: GLF_QWEN_ENDPOINT=<URL HTTPS del Space>/api/ask; GLF_QWEN_API_KEY=<mismo DEMO_ACCESS_CODE>. Ninguna variable debe llevar prefijo NEXT_PUBLIC_. No poner HF_TOKEN en el cliente.
6. Compilar, publicar y probar con cuenta interna autorizada y MFA. Confirmar que usuarios externos no pueden ejecutar la acción.

## Límites importantes

Las cuotas originales están en memoria y se reinician con el servicio; no constituyen un tope financiero. CPU gratuita puede suspenderse y presentar arranque lento. El límite económico del proveedor debe permanecer activo. El modelo puede abstenerse o fallar por disponibilidad/créditos: E5 debe seguir utilizable.

La selección de una actividad/riesgo de un expediente y el registro persistente de notas de apoyo vinculadas a una versión congelada son mejoras pendientes; esta integración no las da por implementadas. No existe aprobación automática ni modificación de expedientes enviados.

## Verificación local realizada

Lint y TypeScript sin errores. Compilación Next.js correcta. Suite existente de base de datos y 47 pruebas TypeScript aprobadas. Tres pruebas nuevas del adaptador Qwen aprobadas: evidencia y abstención, destinos seguros, credenciales/cuotas/fallos. Prueba smoke original de public_demo aprobada en entorno aislado; no realiza inferencia real ni valida disponibilidad de Qwen.


## Avance posterior: secretos y publicación

HF_TOKEN guardado por el usuario. DEMO_ACCESS_CODE generado para comunicación servidor a servidor, guardado como secreto en HF y GLF_QWEN_API_KEY en Vercel Preview; no registrar valores. Copia local ignorada: scratch/.env.qwen-service. GLF_QWEN_ENDPOINT configurado en Preview. Publicación 0.4.38 comprobada en https://glf-postulaciones.vercel.app/internal/evidence con cuenta administrativa y MFA existente, commit 68b018e.

/healthz devuelve HTTP 200: 7 documentos públicos, 271 fragmentos. /api/ask sin credencial devuelve 401. Con credencial alcanza al generador pero devolvió 503; diagnóstico seguro detectó HTTP 400/model_unavailable en la ruta :fastest. Se fijó HF_MODEL=Qwen/Qwen2.5-7B-Instruct-1M:featherless-ai según el código oficial de la página del modelo. El Space está reiniciándose; falta repetir una consulta cuando indique Running y verificar respuesta/citas mediante contrato TypeScript y portal. No declarar inferencia real validada todavía.

El wrapper runtime.py conserva código académico y solo registra estado HTTP/categoría, sin consultas ni respuestas crudas ni claves. Dos pruebas del wrapper pasan. Límite HF confirmado en cero, créditos USD 2, recarga automática sin configurar. No elevar gasto.

E5 aparece deshabilitado en el portal porque no existen fuentes aprobadas (o servicio disponible); no aprobar corpus automáticamente ni afirmar que E5 está listo. Falta proceso de revisión/aprobación normativa por GLF. No mezclar el corpus público de Qwen con la aprobación del corpus E5.
