import io
import unittest
from unittest.mock import patch
from urllib.error import HTTPError
import runtime


class DeploymentDiagnostics(unittest.TestCase):
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

if __name__ == '__main__':
    unittest.main()
