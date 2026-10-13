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
        with runtime.app.test_request_context(), patch.object(runtime, 'original_chat', side_effect=failure), patch.object(runtime.logging.getLogger('gunicorn.error'), 'error') as log:
            with self.assertRaises(RuntimeError) as raised:
                runtime.diagnostic_chat('PRIVATE_QUESTION')
            self.assertIs(raised.exception, failure)
            args = repr(log.call_args)
            self.assertIn('billing_or_credit_limit', args)
            self.assertNotIn('PRIVATE', args)

    def test_success_is_unchanged(self):
        with runtime.app.test_request_context(), patch.object(runtime, 'original_chat', return_value='Original answer'):
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
        with runtime.app.test_request_context(), patch.object(runtime, 'original_chat', side_effect=failure), patch.object(runtime.logging.getLogger('gunicorn.error'), 'error') as log:
            with self.assertRaises(RuntimeError):
                runtime.diagnostic_chat('PRIVATE_QUESTION')
            self.assertIn('provider_http_filter', repr(log.call_args_list))
            self.assertNotIn('PRIVATE', repr(log.call_args_list))


    def test_abstention_keeps_passages_without_presenting_them_as_answer_citations(self):
        from public_demo.smoke_test import reset_state, ROW
        reset_state()
        with patch.object(runtime.upstream, '_generate_answer', return_value=('Insuficiente', [])):
            response = runtime.app.test_client().post('/api/ask', json={'query': 'riesgo biodiversidad'}, headers={'X-Demo-Key': 'smoke-secret'})
        self.assertEqual(response.status_code, 200)
        data = response.get_json()
        self.assertFalse(data['generated'])
        self.assertEqual(data['sources'], [])
        self.assertEqual(data['results'][0]['chunk_id'], ROW['chunk_id'])
        self.assertEqual(data['reason'], 'insufficient_context')

    def test_citation_failure_is_distinct_and_unknown_ids_never_accepted(self):
        prompt = 'CHUNK_ID: GLF_PUBLIC::P01C01'
        with runtime.app.test_request_context(), patch.object(runtime, 'original_chat', return_value='Afirmación [OTHER::P01C01]'):
            runtime.diagnostic_chat(prompt)
            self.assertEqual(runtime.g.glf_answer_reason, 'citation_validation_failed')
        with runtime.app.test_request_context(), patch.object(runtime, 'original_chat', return_value='Criterio general [GLF_PUBLIC::P01C01]') as model:
            runtime.diagnostic_chat(prompt)
            self.assertEqual(runtime.g.glf_answer_reason, 'answered')
            self.assertIn('Una definición de EIAS no demuestra', model.call_args.args[0])


    def test_missing_citation_retries_once_and_still_requires_original_validator(self):
        with runtime.app.test_request_context(), patch.object(runtime, 'original_chat', side_effect=['Criterio sin cita', 'Criterio [GLF_PUBLIC::P01C01]']) as model:
            answer = runtime.diagnostic_chat('CHUNK_ID: GLF_PUBLIC::P01C01')
            self.assertEqual(model.call_count, 2)
            self.assertIn('[GLF_PUBLIC::P01C01]', answer)
            self.assertEqual(runtime.g.glf_answer_reason, 'answered')
        with runtime.app.test_request_context(), patch.object(runtime, 'original_chat', return_value='La documentación pública recuperada es insuficiente para responder esta pregunta.') as model:
            runtime.diagnostic_chat('CHUNK_ID: GLF_PUBLIC::P01C01')
            self.assertEqual(model.call_count, 1)
            self.assertEqual(runtime.g.glf_answer_reason, 'insufficient_context')


    def test_focused_search_is_request_scoped_and_original_question_reaches_generation(self):
        from public_demo.smoke_test import reset_state, ROW
        reset_state()
        class RecordingIndex:
            def __init__(self): self.queries=[]
            def search(self, query, limit=5): self.queries.append(query);return [ROW]
        index=RecordingIndex()
        runtime.upstream._index=index
        with patch.object(runtime.upstream,'_generate_answer',return_value=('Insuficiente',[])) as generate:
            client=runtime.app.test_client()
            response=client.post('/api/ask',json={'query':'Pregunta completa para la nota conceptual','retrieval_query':'manglar biodiversidad'},headers={'X-Demo-Key':'smoke-secret'})
            self.assertEqual(response.status_code,200)
            self.assertTrue(all(q=='manglar biodiversidad' for q in index.queries))
            self.assertEqual(generate.call_args.args[0],'Pregunta completa para la nota conceptual')
            self.assertEqual(response.get_json()['retrieval_query'],'manglar biodiversidad')
            client.post('/api/ask',json={'query':'Otra pregunta libre'},headers={'X-Demo-Key':'smoke-secret'})
            self.assertEqual(index.queries[-1],'Otra pregunta libre')
        self.assertIs(runtime.upstream._index.base,index)

    def test_invalid_focus_never_calls_model_and_does_not_bypass_auth(self):
        from public_demo.smoke_test import reset_state
        reset_state()
        client=runtime.app.test_client()
        with patch.object(runtime.upstream,'_generate_answer') as model:
            response=client.post('/api/ask',json={'query':'Consulta','retrieval_query':['invalid']},headers={'X-Demo-Key':'smoke-secret'})
            self.assertEqual(response.status_code,400)
            self.assertEqual(client.post('/api/ask',json={'query':'Consulta','retrieval_query':['invalid']}).status_code,401)
            model.assert_not_called()


    def test_normative_context_prioritizes_provisions_over_definitions_without_changing_base_scores(self):
        rows=[{'source_name':'Anexo J - Definiciones','score':1}, {'source_name':'Anexo D - Marco legal','score':.9}, {'source_name':'Anexo J - Definiciones','score':.8}, {'source_name':'Lista de Exclusión','score':.7}, {'source_name':'Política Ambiental','score':.6}]
        class Base:
            def search(self, query, limit=5): return list(rows)
        adapter=runtime.FocusedReviewIndex(Base())
        with runtime.app.test_request_context():
            runtime.g.glf_retrieval_query='manglar biodiversidad'
            selected=adapter.search('¿Qué disposiciones normativas orientan este riesgo?')
            self.assertEqual([x['source_name'] for x in selected[:3]],['Anexo D - Marco legal','Lista de Exclusión','Política Ambiental'])
            self.assertEqual(sorted(x['score'] for x in selected),sorted(x['score'] for x in rows))
            self.assertEqual(adapter.search('¿Qué es un hábitat?'),rows)
        self.assertEqual(adapter.search('¿Qué disposiciones normativas?'),rows)

if __name__ == '__main__':
    unittest.main()
