const J=(o,s=200)=>new Response(JSON.stringify(o),{status:s,headers:{'content-type':'application/json; charset=utf-8','cache-control':'no-store'}});
const norm=n=>String(n||'').toLowerCase().replace(/\s+/g,' ').trim();
async function sha(t){const b=await crypto.subtle.digest('SHA-256',new TextEncoder().encode(t));return [...new Uint8Array(b)].map(x=>x.toString(16).padStart(2,'0')).join('')}
function okDate(v){if(typeof v!=='string'||!/^\d{4}-\d{2}-\d{2}$/.test(v))return false;const d=new Date(v+'T00:00:00Z');return !isNaN(d)&&d<new Date()&&d.getUTCFullYear()>1900&&d.toISOString().slice(0,10)===v}
const okName=n=>typeof n==='string'&&n.trim().length>=5&&n.trim().length<=80;
async function limited(db,ip,kind,max,win){const now=Math.floor(Date.now()/1000);
 await db.prepare('DELETE FROM rl WHERE ts<?').bind(now-86400).run();
 const r=await db.prepare('SELECT COUNT(*) n FROM rl WHERE ip=? AND kind=? AND ts>?').bind(ip,kind,now-win).first();
 if(r.n>=max)return true;
 await db.prepare('INSERT INTO rl(ip,kind,ts) VALUES(?,?,?)').bind(ip,kind,now).run();return false}
function eq(a,b){if(a.length!==b.length)return false;let r=0;for(let i=0;i<a.length;i++)r|=a.charCodeAt(i)^b.charCodeAt(i);return r===0}
async function admin(req,env,ip){
 if(!env.ADMIN_TOKEN)return false;
 if(await limited(env.DB,ip,'adm',30,600))return null;
 const t=(req.headers.get('authorization')||'').replace(/^Bearer /,'');
 return eq(t,env.ADMIN_TOKEN)}
export async function onRequest({request:req,env,params}){
 const r=[].concat(params.route||[]).join('/'),m=req.method,ip=req.headers.get('cf-connecting-ip')||'0',db=env.DB;
 try{
 if(r==='ping')return J({ok:true});
 if(r==='register'&&m==='POST'){
  let b;try{b=await req.json()}catch{return J({error:'invalid'},400)}
  if(b.hp)return J({error:'invalid'},400);
  if(!okName(b.giver)||!okName(b.receiver)||!okDate(b.giverBirth)||!okDate(b.receiverBirth)||b.consent!==true)return J({error:'invalid'},400);
  if(norm(b.giver)===norm(b.receiver)&&b.giverBirth===b.receiverBirth)return J({error:'invalid'},400);
  if(await limited(db,ip,'reg',5,3600))return J({error:'limit'},429);
  const key=await sha(norm(b.giver)+'|'+b.giverBirth);
  if(await db.prepare('SELECT 1 FROM choices WHERE giver_key=?').bind(key).first())return J({error:'exists'},409);
  const total=(await db.prepare('SELECT COUNT(*) n FROM choices').first()).n;
  if(total>=9000)return J({error:'full'},503);
  for(let i=0;i<20;i++){
   const a=new Uint32Array(1);crypto.getRandomValues(a);const code='QK-'+(1000+a[0]%9000);
   const res=await db.prepare('INSERT OR IGNORE INTO choices(code,giver,giver_birth,receiver,receiver_birth,giver_key,created_at) VALUES(?,?,?,?,?,?,?)')
    .bind(code,b.giver.trim(),b.giverBirth,b.receiver.trim(),b.receiverBirth,key,new Date().toISOString()).run();
   if(res.meta.changes===1)return J({ok:true,code});
   if(await db.prepare('SELECT 1 FROM choices WHERE giver_key=?').bind(key).first())return J({error:'exists'},409);
  }
  return J({error:'full'},503)}
 if(r==='check'&&m==='POST'){
  let b;try{b=await req.json()}catch{return J({error:'invalid'},400)}
  if(!/^QK-\d{4}$/.test(String(b.code||'')))return J({error:'invalid'},400);
  if(await limited(db,ip,'chk',10,600))return J({error:'limit'},429);
  const row=await db.prepare('SELECT giver,receiver,status FROM choices WHERE code=?').bind(b.code).first();
  if(!row)return J({status:'none'});
  if(row.status!=='active')return J({status:'pending'});
  return J({status:'active',giver:row.giver,receiver:row.receiver})}
 if(r.startsWith('admin/')){
  const a=await admin(req,env,ip);
  if(a===null)return J({error:'limit'},429);
  if(!a)return J({error:'auth'},401);
  if(r==='admin/list'&&m==='GET'){
   const q=await db.prepare('SELECT code,giver,giver_birth,receiver,receiver_birth,status,created_at,activated_at FROM choices ORDER BY created_at DESC LIMIT 500').all();
   return J({items:q.results})}
  if((r==='admin/activate'||r==='admin/delete')&&m==='POST'){
   const b=await req.json().catch(()=>({}));
   if(!/^QK-\d{4}$/.test(String(b.code||'')))return J({error:'invalid'},400);
   if(r==='admin/activate')await db.prepare("UPDATE choices SET status='active',activated_at=? WHERE code=?").bind(new Date().toISOString(),b.code).run();
   else await db.prepare('DELETE FROM choices WHERE code=?').bind(b.code).run();
   return J({ok:true})}
 }
 return J({error:'not_found'},404)
 }catch(e){return J({error:'server'},500)}
}
