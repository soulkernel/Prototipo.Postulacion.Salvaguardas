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

Adaptador 1.2: si el proveedor redacta sin citas exactas, un único intento de regeneración exige el formato válido; nunca agrega citas automáticamente. La abstención explícita no se reintenta. Ambas generaciones comparten un presupuesto de 43 segundos. El validador original decide sobre la salida final; cuotas y límite USD 5 permanecen iguales.

Adaptador 1.3: parámetro opcional retrieval_query (3–600 caracteres) para buscar por riesgo y actividad. La pregunta original se conserva para la generación. El adaptador por petición delega al mismo recuperador BM25 sin cambiar corpus, pesos ni validador. Las consultas libres sin parámetro mantienen su comportamiento anterior. El texto de búsqueda utilizado vuelve en la respuesta y queda trazable en el portal. Las expansiones temáticas solo son términos de búsqueda, no determinaciones normativas.

Adaptador 1.4: para consultas normativas con búsqueda específica, compone el contexto poniendo las disposiciones antes de los documentos titulados Definiciones. Evita que la ventana original de cuatro fragmentos excluya una disposición pertinente por ocupar el quinto lugar. No cambia el algoritmo/puntuaciones BM25 ni el validador de citas; preguntas de definiciones y clientes sin búsqueda separada conservan el orden original. La actividad permanece en la pregunta de interpretación; la búsqueda automática prioriza la descripción del riesgo y usa actividad solo si no hay descripción.

Adaptador 1.5: compone los cuatro pasajes para generación con tres referencias centradas en el riesgo y una referencia procedimental del Manual SGAS recuperada con la pregunta completa, cuando está disponible y es distinta. Evita perder el contexto de la fase al priorizar biodiversidad. Segunda búsqueda BM25 local, sin una segunda consulta de inferencia ni aumento de cuota; IDs sin duplicados y validador original intacto.


## Política de respuesta 1.7 (portal 0.7.62)

`answer_policy.py` sustituye la composición del prompt en el adaptador, conservando `public_demo/app.py` como procedencia histórica. `answer_mode` admite `brief` (por defecto; 700 tokens de salida y orientación de 200 palabras) o `expanded` (1500 tokens y 450 palabras). Ambos preservan hasta cinco pasajes completos y sin duplicados, con presupuestos de 12000/18000 caracteres; son límites de caracteres del contexto, no recuentos exactos de tokens. Los fragmentos originales del corpus no se resegmentan ni cambian sus identificadores. Se omite un pasaje que no cabe; no se recorta una condición adicionalmente.

La búsqueda conserva BM25-heading-authority-v2. Se descartan resultados cuyo único puntaje es el desplazamiento de autoridad GLF (0.15), pues no prueban coincidencia léxica. E5 y la fusión híbrida permanecen fuera de la generación en producción hasta una comparación independiente sobre corpus común.

La salida incluye `answer_mode`, huella SHA-256 del contenido y procedencia del corpus, IDs efectivamente enviados, política, tiempos, intentos y tokens reportados. `usage_complete=false` identifica consumo parcial/no informado; nunca se representa como consumo cero. La huella canónica del servicio es distinta del hash de bytes del JSONL académico: registrar ambos al cotejar una exportación. No se almacenan preguntas, respuestas ni credenciales en los logs de diagnóstico.

Como máximo dos intentos al proveedor en total, contando errores transitorios y una posible corrección de citas; comparten 50 segundos. Las cuotas anteriores siguen vigentes. Si el proveedor finaliza por longitud, se retira la respuesta con `response_truncated`; otros finales incompletos se marcan `generation_incomplete`. No se repite automáticamente una salida truncada. Las referencias desconocidas y las abstenciones no se presentan como respuestas fundamentadas. Validar una referencia no verifica la verdad de cada afirmación: continúa la revisión humana.

La actualización no cambia GPU, hardware, recarga automática, límite monetario ni esquemas de Supabase. La cuota en memoria se reinicia con el servicio: el límite financiero configurado en HF sigue siendo necesario. La comparación de calidad final espera las anotaciones independientes, no se deduce de las pruebas unitarias.

Pruebas sin conexión: `python -m unittest discover -p 'test_*.py' -q` y `python -m public_demo.smoke_test`.
