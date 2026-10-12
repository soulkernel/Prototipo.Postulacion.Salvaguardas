"""Safe deployment diagnostics around the unchanged academic service."""
import logging
from urllib.error import HTTPError
from public_demo import app as upstream

original_chat = upstream._hf_chat

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
            if status == 402 or "credit" in body or "billing" in body or "spending" in body:
                category = "billing_or_credit_limit"
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
app = upstream.app
