import { createClient } from "npm:@supabase/supabase-js@2.117.2";
const site="https://glf-postulaciones.vercel.app";
const reply=(status:number,body:object)=>new Response(JSON.stringify(body),{status,headers:{"Content-Type":"application/json","Cache-Control":"no-store","Access-Control-Allow-Origin":site,"Access-Control-Allow-Headers":"authorization,apikey,content-type,x-client-info","Access-Control-Allow-Methods":"POST,OPTIONS","Vary":"Origin"}});
const hash=async(value:string)=>Array.from(new Uint8Array(await crypto.subtle.digest("SHA-256",new TextEncoder().encode(value))),v=>v.toString(16).padStart(2,"0")).join("");
Deno.serve(async(request:Request)=>{
 if(request.method==="OPTIONS")return reply(200,{});
 if(request.method!=="POST")return reply(405,{ok:false});
 if(Number(request.headers.get("content-length")||0)>2048)return reply(413,{ok:false});
 const url=Deno.env.get("SUPABASE_URL"),anon=Deno.env.get("SUPABASE_ANON_KEY"),secret=Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
 if(!url||!anon||!secret)return reply(503,{ok:false,error:"GLF_INVITATION_CONFIG"});
 const admin=createClient(url,secret,{auth:{persistSession:false,autoRefreshToken:false}});
 let input;try{input=await request.json()}catch{return reply(400,{ok:false})}
 if(input.operation==="redeem"){
  if(typeof input.token!=="string"||!/^([a-f0-9]{64})$/.test(input.token))return reply(400,{ok:false,error:"GLF_INVITATION_EXPIRED"});
  const {data:claim,error}=await admin.rpc("consume_staff_link",{secret_hash:await hash(input.token)});
  if(error||!claim)return reply(410,{ok:false,error:"GLF_INVITATION_EXPIRED"});
  const {data:recipient,error:recipientError}=await admin.auth.admin.getUserById(claim.recipient_id);
  if(recipientError||recipient.user?.email?.toLowerCase()!==claim.email)return reply(410,{ok:false,error:"GLF_INVITATION_RECIPIENT"});
  // The seven-day ticket was delivered privately. Mint a short-lived Auth token only on explicit redemption.
  const {data,error:linkError}=await admin.auth.admin.generateLink({type:"magiclink",email:claim.email,options:{redirectTo:site+"/auth/activate?id="+claim.id}});
  if(linkError||!data.properties?.hashed_token||data.user?.id!==claim.recipient_id)return reply(503,{ok:false,error:"GLF_INVITATION_CONFIG"});
  return reply(200,{ok:true,token_hash:data.properties.hashed_token,id:claim.id});
 }
 const authorization=request.headers.get("Authorization")||"";
 if(!authorization.startsWith("Bearer "))return reply(401,{ok:false,error:"GLF_FORBIDDEN"});
 const caller=createClient(url,anon,{global:{headers:{Authorization:authorization}},auth:{persistSession:false,autoRefreshToken:false}});
 const {data:{user},error:authError}=await caller.auth.getUser();
 const {data:claims,error:claimsError}=await caller.auth.getClaims(authorization.slice(7));
 if(authError||!user||claimsError||claims?.claims.aal!=="aal2")return reply(403,{ok:false,error:"GLF_FORBIDDEN"});
 if(input.operation!=="prepare"||typeof input.id!=="string"||!/^[a-f0-9-]{36}$/i.test(input.id)||typeof input.updated_at!=="string"||!Number.isFinite(Date.parse(input.updated_at)))return reply(400,{ok:false,error:"GLF_INVALID_INVITATION"});
 const {data:claim,error:claimError}=await caller.rpc("begin_staff_link",{invitation_id:input.id,expected_updated_at:input.updated_at});
 if(claimError||!claim)return reply(409,{ok:false,error:claimError?.message.match(/GLF_[A-Z_]+/)?.[0]||"GLF_INVITATION_FAILED"});
 let recipientId=claim.invited_user_id as string|null;
 try{
  if(!recipientId){
   // generateLink provisions the invited account without sending SMTP or creating a password.
   const {data,error}=await admin.auth.admin.generateLink({type:"invite",email:claim.email,options:{redirectTo:site+"/auth/activate",data:{full_name:claim.full_name,glf_invitation_id:input.id}}});
   if(error||!data.user)throw new Error("GLF_INVITATION_CONFIG");recipientId=data.user.id;
  }
  const token=Array.from(crypto.getRandomValues(new Uint8Array(32)),v=>v.toString(16).padStart(2,"0")).join("");
  const {data:expiry,error}=await admin.rpc("finish_staff_link",{invitation_id:input.id,attempt:claim.attempt_id,recipient_id:recipientId,token_hash:await hash(token)});
  if(error)throw new Error("GLF_INVITATION_RECONCILE");
  return reply(200,{ok:true,url:site+"/auth/activate#setup="+token,expires_at:expiry});
 }catch(e){
  const error=e instanceof Error?e.message:"GLF_INVITATION_FAILED";
  await admin.rpc("finish_staff_invitation",{invitation_id:input.id,attempt:claim.attempt_id,recipient_id:recipientId,failure_code:error});
  return reply(503,{ok:false,error});
 }
});
