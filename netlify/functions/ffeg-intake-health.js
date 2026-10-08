// Public readiness reports presence only; it never returns credentials.
exports.handler=async()=>({statusCode:200,headers:{'content-type':'application/json','cache-control':'no-store'},body:JSON.stringify({
 publicIntake:'NETLIFY_FORMS',databaseDeliveryConfigured:!!process.env.SUPABASE_SERVICE_ROLE_KEY&&/^https:\/\/jgpvrblzyznyprtffirw\.supabase\.co\/?$/.test(process.env.SUPABASE_URL||''),
 platformProductionReady:false,liveResearchEnabled:false,phoneRoutingVerified:false
})});
