import hmac
import io
import json
import os
import re
import threading
import time
from collections import defaultdict, deque
from datetime import datetime, timezone
from urllib.error import HTTPError, URLError
from urllib.request import Request, urlopen

from flask import Flask, Response, jsonify, redirect, request
from pypdf import PdfReader

from src.retrieval_optimized import OptimizedGLFRetriever


app = Flask(__name__)
app.config["MAX_CONTENT_LENGTH"] = 32 * 1024

MAX_QUERY_CHARS = 600
HF_TIMEOUT_SECONDS = 35
RATE_LIMIT_PER_HOUR = int(os.getenv("RATE_LIMIT_PER_HOUR", "15"))
GLOBAL_DAILY_LIMIT = int(os.getenv("GLOBAL_DAILY_LIMIT", "60"))
HF_MODEL = os.getenv("HF_MODEL", "Qwen/Qwen2.5-7B-Instruct-1M:fastest")

PUBLIC_DOCS = [
    {
        "document_id": "GLF_MANUAL_SGAS_PUBLIC",
        "name": "Manual SGAS",
        "url": "https://galapagoslifefund.org.ec/es/wp-content/uploads/sites/2/2026/04/A-GLF-Manual-SGAS-sin-Anexos-Oct-2024-final-.pdf",
    },
    {
        "document_id": "GLF_ANEXO_A_PUBLIC",
        "name": "Anexo A - Política Ambiental y Social",
        "url": "https://galapagoslifefund.org.ec/es/wp-content/uploads/sites/2/2025/02/ANEXO-A-Politica-Ambiental-y-Social_Web-Oct-2024.pdf",
    },
    {
        "document_id": "GLF_ANEXO_B_PUBLIC",
        "name": "Anexo B - Lista de Exclusión",
        "url": "https://galapagoslifefund.org.ec/es/wp-content/uploads/sites/2/2025/02/ANEXO-B-Lista-de-Exclusion_Web-Oct-2024.pdf",
    },
    {
        "document_id": "GLF_ANEXO_D_PUBLIC",
        "name": "Anexo D - Marco Legal y Estrategia de Autorización",
        "url": "https://galapagoslifefund.org.ec/es/wp-content/uploads/sites/2/2026/04/ANEXO-D-Marco-Legal-y-Estrategia-de-Autorizacion_Web-Oct-2024.pdf",
    },
    {
        "document_id": "GLF_ANEXO_F_PUBLIC",
        "name": "Anexo F - Cláusulas estándar",
        "url": "https://galapagoslifefund.org.ec/es/wp-content/uploads/sites/2/2025/02/ANEXO-F-Clausulas-Estandar_Web-Oct-2024.pdf",
    },
    {
        "document_id": "GLF_ANEXO_H_PUBLIC",
        "name": "Anexo H - Roles y Responsabilidades",
        "url": "https://galapagoslifefund.org.ec/es/wp-content/uploads/sites/2/2025/02/ANEXO-H-Roles-Responsabilidades_Web-Oct-2024.pdf",
    },
    {
        "document_id": "GLF_ANEXO_J_PUBLIC",
        "name": "Anexo J - Definiciones",
        "url": "https://galapagoslifefund.org.ec/es/wp-content/uploads/sites/2/2025/02/ANEXO-J-Definiciones_Web-Oct-2024.pdf",
    },
]

_records = None
_index = None
_init_error = None
_init_lock = threading.Lock()
_rate = defaultdict(deque)
_rate_lock = threading.Lock()
_daily_lock = threading.Lock()
_daily_day = None
_daily_count = 0

CHUNK_RE = re.compile(r"\[([A-Z0-9_]+::P\d{2}C\d{2})\]")


def _clean_text(text):
    text = (text or "").replace("\x00", " ")
    text = re.sub(r"[ \t]+", " ", text)
    text = re.sub(r"\n{3,}", "\n\n", text)
    return text.strip()


def _chunk_page(text, document_id, page_no, source_name, source_url):
    clean = _clean_text(text)
    if not clean:
        return []

    chunks = []
    target = 1200
    overlap = 180
    start = 0
    idx = 1
    while start < len(clean):
        end = min(len(clean), start + target)
        if end < len(clean):
            boundary = clean.rfind(" ", start + int(target * 0.65), end)
            if boundary > start:
                end = boundary
        piece = clean[start:end].strip()
        if piece:
            chunks.append(
                {
                    "chunk_id": f"{document_id}::P{page_no:02d}C{idx:02d}",
                    "document_id": document_id,
                    "text": piece,
                    "language": "es",
                    "source_name": source_name,
                    "source_url": source_url,
                    "page": page_no,
                }
            )
            idx += 1
        if end >= len(clean):
            break
        start = max(end - overlap, start + 1)
    return chunks


def _download_pdf(url):
    req = Request(
        url,
        headers={
            "User-Agent": "GLF-Academic-Demo/1.0 (+public sources only)",
            "Accept": "application/pdf",
        },
    )
    with urlopen(req, timeout=20) as response:
        data = response.read(20 * 1024 * 1024)
    if not data.startswith(b"%PDF"):
        raise ValueError("La fuente pública no devolvió un PDF válido.")
    return data


def _build_public_corpus():
    rows = []
    for doc in PUBLIC_DOCS:
        pdf = _download_pdf(doc["url"])
        reader = PdfReader(io.BytesIO(pdf))
        for page_no, page in enumerate(reader.pages, start=1):
            rows.extend(
                _chunk_page(
                    page.extract_text() or "",
                    doc["document_id"],
                    page_no,
                    doc["name"],
                    doc["url"],
                )
            )
    if len(rows) < 30:
        raise RuntimeError("No se pudo construir un corpus público suficiente.")
    return rows


def _ensure_index():
    global _records, _index, _init_error
    if _index is not None:
        return
    with _init_lock:
        if _index is not None:
            return
        try:
            rows = _build_public_corpus()
            _records = rows
            _index = OptimizedGLFRetriever(rows)
            _init_error = None
        except Exception as exc:
            _init_error = str(exc)
            raise


def _client_ip():
    forwarded = request.headers.get("X-Forwarded-For", "")
    if forwarded:
        return forwarded.split(",")[0].strip()
    return request.remote_addr or "unknown"


def _rate_limited():
    now = time.time()
    cutoff = now - 3600
    key = _client_ip()
    with _rate_lock:
        bucket = _rate[key]
        while bucket and bucket[0] < cutoff:
            bucket.popleft()
        if len(bucket) >= RATE_LIMIT_PER_HOUR:
            return True
        bucket.append(now)
    return False


def _authorized():
    expected = os.getenv("DEMO_ACCESS_CODE", "").strip()
    if not expected:
        return False
    supplied = request.headers.get("X-Demo-Key", "").strip()
    return bool(supplied) and hmac.compare_digest(supplied, expected)


def _take_global_daily_slot():
    """Reserva una consulta generativa dentro del tope global UTC."""
    global _daily_day, _daily_count
    today = datetime.now(timezone.utc).date().isoformat()
    with _daily_lock:
        if _daily_day != today:
            _daily_day = today
            _daily_count = 0
        if _daily_count >= GLOBAL_DAILY_LIMIT:
            return False, 0
        _daily_count += 1
        return True, max(0, GLOBAL_DAILY_LIMIT - _daily_count)


def _safe_query():
    payload = request.get_json(silent=True) or {}
    query = str(payload.get("query", "")).strip()
    if not query:
        return None, ("Escribe una pregunta.", 400)
    if len(query) > MAX_QUERY_CHARS:
        return None, (f"La pregunta supera {MAX_QUERY_CHARS} caracteres.", 400)
    if any(ord(c) < 9 for c in query):
        return None, ("La pregunta contiene caracteres no permitidos.", 400)
    return query, None


def _hf_chat(prompt):
    token = os.getenv("HF_TOKEN", "").strip()
    if not token:
        raise RuntimeError("La demo pública no tiene configurado HF_TOKEN.")

    body = json.dumps(
        {
            "model": HF_MODEL,
            "messages": [
                {
                    "role": "system",
                    "content": (
                        "Eres un asistente documental del Galápagos Life Fund. "
                        "Responde solo con la evidencia suministrada. No inventes requisitos."
                    ),
                },
                {"role": "user", "content": prompt},
            ],
            "temperature": 0,
            "max_tokens": 320,
            "stream": False,
        }
    ).encode("utf-8")

    req = Request(
        "https://router.huggingface.co/v1/chat/completions",
        data=body,
        method="POST",
        headers={
            "Authorization": f"Bearer {token}",
            "Content-Type": "application/json",
        },
    )
    try:
        with urlopen(req, timeout=HF_TIMEOUT_SECONDS) as response:
            data = json.load(response)
        return data["choices"][0]["message"]["content"].strip()
    except (HTTPError, URLError, TimeoutError, OSError, ValueError, KeyError) as exc:
        raise RuntimeError("El generador público no está disponible en este momento.") from exc


def _generate_answer(query, rows):
    context_blocks = []
    allowed = set()
    by_id = {}
    for row in rows[:4]:
        chunk_id = row["chunk_id"]
        allowed.add(chunk_id)
        by_id[chunk_id] = row
        context_blocks.append(
            f"CHUNK_ID: {chunk_id}\n"
            f"FUENTE: {row['source_name']} · página {row['page']}\n"
            f"TEXTO:\n{row['text'][:1500]}"
        )

    prompt = (
        "CONTEXTO DOCUMENTAL PÚBLICO DEL GLF:\n\n"
        + "\n\n".join(context_blocks)
        + f"\n\nPREGUNTA: {query}\n\n"
        + "Responde en español, de forma breve y concreta, usando exclusivamente el contexto. "
          "Cada afirmación debe terminar con uno de los CHUNK_ID exactos entre corchetes. "
          "Nunca cites un identificador que no aparezca en el contexto. "
          "Si el contexto no permite responder con seguridad, responde exactamente: "
          "'La documentación pública recuperada es insuficiente para responder esta pregunta.'"
    )

    answer = _hf_chat(prompt)
    if "documentación pública recuperada es insuficiente" in answer.casefold():
        return "La documentación pública recuperada es insuficiente para responder esta pregunta.", []

    cited = set(CHUNK_RE.findall(answer))
    if not cited or cited - allowed:
        return "La documentación pública recuperada es insuficiente para responder esta pregunta.", []

    sources = [
        {
            "document_id": by_id[cid]["document_id"],
            "chunk_id": cid,
            "source_name": by_id[cid]["source_name"],
            "source_url": by_id[cid]["source_url"],
            "page": by_id[cid]["page"],
        }
        for cid in sorted(cited)
    ]
    return answer, sources


@app.after_request
def _security_headers(response):
    response.headers["X-Content-Type-Options"] = "nosniff"
    response.headers["X-Frame-Options"] = "DENY"
    response.headers["Referrer-Policy"] = "no-referrer"
    response.headers["Permissions-Policy"] = "camera=(), microphone=(), geolocation=()"
    response.headers["Cache-Control"] = "no-store"
    response.headers["Content-Security-Policy"] = (
        "default-src 'self'; "
        "style-src 'self' 'unsafe-inline'; "
        "script-src 'self' 'unsafe-inline'; "
        "img-src 'self' data:; "
        "connect-src 'self'; "
        "frame-ancestors 'none'; "
        "base-uri 'none'; form-action 'self'"
    )
    return response


@app.get("/")
def home():
    return redirect("https://glf-postulaciones.vercel.app/internal/evidence", code=302)


@app.get("/robots.txt")
def robots():
    return Response("User-agent: *\nDisallow: /\n", mimetype="text/plain")


@app.get("/healthz")
def healthz():
    try:
        _ensure_index()
    except Exception:
        return jsonify({"ok": False, "public_demo": True}), 503
    return jsonify(
        {
            "ok": True,
            "public_demo": True,
            "documents": len(PUBLIC_DOCS),
            "chunks": len(_records or []),
            "retriever": "BM25-heading-authority-v2",
        }
    )


@app.post("/api/search")
def api_search():
    if _rate_limited():
        return jsonify({"error": "Límite temporal de consultas alcanzado."}), 429
    if not _authorized():
        return jsonify({"error": "Código de acceso inválido."}), 401
    query, error = _safe_query()
    if error:
        message, status = error
        return jsonify({"error": message}), status
    try:
        _ensure_index()
        rows = _index.search(query, limit=5)
    except Exception:
        return jsonify({"error": "No se pudo cargar el corpus público del GLF."}), 503

    return jsonify(
        {
            "results": [
                {
                    "chunk_id": row["chunk_id"],
                    "document_id": row["document_id"],
                    "source_name": row.get("source_name"),
                    "source_url": row.get("source_url"),
                    "page": row.get("page"),
                    "text": row["text"],
                    "score": row.get("score", 0),
                }
                for row in rows
            ]
        }
    )


@app.post("/api/ask")
def api_ask():
    if _rate_limited():
        return jsonify({"error": "Límite temporal de consultas alcanzado."}), 429
    if not _authorized():
        return jsonify({"error": "Código de acceso inválido."}), 401

    query, error = _safe_query()
    if error:
        message, status = error
        return jsonify({"error": message}), status

    slot_ok, quota_remaining = _take_global_daily_slot()
    if not slot_ok:
        return jsonify({
            "error": "La demo alcanzó su límite global de consultas de hoy. Inténtalo mañana."
        }), 429

    started = time.perf_counter()
    try:
        _ensure_index()
        r0 = time.perf_counter()
        rows = _index.search(query, limit=5)
        retrieval_seconds = time.perf_counter() - r0

        g0 = time.perf_counter()
        answer, sources = _generate_answer(query, rows)
        generation_seconds = time.perf_counter() - g0
    except Exception as exc:
        return jsonify(
            {
                "error": "La demo pública no está disponible temporalmente.",
                "detail": type(exc).__name__,
            }
        ), 503

    insufficient = not sources
    return jsonify(
        {
            "generated": not insufficient,
            "answer": answer,
            "sources": sources,
            "results": [
                {
                    "chunk_id": row["chunk_id"],
                    "document_id": row["document_id"],
                    "source_name": row.get("source_name"),
                    "source_url": row.get("source_url"),
                    "page": row.get("page"),
                    "text": row["text"],
                    "score": row.get("score", 0),
                }
                for row in rows
                if not insufficient
            ],
            "timings": {
                "retrieval_seconds": retrieval_seconds,
                "generation_seconds": generation_seconds,
                "total_seconds": time.perf_counter() - started,
            },
            "public_demo": True,
            "quota_remaining_today": quota_remaining,
        }
    )


if __name__ == "__main__":
    port = int(os.getenv("PORT", "10000"))
    app.run(host="0.0.0.0", port=port)
