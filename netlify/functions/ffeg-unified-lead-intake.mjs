import liveHandler from './ffeg-unified-lead-intake-live.mjs';
import dryRunHandler from './ffeg-unified-intake-dry-run.mjs';

function method(request){return String(request?.method||request?.httpMethod||'GET').toUpperCase()}
async function requestBody(request){const cloned=typeof request?.clone==='function'?request.clone():request;return typeof cloned?.json==='function'?await cloned.json():JSON.parse(cloned?.body||'{}')}
function forwardedRequest(request,body){if(typeof Request==='function'&&request?.url)return new Request(request.url,{method:'POST',headers:request.headers,body:JSON.stringify(body)});return{...request,body:JSON.stringify(body)}}
async function normalizeAiResponse(response,body){if(body?.intake_type!=='ai_discovered_public_source'&&body?.simulated_intake_type!=='ai_discovered_public_source')return response;let data={};try{data=await response.clone().json()}catch{return response}data.source='ai_discovered_public_source';data.source_display='AI-Sourced Lead';data.intake_method='AI Lead Discovery';data.ai_provider=data.ai_provider||body.ai_provider||body.provider_name||body.source_name||null;data.original_source=data.original_source||body.original_public_source||body.original_source||body.source_name||body.provider_reference||body.source_record_reference||null;data.outreach_provider_status=data.outreach_provider_status||'Not configured';if(data.outreach_sent!==true)data.outreach_sent=false;data.direct_intake=true;data.website_application_required=false;return new Response(JSON.stringify(data),{status:response.status,statusText:response.statusText,headers:response.headers})}

export default async function handler(request){
  if(method(request)==='POST'){
    try{
      const body=await requestBody(request);
      if(body?.dry_run===true||body?.intake_type==='dry_run'){
        const simulated={...body,simulated_intake_type:body.simulated_intake_type||(body.intake_type==='dry_run'?'website_form':body.intake_type)};
        return normalizeAiResponse(await dryRunHandler(forwardedRequest(request,simulated)),simulated);
      }
      if(body?.intake_type==='ai_discovered_public_source'){
        const normalized={...body,source:'ai_discovered_public_source',intake_method:'AI Lead Discovery',source_name:body.source_name||body.ai_provider||body.provider_name,original_source:body.original_source||body.original_public_source||body.public_source_name||body.connected_provider_name||body.source_name};
        return normalizeAiResponse(await liveHandler(forwardedRequest(request,normalized)),normalized);
      }
    }catch{
      return liveHandler(request);
    }
  }
  return liveHandler(request);
}

export{handler};
