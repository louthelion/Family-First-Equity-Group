const test = require('node:test');
const assert = require('node:assert/strict');
const {evaluate,handler} = require('../netlify/functions/ffeg-intake-health.js');
test('intake health never exposes credentials and distinguishes configured from verified', async () => {
  const env = {SUPABASE_URL:'https://jgpvrblzyznyprtffirw.supabase.co',SUPABASE_SERVICE_ROLE_KEY:'sb_secret_TEST_PLACEHOLDER_AT_LEAST_32_CHARS'};
  assert.equal(evaluate(env),true);
  assert.equal(evaluate({...env,SUPABASE_URL:'https://wrong.supabase.co'}),false);
  assert.equal(evaluate({...env,SUPABASE_SERVICE_ROLE_KEY:''}),false);
  const response = await handler({httpMethod:'GET'});
  const body = JSON.parse(response.body);
  assert.equal(response.statusCode,200);
  assert.equal(body.crmDeliveryVerified,false);
  assert.equal(response.body.includes('sb_secret_'),false);
  assert.equal(response.headers['cache-control'],'no-store');
});
