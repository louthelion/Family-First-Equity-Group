// Netlify Forms is the durable first receipt. Only the configured server bridge
// creates private review records; no browser database key or legacy double-write.
exports.handler = async function (event) {
  let incoming;
  try { incoming = JSON.parse(event.body || '{}'); }
  catch { return { statusCode: 400, body: 'Invalid form event.' }; }
  const payload = incoming.payload || incoming;
  const data = payload.data;
  const formName = String(payload.form_name || data?.['form-name'] || data?.form_name || '');
  if (!data || typeof data !== 'object' || Array.isArray(data) || !/^Family-First-/i.test(formName)) return { statusCode: 200, body: 'No supported Family First form event.' };
  if (data['bot-field']) return { statusCode: 200, body: 'Submission ignored.' };
  const submissionId = String(payload.id || payload.submission_id || '');
  const url = process.env.FFEG_V3_WEBSITE_BRIDGE_URL || '';
  const secret = process.env.FFEG_V3_WEBSITE_BRIDGE_SECRET || '';
  if (!/^[a-zA-Z0-9_-]{8,160}$/.test(submissionId) || secret.length < 32 || !/^https:\/\/[a-z0-9-]+\.netlify\.app\/api\/ffeg\/v3\/website-bridge$/.test(url)) {
    console.error('Private intake configuration unavailable; Netlify receipt retained.');
    return { statusCode: 503, body: 'Private processing requires configuration; original receipt retained.' };
  }
  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'content-type': 'application/json', 'x-ffeg-intake-secret': secret },
      body: JSON.stringify({ submission_id: submissionId, form_name: formName, data })
    });
    const result = await response.json().catch(() => ({}));
    if (!response.ok || result.ok !== true || (!result.recorded && !result.duplicate)) throw new Error('Bridge did not confirm a durable receipt.');
    return { statusCode: 200, body: result.duplicate ? 'Existing private receipt confirmed.' : 'Private receipt recorded.' };
  } catch {
    console.error('Private bridge delivery failed; Netlify receipt retained for reconciliation.');
    return { statusCode: 502, body: 'Private delivery requires reconciliation; original receipt retained.' };
  }
};
