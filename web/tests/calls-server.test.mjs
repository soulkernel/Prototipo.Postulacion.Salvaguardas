import { test, before, after } from "node:test";
import assert from "node:assert/strict";
import { createRequire } from "node:module";
import { build } from "esbuild";
import { unlink } from "node:fs/promises";
import { resolve } from "node:path";
const root=resolve(import.meta.dirname,"..");
const out=resolve(root,"node_modules/.cache",`calls-${crypto.randomUUID()}.cjs`);
let action;
before(async()=>{
  const stubs={
    "@/lib/data": "export async function requireViewer(){return {db:globalThis.__CALL_QA.db}}",
    "@/lib/locale": "export async function getLocale(){return 'es'}",
    "@/lib/calls": "export function callIssues(){return []}",
    "next/cache": "export function revalidatePath(path){globalThis.__CALL_QA.invalidated.push(path)}",
    "next/navigation": "export function redirect(path){throw Object.assign(new Error('redirect'),{location:path})}",
  };
  await build({entryPoints:[resolve(root,"src/app/internal/calls/actions.ts")],outfile:out,bundle:true,platform:"node",format:"cjs",tsconfig:resolve(root,"tsconfig.json"),plugins:[{name:"calls-isolated",setup(b){
    b.onResolve({filter:/^(@\/lib\/(data|locale|calls)|next\/(cache|navigation))$/},a=>({path:a.path,namespace:"mock"}));
    b.onLoad({filter:/.*/,namespace:"mock"},a=>({contents:stubs[a.path],loader:"js"}));
  }}]});
  action=createRequire(import.meta.url)(out).saveOrPublishCall;
});
after(async()=>{delete globalThis.__CALL_QA;await unlink(out)});
function fixture(error=null){
  const id=crypto.randomUUID();const calls=[];
  globalThis.__CALL_QA={invalidated:[],db:{from(){return {select(){return this},eq(){return this},single:async()=>({data:{id,status:"draft"}})}},rpc:async(name,args)=>{calls.push({name,args});return {data:{id,status:"published"},error}}}};
  const form=new FormData();for(const[k,v]of Object.entries({id,revision:"3",operation:"publish",confirmed:"on"}))form.set(k,v);
  return {id,form,calls,state:{sequence:0}};
}
test("successful call publication redirects to its readable published page instead of stale edit/404",async()=>{
  const f=fixture();await assert.rejects(action(f.state,f.form),error=>error.location===`/internal/calls?view=${f.id}&published=1`);
  assert.deepEqual(f.calls,[{name:"publish_call_reviewed",args:{call_id:f.id,expected_revision:3}}]);
  assert.deepEqual(globalThis.__CALL_QA.invalidated,["/internal/calls","/applicant"]);
});
test("failed or unconfirmed publication stays in the editor without a success redirect",async()=>{
  const f=fixture({message:"GLF_REVISION_CONFLICT"});const result=await action(f.state,f.form);assert.match(result.error,/No se pudo publicar/);
  assert.equal(globalThis.__CALL_QA.invalidated.length,0);
  f.form.delete("confirmed");const unconfirmed=await action(f.state,f.form);assert.match(unconfirmed.error,/Confirme/);assert.equal(f.calls.length,1);
});
