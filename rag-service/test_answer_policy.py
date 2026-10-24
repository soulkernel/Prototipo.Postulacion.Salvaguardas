"""Policy and request tests: all provider responses are synthetic; no paid inference."""
import json
import os
import unittest
from unittest.mock import Mock, patch
import runtime
from answer_policy import prepare_context, make_prompt, validate_answer, corpus_digest
from public_demo.smoke_test import ROW, reset_state

class AnswerPolicyTests(unittest.TestCase):
    def setUp(self):
        reset_state()
        runtime.upstream._generate_answer = runtime.grounded_answer

    def provider(self, answer=None, finish="stop", usage=True):
        payload = {"choices": [{"finish_reason": finish, "message": {"content": answer or "Criterio [" + ROW["chunk_id"] + "]"}}]}
        if usage: payload["usage"] = {"prompt_tokens": 300, "completion_tokens": 70}
        response = Mock(status_code=200, ok=True, content=json.dumps(payload).encode())
        response.json.return_value = payload
        return response

    def ask(self, mode="brief", provider=None, stream=False):
        with patch.dict(os.environ, {"HF_TOKEN":"synthetic-token"}), patch.object(runtime.requests, "post", return_value=provider or self.provider()) as post:
            response = runtime.app.test_client().post("/api/ask" + ("-stream" if stream else ""), json={"query":"riesgos ambientales", "answer_mode":mode}, headers={"X-Demo-Key":"smoke-secret"})
            data = response.get_json() if not stream else [json.loads(x) for x in response.get_data(as_text=True).splitlines()][-1]["result"]
            return response, data, post.call_args_list

    def test_modes_reach_provider_with_real_usage_and_context(self):
        for mode, limit in [("brief",700),("expanded",1500)]:
            self.setUp()
            response, data, calls = self.ask(mode)
            self.assertEqual(response.status_code,200)
            self.assertTrue(data["generated"])
            self.assertEqual(json.loads(calls[0].kwargs["data"])["max_tokens"],limit)
            self.assertEqual(data["answer_mode"],mode)
            self.assertEqual(data["diagnostics"]["input_tokens"],300)
            self.assertTrue(data["diagnostics"]["usage_complete"])
            self.assertEqual(data["diagnostics"]["context_ids"],[ROW["chunk_id"]])
            self.assertEqual(len(data["diagnostics"]["corpus_sha256"]),64)

    def test_truncation_and_filter_never_publish_partial_answer_or_retry(self):
        for finish, reason in [("length","response_truncated"),("content_filter","generation_incomplete")]:
            self.setUp()
            _, data, calls = self.ask(provider=self.provider(finish=finish))
            self.assertFalse(data["generated"])
            self.assertEqual(data["sources"],[])
            self.assertEqual(data["reason"],reason)
            self.assertEqual(len(calls),1)
            self.assertTrue(data["results"])

    def test_missing_usage_is_unknown_not_zero(self):
        _, data, _ = self.ask(provider=self.provider(usage=False))
        self.assertIsNone(data["diagnostics"]["input_tokens"])
        self.assertFalse(data["diagnostics"]["usage_complete"])

    def test_combined_transport_and_citation_retry_never_exceed_two_calls(self):
        bad=Mock(status_code=503,ok=False)
        no_cites=self.provider(answer="Respuesta sin cita")
        with patch.dict(os.environ,{"HF_TOKEN":"synthetic-token"}), patch.object(runtime.requests,"post",side_effect=[bad,no_cites]) as post, patch.object(runtime.time,"sleep"):
            data=runtime.app.test_client().post("/api/ask",json={"query":"riesgos ambientales"},headers={"X-Demo-Key":"smoke-secret"}).get_json()
        self.assertEqual(post.call_count,2)
        self.assertFalse(data["generated"])
        self.assertFalse(data["diagnostics"]["usage_complete"])
        self.assertEqual(data["diagnostics"]["provider_attempts"],2)

    def test_invalid_modes_do_not_consume_quota(self):
        for mode in [False, {}, None, "unbounded"]:
            response=runtime.app.test_client().post("/api/ask",json={"query":"riesgos", "answer_mode":mode},headers={"X-Demo-Key":"smoke-secret"})
            self.assertEqual(response.status_code,400)
        self.assertEqual(runtime.upstream._daily_count,0)

    def test_stream_emits_context_and_same_policy(self):
        response,data,_=self.ask("expanded",stream=True)
        self.assertEqual(data["answer_mode"],"expanded")
        self.assertTrue(data["generated"])
        events=[json.loads(x) for x in response.get_data(as_text=True).splitlines()]
        self.assertIn("context",[e.get("stage") for e in events])

    def test_legacy_stream_preserves_known_stages(self):
        with patch.dict(os.environ,{"HF_TOKEN":"synthetic-token"}), patch.object(runtime.requests,"post",return_value=self.provider()):
            response=runtime.app.test_client().post("/api/ask-stream",json={"query":"riesgos ambientales"},headers={"X-Demo-Key":"smoke-secret"})
            events=[json.loads(x) for x in response.get_data(as_text=True).splitlines()]
        self.assertNotIn("context",[e.get("stage") for e in events])
        self.assertTrue(events[-1]["result"]["generated"])

    def test_full_passages_fifth_source_dedup_and_budget(self):
        rows=[dict(ROW,chunk_id=f"GLF::P01C{i:02}",text=f"Regla {i}. "+"x"*1700) for i in range(1,6)]
        selected,size=prepare_context(rows+rows)
        self.assertEqual(len(selected),5)
        self.assertIn(rows[-1]["text"],make_prompt("consulta",selected))
        self.assertLessEqual(size,12000)
        self.assertEqual(prepare_context([dict(ROW,text="x"*20000)])[0],[])
        self.assertEqual(len(prepare_context([ROW,dict(ROW,chunk_id="OTHER::P01C01")])[0]),1)

    def test_question_cannot_add_allowed_citations_and_hash_ignores_scores(self):
        formatted, sources, reason = validate_answer("**Respuesta**\nDato ["+ROW["chunk_id"]+"]", [ROW])
        self.assertEqual(formatted, "Respuesta\nDato ["+ROW["chunk_id"]+"]")
        self.assertEqual(reason, "answered")
        self.assertEqual(sources[0]["chunk_id"], ROW["chunk_id"])
        self.assertEqual(validate_answer("Afirmación [FAKE::P01C01]",[ROW])[2],"citation_validation_failed")
        self.assertEqual(corpus_digest([ROW]),corpus_digest([dict(ROW,score=123)]))
        self.assertNotEqual(corpus_digest([ROW]),corpus_digest([dict(ROW,text="otra regla")]))

    def test_authority_offset_alone_is_not_documentary_evidence(self):
        base=Mock();base.search.return_value=[dict(ROW,score=.15)]
        with runtime.app.test_request_context():
            self.assertEqual(runtime.FocusedReviewIndex(base).search("zzzzzz"),[])

if __name__=="__main__": unittest.main()
