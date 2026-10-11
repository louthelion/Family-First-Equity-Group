// Read-only diagnostic. Never return a credential, lead record or account identifier.
function evaluate(env) {
  const url = String(env.SUPABASE_URL || '').replace(/\/$/, '');
  const key = String(env.SUPABASE_SERVICE_ROLE_KEY || '');
  return url === 'https://jgpvrblzyznyprtffirw.supabase.co' && key.length > 30;
}

exports.evaluate = evaluate;
exports.handler = async (event = {}) => {
  if (event.httpMethod && event.httpMethod !== 'GET') {
    return { statusCode: 405, headers: { allow: 'GET' }, body: 'Method Not Allowed' };
  }
  return {
    statusCode: 200,
    headers: { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store' },
    body: JSON.stringify({
      publicIntake: 'netlify_forms',
      contactCrmDeliveryConfigured: evaluate(process.env),
      // A configured secret does not prove an end-to-end successful database write.
      crmDeliveryVerified: false,
      lastVerifiedByHuman: null
    })
  };
};
