// Netlify verifies event JWS before invoking submission-created. Server secrets only.
const clean = value => value == null ? '' : typeof value === 'object' ? JSON.stringify(value) : String(value).trim();
function classify(formName, data = {}) {
 const text = (formName+' '+clean(data.review_path)).toLowerCase();
 if (/field-representative/.test(text)) return 'field';
 if (/property-management/.test(text)) return null; // licensed third-party service unavailable
 if (/seller|sell-property|disposition/.test(text)) return 'seller';
 if (/buyer|investor/.test(text)) return /investor/.test(text) ? 'investor' : 'buyer';
 if (/structure|trust|estate|legacy/.test(text)) return 'trust';
 if (/media/.test(text)) return 'media';
 if (/short-term|airbnb/.test(text)) return 'short_term_review';
 if (/property-review|listing|acquisition/.test(text)) return 'property_review';
 return 'contact';
}
exports.classify = classify;
exports.handler = async event => {
 try {
  const parsed=JSON.parse(event.body||'{}'); const payload=parsed.payload||parsed;
  const data=payload.data||{}; const formName=clean(payload.form_name||data['form-name']);
  if (!/^Family-First-/.test(formName)||clean(data['bot-field'])) return {statusCode:200,body:'Ignored'};
  const type=classify(formName,data); if(!type) return {statusCode:200,body:'Unavailable service: no management engagement created'};
  const id=clean(payload.id||payload.submission_id||data.submission_uuid);
  if (!/^[A-Za-z0-9_-]{8,160}$/.test(id)) return {statusCode:400,body:'Submission reference required'};
  const url=process.env.SUPABASE_URL; const key=process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url||!/^https:\/\/jgpvrblzyznyprtffirw\.supabase\.co\/?$/.test(url)||!key) {
   console.error('FFEG_INTAKE_CONFIGURATION_REQUIRED',id);
   return {statusCode:503,body:'Database delivery unavailable; inquiry retained in Netlify Forms'};
  }
  const headers={'content-type':'application/json',apikey:key};
  if(!key.startsWith('sb_secret_')) headers.Authorization=`Bearer ${key}`;
  const response=await fetch(`${url.replace(/\/$/,'')}/rest/v1/rpc/ffeg_ingest_verified_website_inquiry`,{
   method:'POST',headers,body:JSON.stringify({p_submission_id:id,p_form_name:formName,p_type:type,p_data:data}),signal:AbortSignal.timeout(15000)
  });
  const result=await response.json().catch(()=>({}));
  if(!response.ok||result.ok!==true){console.error('FFEG_INTAKE_DELIVERY_FAILED',id,response.status);return {statusCode:502,body:'Database delivery failed; inquiry retained in Netlify Forms'};}
  console.info('FFEG_INTAKE_DELIVERED',id,result.target_table,result.duplicate_reused);
  return {statusCode:200,body:'Verified inquiry and matching lead saved'};
 } catch {console.error('FFEG_INTAKE_EVENT_FAILED');return {statusCode:500,body:'Intake delivery failed; review retained Netlify submission'};}
};
