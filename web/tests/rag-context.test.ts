import {test} from 'node:test';
import assert from 'node:assert/strict';
import {emptyPayload,newActivity,newRisk} from '../src/lib/domain';
import {projectRisks,riskQuery} from '../src/lib/rag-context';
test('RAG context preserves distinct activity risks and never includes project identity',()=>{
 const payload=emptyPayload();payload.concept.contact_name='PRIVATE_NAME';
 const a=newActivity();a.title='Coastal restoration';
 const r=newRisk();r.name='Habitat disturbance';r.probability=3;r.severity=4;a.risks=[r];payload.activities=[a];
 const [context]=projectRisks(payload,'es');assert.equal(context.score,12);assert.equal(context.level,'high');assert.equal(context.id,r.id);
 assert.equal(riskQuery(context,1,'qwen').includes('PGAS'),false);
 assert.match(riskQuery(context,2,'qwen'),/PGAS/);
 assert.equal(riskQuery(context,1,'e5').includes('PRIVATE_NAME'),false);
 context.description='x'.repeat(5000);
 assert.ok(riskQuery(context,1,'qwen').length<=600);assert.ok(riskQuery(context,1,'e5').length<=1500);
});
