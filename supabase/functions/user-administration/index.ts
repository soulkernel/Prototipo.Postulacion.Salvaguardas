import { createClient } from "npm:@supabase/supabase-js@2.117.2";
const reply = (status: number, body: object) => new Response(JSON.stringify(body), {status,headers:{"Content-Type":"application/json","Cache-Control":"no-store"}});
Deno.serve(async (request: Request) => {
 if(request.method!=="POST") return reply(405,{ok:false,error:"GLF_INVALID_OPERATION"});
 const authorization=request.headers.get("Authorization");
 const url=Deno.env.get("SUPABASE_URL"), key=Deno.env.get("SUPABASE_ANON_KEY"), secret=Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
 if(!url||!key||!secret||!authorization?.startsWith("Bearer ")) return reply(401,{ok:false,error:"GLF_FORBIDDEN"});
 const caller=createClient(url,key,{global:{headers:{Authorization:authorization}},auth:{persistSession:false,autoRefreshToken:false}});
 const {data:{user},error}=await caller.auth.getUser();
 const {data:claims}=await caller.auth.getClaims(authorization.slice(7));
 const {data:valid}=await caller.rpc("access_session_valid");
 const {data:profile}=user?await caller.from("profiles").select("role,active,access_kind").eq("id",user.id).maybeSingle():{data:null};
 if(error||!user||!valid||claims?.claims.aal!=="aal2"||!profile?.active||profile.role!=="administrator"||profile.access_kind!=="standard") return reply(403,{ok:false,error:"GLF_FORBIDDEN"});
 let body;
 try { const raw=await request.text(); if(raw.length>4096) throw Error(); body=JSON.parse(raw); } catch {return reply(400,{ok:false,error:"GLF_INVALID_OPERATION"});}
 const admin=createClient(url,secret,{auth:{persistSession:false,autoRefreshToken:false}});
 if(body.operation==="status") return reply(200,{ok:true});
 if(body.operation==="create_academic") {
  const email=typeof body.email==="string"?body.email.trim().toLowerCase():"";
  const fullName=typeof body.full_name==="string"?body.full_name.trim():"";
  if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)||email.length>254||fullName.length<2||fullName.length>200||body.confirmed!==true) return reply(400,{ok:false,error:"GLF_INVALID_INVITATION"});
  // Never log or persist the generated password; return once to the administrator.
  const password="GLF!"+Array.from(crypto.getRandomValues(new Uint8Array(24)),b=>b.toString(16).padStart(2,"0")).join("");
  const {data:created,error:createError}=await admin.auth.admin.createUser({email,password,email_confirm:true,user_metadata:{full_name:fullName,glf_academic_provision:"true"}});
  if(createError||!created.user) return reply(409,{ok:false,error:["email_exists","user_already_exists"].includes(createError?.code||"")?"GLF_EMAIL_EXISTS":"GLF_ACCOUNT_CREATE_FAILED"});
  const {data:expires,error:finishError}=await admin.rpc("finish_academic_account",{target_user:created.user.id,actor:user.id});
  if(finishError) {
   await admin.from("profiles").update({active:false,archived_at:new Date().toISOString()}).eq("id",created.user.id);
   return reply(503,{ok:false,error:"GLF_ACCOUNT_CREATE_FAILED"});
  }
  return reply(200,{ok:true,email,password,expires_at:expires});
 }
 if(body.operation==="delete") {
  if(typeof body.id!=="string"||!/^[0-9a-f-]{36}$/i.test(body.id)||!Number.isInteger(body.revision)||body.confirmed!==true||typeof body.reason!=="string"||body.reason.length>500) return reply(400,{ok:false,error:"GLF_INVALID_OPERATION"});
  const {error:prepareError}=await caller.rpc("prepare_account_deletion",{target_user:body.id,expected_revision:body.revision,reason:body.reason});
  if(prepareError) return reply(409,{ok:false,error:prepareError.message.match(/GLF_[A-Z_]+/)?.[0]||"GLF_ACCOUNT_DELETE_FORBIDDEN"});
  const {error:deleteError}=await admin.auth.admin.deleteUser(body.id);
  if(deleteError) return reply(409,{ok:false,error:"GLF_ACCOUNT_DELETE_FAILED"});
  return reply(200,{ok:true});
 }
 return reply(400,{ok:false,error:"GLF_INVALID_OPERATION"});
});
