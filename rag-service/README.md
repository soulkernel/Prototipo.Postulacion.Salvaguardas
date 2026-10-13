---
title: GLF RAG BM25 Qwen
emoji: 🌊
colorFrom: blue
colorTo: green
sdk: docker
app_port: 7860
---

Servicio independiente BM25 + Qwen para el portal GLF.

Código conservado de la rama pública del proyecto académico; procedencia en UPSTREAM.json. No contiene el ZIP privado ni expedientes. Corpus público reconstruido desde las fuentes GLF definidas por el autor. No atribuir a esta variante las métricas locales.

Usar CPU Basic gratuito. Secretos: HF_TOKEN (Inference Providers), DEMO_ACCESS_CODE (solo servidor). Variables: HF_MODEL=Qwen/Qwen2.5-72B-Instruct:deepinfra, RATE_LIMIT_PER_HOUR=15, GLOBAL_DAILY_LIMIT=60. No activar recarga ni hardware pagado.

API: POST /api/ask, cabecera X-Demo-Key, JSON {"query":"pregunta"}. Salud: /healthz. El límite diario original se mantiene en memoria y puede reiniciarse. La protección de gasto depende del límite en Hugging Face, no de la cuota de consultas.

El portal usa GLF_QWEN_ENDPOINT (URL completa /api/ask) y GLF_QWEN_API_KEY (mismo DEMO_ACCESS_CODE), ambos solo en servidor.

## Conexión de inferencia vigente (13 de octubre de 2026)
La variable pública HF_MODEL del Space se cambió de Qwen/Qwen2.5-7B-Instruct-1M:featherless-ai a Qwen/Qwen2.5-72B-Instruct:deepinfra tras fallos intermitentes HTTP 503 de Featherless, incluso con reintento. El router HF solo ofrecía Featherless para la variante 7B-1M; DeepInfra ofrecía la variante Qwen 2.5 72B con estado live.

Se conserva sin modificaciones el código académico de recuperación BM25, validación de citas y abstención. El corpus público sigue siendo siete documentos / 271 fragmentos; no es el corpus privado de 585 fragmentos. La variante generativa desplegada es 72B, distinta de la 7B académica: no trasladar a esta conexión las métricas originales. E5 permanece independiente y sin cambios.

Límite mensual verificado en la cuenta HF: USD 5; no modificado. DeepInfra usa facturación HF, sin clave propia, y CPU Basic del Space sigue gratuito. Tarifa consultada en el router: USD 0,36 de entrada / 0,40 de salida por millón de tokens. Son tarifas de referencia, pueden cambiar. No se habilitó recarga automática.

Primera prueba del portal: pregunta sobre redes de deriva de más de 2,5 km; respuesta en 9,4 s con cita GLF_ANEXO_B_PUBLIC::P03C01, página 3, respaldada por el fragmento mostrado. La selección explícita de proveedor evita que fastest regrese al proveedor intermitente. Continúa activo el reintento acotado del adaptador; no se garantiza disponibilidad absoluta de servicios externos.


## Adaptador de revisión 1.1 (portal 0.6.4)
El recuperador, corpus público, prompt y validador originales en public_demo/app.py y src/retrieval_optimized.py permanecen intactos. runtime.py añade una guía de redacción al prompt: respuestas parciales explícitas, distinción de definiciones y obligaciones, condiciones y fase, abstención si nada se sustenta. No constituye validación automática de aplicabilidad jurídica ni modifica la decisión humana.
El adaptador devuelve hasta cinco pasajes también ante abstención; sources permanece vacío en ese caso. reason distingue insufficient_context de citation_validation_failed. Los fragmentos recuperados no se presentan como citas de una respuesta validada. review_support_version=1.1 permite comprobar el despliegue.
E5 continúa independiente y no envía sus fragmentos a Qwen. Su guía de lectura es determinista, con extracto literal y original expandible; no es un resumen generado. El botón de complemento prepara una consulta en E5 y requiere que el usuario la ejecute.
Cuotas, autenticación, proveedor y límite monetario no cambian. Las métricas académicas anteriores no validan este adaptador de redacción.
