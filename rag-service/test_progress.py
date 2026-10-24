import json
import unittest
from unittest.mock import patch
import runtime
from public_demo.smoke_test import reset_state, ROW

class ProgressTests(unittest.TestCase):
    def setUp(self):
        reset_state()

    def test_stream_keeps_authentication_and_never_emits_private_text(self):
        response = runtime.app.test_client().post('/api/ask-stream',json={'query':'PRIVATE QUERY'})
        self.assertEqual(response.status_code,401)
        self.assertNotIn('PRIVATE',response.get_data(as_text=True))

    def test_stream_emits_actual_model_and_validated_result(self):
        def generate(query, rows):
            runtime.progress('generation', 'Qwen/actual-model')
            runtime.progress('verification', 'References')
            return 'Evidence ['+ROW['chunk_id']+']', [{k:ROW[k] for k in ('document_id','chunk_id','source_name','source_url','page')}]
        with patch.object(runtime.upstream,'_generate_answer',side_effect=generate):
            response=runtime.app.test_client().post('/api/ask-stream',json={'query':'riesgo biodiversidad'},headers={'X-Demo-Key':'smoke-secret'})
            events=[json.loads(line) for line in response.get_data(as_text=True).splitlines()]
        self.assertEqual(events[-1]['type'],'result')
        self.assertEqual([e['stage'] for e in events if e['type']=='stage'],['retrieval','generation','verification'])
        self.assertEqual(events[1]['model'],'Qwen/actual-model')
        self.assertTrue(events[-1]['result']['generated'])
        self.assertEqual(events[-1]['result']['review_support_version'],'1.7')

    def test_invalid_query_does_not_generate_and_quota_remains_enforced(self):
        for query in [None,3,{},[], '  ', 'x'*601]:
            with patch.object(runtime.upstream,'_generate_answer') as generate:
                response=runtime.app.test_client().post('/api/ask',json={'query':query},headers={'X-Demo-Key':'smoke-secret'})
                self.assertEqual(response.status_code,400)
                generate.assert_not_called()
        with patch.object(runtime.upstream,'_take_global_daily_slot',return_value=(False,0)):
            response=runtime.app.test_client().post('/api/ask-stream',json={'query':'riesgo biodiversidad'},headers={'X-Demo-Key':'smoke-secret'})
            events=[json.loads(line) for line in response.get_data(as_text=True).splitlines()]
            self.assertEqual(events[-1],{'type':'error','code':'quota'})

if __name__ == '__main__': unittest.main()
