const test=require('node:test'),assert=require('node:assert/strict');
const {handler,classify}=require('../netlify/functions/submission-created.js');
test('all supported departments route without enabling licensed management',()=>{
 for(const [name,type] of [['Seller-Intake','seller'],['Buyer-Interest','buyer'],['Investor-Interest','investor'],['Property-Structure-Review','trust'],['Property-Media','media'],['Field-Representative-Interest','field'],['Property-Review','property_review'],['Short-Term-Review','short_term_review'],['Contact','contact'],['Property-Management',null]])assert.equal(classify('Family-First-'+name),type);
});
test('missing server credentials fail closed without customer data in error',async()=>{
 delete process.env.SUPABASE_SERVICE_ROLE_KEY;
 const r=await handler({body:JSON.stringify({payload:{id:'synthetic_test_1',form_name:'Family-First-Contact',data:{name:'TEST',email:'test@example.invalid'}}})});
 assert.equal(r.statusCode,503);assert.ok(!r.body.includes('test@example.invalid'));
});
test('verified event uses modern key correctly and requires confirmed database result',async()=>{
 process.env.SUPABASE_URL='https://jgpvrblzyznyprtffirw.supabase.co';process.env.SUPABASE_SERVICE_ROLE_KEY='sb_secret_SYNTHETIC_ONLY';
 const original=global.fetch;let packet;
 global.fetch=async(url,opts)=>{packet=opts;assert.ok(url.endsWith('/rpc/ffeg_ingest_verified_website_inquiry'));return {ok:true,json:async()=>({ok:true,target_table:'phone_leads',duplicate_reused:false})}};
 try{const r=await handler({body:JSON.stringify({payload:{id:'synthetic_test_2',form_name:'Family-First-Contact',data:{name:'TEST',email:'test@example.invalid'}}})});assert.equal(r.statusCode,200);assert.equal(packet.headers.Authorization,undefined);assert.equal(JSON.parse(packet.body).p_type,'contact');}finally{global.fetch=original;delete process.env.SUPABASE_SERVICE_ROLE_KEY;}
});
test('honeypot and unrelated company forms make no database request',async()=>{
 const original=global.fetch;global.fetch=()=>{throw Error('must not call')};
 try{for(const payload of [{id:'synthetic_test_3',form_name:'Other-Company',data:{}},{id:'synthetic_test_4',form_name:'Family-First-Contact',data:{'bot-field':'spam'}}])assert.equal((await handler({body:JSON.stringify({payload})})).statusCode,200);}finally{global.fetch=original;}
});
test('combined buyer/investor form honors the selected interest',()=>{
 const name='Family-First-Buyer-Investor-Interest';
 assert.equal(classify(name,{review_path:'Buyer'}),'buyer');
 assert.equal(classify(name,{review_path:'Investor'}),'investor');
});
test('every static inquiry form has supported identity, confirmation and stable tracking fields',()=>{
 const fs=require('node:fs'),path=require('node:path');const root=path.join(__dirname,'..');let count=0;
 for(const file of fs.readdirSync(root).filter(f=>f.endsWith('.html'))){
  for(const [,attrs,body] of fs.readFileSync(path.join(root,file),'utf8').matchAll(/<form\b([^>]*)>([\s\S]*?)<\/form>/g)){
   count++;assert.match(attrs,/name="Family-First-/);assert.match(attrs,/action="\/thank-you"/);
   for(const field of ['form-name','submission_uuid','source','bot-field'])assert.ok(body.includes('name="'+field+'"'),file+' missing '+field);
  }
 }assert.equal(count,14);
});
test('old deployed form identities remain deliverable during the cutover',async()=>{
 process.env.SUPABASE_URL='https://jgpvrblzyznyprtffirw.supabase.co';process.env.SUPABASE_SERVICE_ROLE_KEY='sb_secret_SYNTHETIC_ONLY';
 const original=global.fetch;const types=[];global.fetch=async(url,opts)=>{types.push(JSON.parse(opts.body).p_type);return {ok:true,json:async()=>({ok:true})}};
 try{for(const name of ['short-term-rental-review','legacy-property-review'])assert.equal((await handler({body:JSON.stringify({payload:{id:'synthetic_legacy_1',form_name:name,data:{}}})})).statusCode,200);assert.deepEqual(types,['short_term_review','trust']);}finally{global.fetch=original;delete process.env.SUPABASE_SERVICE_ROLE_KEY;}
});
