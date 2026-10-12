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

Usar CPU Basic gratuito. Secretos: HF_TOKEN (Inference Providers), DEMO_ACCESS_CODE (solo servidor). Variables: HF_MODEL=Qwen/Qwen2.5-7B-Instruct-1M:fastest, RATE_LIMIT_PER_HOUR=15, GLOBAL_DAILY_LIMIT=60. No activar recarga ni hardware pagado.

API: POST /api/ask, cabecera X-Demo-Key, JSON {"query":"pregunta"}. Salud: /healthz. El límite diario original se mantiene en memoria y puede reiniciarse. La protección de gasto depende del límite en Hugging Face, no de la cuota de consultas.

El portal usa GLF_QWEN_ENDPOINT (URL completa /api/ask) y GLF_QWEN_API_KEY (mismo DEMO_ACCESS_CODE), ambos solo en servidor.
