"""Safe deployment diagnostics around the unchanged academic service."""
import logging
import json
import os
import io
import requests
from urllib.request import Request, urlopen
from urllib.error import HTTPError
from public_demo import app as upstream

original_chat = upstream._hf_chat
original_urlopen = upstream.urlopen

def provider_urlopen(request, *args, **kwargs):
    if isinstance(request, Request) and request.full_url == "https://router.huggingface.co/v1/chat/completions":
        request.add_header("User-Agent", "GLF-RAG/1.0 (HuggingFace-Inference-Client)")
        request.add_header("Accept", "application/json")
        try:
            response = requests.post(request.full_url, headers=dict(request.header_items()), data=request.data, timeout=kwargs.get("timeout", 45), allow_redirects=False)
        except requests.RequestException as error:
            from urllib.error import URLError
            raise URLError("Inference transport unavailable") from error
        if not response.ok:
            raise HTTPError(request.full_url, response.status_code, "Inference request failed", response.headers, io.BytesIO(response.content))
        return io.BytesIO(response.content)
    return original_urlopen(request, *args, **kwargs)

def credential_diagnostic():
    """Check identity metadata without recording the credential or account data."""
    token = os.getenv("HF_TOKEN", "").strip()
    try:
        request = Request("https://huggingface.co/api/whoami-v2", headers={"Authorization": f"Bearer {token}"})
        with urlopen(request, timeout=15) as response:
            metadata = json.load(response)
        access = metadata.get("auth", {}).get("accessToken", {})
        logging.getLogger("gunicorn.error").info(
            "GLF_TOKEN_CHECK valid=true expected_name=%s inference_scope=%s",
            access.get("displayName") == "GLF-Qwen",
            "inference" in json.dumps(access.get("fineGrained", {})).lower(),
        )
    except Exception as error:
        logging.getLogger("gunicorn.error").warning("GLF_TOKEN_CHECK valid=unknown status=%s", getattr(error, "code", None))

def diagnostic_chat(prompt):
    try:
        return original_chat(prompt)
    except RuntimeError as error:
        cause = error.__cause__
        category = "connection_or_response"
        status = getattr(cause, "code", None)
        if isinstance(cause, HTTPError):
            # Never log raw responses, credentials, questions or document text.
            body = cause.read(16000).decode("utf-8", errors="replace").lower()
            # Only fixed diagnostic labels; never emit any provider response text.
            markers = [word for word in ("permission", "authentication", "token", "balance", "payment", "subscription", "limit", "model", "forbidden", "disabled", "inference", "rate", "cloudflare", "html") if word in body]
            logging.getLogger("gunicorn.error").error("GLF_PROVIDER_MARKERS %s", ",".join(markers))
            if status == 402 or "credit" in body or "billing" in body or "spending" in body:
                category = "billing_or_credit_limit"
            elif "cloudflare" in body and "html" in body:
                category = "provider_http_filter"
            elif status in (401, 403):
                category = "token_or_permissions"
            elif "not supported" in body or "not available" in body or "model_not_found" in body:
                category = "model_unavailable"
            elif status == 429:
                category = "provider_rate_limit"
            else:
                category = "provider_rejected_request"
        logging.getLogger("gunicorn.error").error("GLF_PROVIDER_FAILURE status=%s category=%s", status, category)
        raise

upstream._hf_chat = diagnostic_chat
upstream.urlopen = provider_urlopen
credential_diagnostic()
app = upstream.app
