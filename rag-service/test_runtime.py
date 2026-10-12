import io
import unittest
from unittest.mock import patch
from urllib.error import HTTPError
import runtime
from urllib.request import Request


class DeploymentDiagnostics(unittest.TestCase):
    def test_provider_headers_only_on_exact_router(self):
        request = Request('https://router.huggingface.co/v1/chat/completions', data=b'{}', headers={'Authorization':'Bearer PRIVATE'})
        with patch.object(runtime.requests, 'post') as transport:
            transport.return_value.ok = True
            transport.return_value.content = b'{}'
            transport.return_value.json.return_value = {}
            self.assertEqual(runtime.provider_urlopen(request, timeout=12).read(), b'{}')
            self.assertEqual(request.get_header('Authorization'), 'Bearer PRIVATE')
            self.assertEqual(request.get_header('Accept'), 'application/json')
            self.assertTrue(request.get_header('User-agent').startswith('GLF-RAG/'))
            self.assertGreater(transport.call_args.kwargs['timeout'], 11)
            self.assertLessEqual(transport.call_args.kwargs['timeout'], 12)
            self.assertFalse(transport.call_args.kwargs['allow_redirects'])
        other = Request('https://galapagoslifefund.org.ec/document.pdf')
        with patch.object(runtime, 'original_urlopen'):
            runtime.provider_urlopen(other)
            self.assertIsNone(other.get_header('User-agent'))

    def test_billing_failure_keeps_original_error_and_does_not_log_private_text(self):
        cause = HTTPError('https://router.huggingface.co/v1/chat/completions', 402, 'Payment', {}, io.BytesIO(b'credit limit; PRIVATE_VALUE'))
        failure = RuntimeError('Generator unavailable')
        failure.__cause__ = cause
        with patch.object(runtime, 'original_chat', side_effect=failure), patch.object(runtime.logging.getLogger('gunicorn.error'), 'error') as log:
            with self.assertRaises(RuntimeError) as raised:
                runtime.diagnostic_chat('PRIVATE_QUESTION')
            self.assertIs(raised.exception, failure)
            args = repr(log.call_args)
            self.assertIn('billing_or_credit_limit', args)
            self.assertNotIn('PRIVATE', args)

    def test_success_is_unchanged(self):
        with patch.object(runtime, 'original_chat', return_value='Original answer'):
            self.assertEqual(runtime.diagnostic_chat('question'), 'Original answer')

    def test_transient_failure_retried_once_but_auth_failure_never_retried(self):
        from unittest.mock import Mock
        request = Request('https://router.huggingface.co/v1/chat/completions', data=b'{}')
        bad = Mock(status_code=503, ok=False)
        good = Mock(status_code=200, ok=True, content=b'{}')
        good.json.return_value = {}
        with patch.object(runtime.requests, 'post', side_effect=[bad, good]) as post, patch.object(runtime.time, 'sleep'):
            self.assertEqual(runtime.provider_urlopen(request, timeout=35).read(), b'{}')
            self.assertEqual(post.call_count, 2)
        denied = Mock(status_code=401, ok=False, content=b'Unauthorized', headers={})
        with patch.object(runtime.requests, 'post', return_value=denied) as post:
            with self.assertRaises(HTTPError):
                runtime.provider_urlopen(request, timeout=35)
            self.assertEqual(post.call_count, 1)

    def test_cloudflare_rejection_is_not_mislabeled_as_token_failure(self):
        cause = HTTPError('https://router.huggingface.co/v1/chat/completions', 403, 'Forbidden', {}, io.BytesIO(b'<html>Cloudflare PRIVATE</html>'))
        failure = RuntimeError('Generator unavailable')
        failure.__cause__ = cause
        with patch.object(runtime, 'original_chat', side_effect=failure), patch.object(runtime.logging.getLogger('gunicorn.error'), 'error') as log:
            with self.assertRaises(RuntimeError):
                runtime.diagnostic_chat('PRIVATE_QUESTION')
            self.assertIn('provider_http_filter', repr(log.call_args_list))
            self.assertNotIn('PRIVATE', repr(log.call_args_list))

if __name__ == '__main__':
    unittest.main()
