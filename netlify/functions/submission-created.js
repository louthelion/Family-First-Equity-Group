const SUPABASE_URL = process.env.SUPABASE_URL || 'https://jgpvrblzyznyprtffirw.supabase.co';
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY || 'sb_publishable_4MZbcaMuJ-_GfaZh1jb4yA_tyyj7EfP';

function clean(value) {
  if (value === undefined || value === null) return '';
  if (typeof value === 'object') {
    if (value.name) return value.name;
    return JSON.stringify(value);
  }
  return String(value).trim();
}

function first(data, names) {
  for (const name of names) {
    if (data[name] !== undefined && data[name] !== null && clean(data[name]) !== '') return clean(data[name]);
  }
  return '';
}

function summary(data) {
  return Object.entries(data)
    .filter(([key]) => key !== 'bot-field' && key !== 'form-name')
    .map(([key, value]) => `${key}: ${clean(value)}`)
    .join('\n');
}

async function insert(table, row) {
  const response = await fetch(`${SUPABASE_URL}/rest/v1/${table}`, {
    method: 'POST',
    headers: {
      apikey: SUPABASE_KEY,
      Authorization: `Bearer ${SUPABASE_KEY}`,
      'Content-Type': 'application/json',
      Prefer: 'return=minimal'
    },
    body: JSON.stringify(row)
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`${table} insert failed: ${response.status} ${text}`);
  }
}


// The V3 bridge is opt-in. No production submission route changes without both
// server-only settings; failures leave the existing Netlify submission intact.
async function mirrorToV3(payload, data, formName) {
  const url = process.env.FFEG_V3_WEBSITE_BRIDGE_URL;
  const secret = process.env.FFEG_V3_WEBSITE_BRIDGE_SECRET;
  if (!url || !secret) return;
  if (secret.length < 32 || !/^https:\/\/[a-z0-9-]+\.netlify\.app\/api\/ffeg\/v3\/website-bridge$/.test(url)) {
    console.error('V3 website bridge configuration rejected.');
    return;
  }
  if (!/^Family-First-/i.test(formName)) return;
  const submissionId = String(payload.id || payload.submission_id || '');
  if (!/^[a-zA-Z0-9_-]{8,160}$/.test(submissionId)) {
    console.error('V3 website bridge skipped form without Netlify submission ID.');
    return;
  }
  const response = await fetch(url, {
    method: 'POST',
    headers: { 'content-type': 'application/json', 'x-ffeg-intake-secret': secret },
    body: JSON.stringify({ submission_id: submissionId, form_name: formName, data })
  });
  if (!response.ok) console.error('V3 website bridge delivery failed:', response.status);
}

exports.handler = async function(event) {
  try {
    const body = event.body ? JSON.parse(event.body) : {};
    const payload = body.payload || body;
    const data = payload.data || payload;
    const formName = clean(payload.form_name || data['form-name'] || data.form_name).toLowerCase();

    if (!data || Object.keys(data).length === 0) {
      return { statusCode: 200, body: 'No form data found.' };
    }

    try { await mirrorToV3(payload, data, clean(payload.form_name || data['form-name'] || data.form_name)); }
    catch (error) { console.error('V3 website bridge delivery failed:', error); }

    if (formName.includes('seller')) {
      await insert('seller_leads', {
        source: 'family_first_website_netlify_form',
        full_name: `${first(data, ['first_name', 'First Name'])} ${first(data, ['last_name', 'Last Name'])}`.trim(),
        phone: first(data, ['phone', 'Phone']),
        email: first(data, ['email', 'Email']),
        property_address: [
          first(data, ['property_address', 'Property Address']),
          first(data, ['city', 'City']),
          first(data, ['state', 'State']),
          first(data, ['zip_code', 'zip', 'ZIP Code'])
        ].filter(Boolean).join(', '),
        reason_for_selling: first(data, ['selling_reason', 'desired_outcome', 'Reason for Selling']),
        urgency: first(data, ['selling_timeline', 'meeting_availability', 'Urgency']),
        notes: summary(data),
        status: 'new'
      });
    }

    if (formName.includes('property-management')) {
      await insert('phone_leads', {
        company: 'Family First',
        caller_name: `${first(data, ['first_name', 'First Name'])} ${first(data, ['last_name', 'Last Name'])}`.trim(),
        phone: first(data, ['phone', 'Phone']),
        email: first(data, ['email', 'Email']),
        reason_for_call: 'Property management website request',
        property_address: [
          first(data, ['property_address', 'Property Address']),
          first(data, ['city', 'City']),
          first(data, ['state', 'State']),
          first(data, ['zip_code', 'zip', 'ZIP Code'])
        ].filter(Boolean).join(', '),
        assigned_department: 'Property Management Department',
        ai_receptionist_notes: summary(data),
        status: 'new'
      });
    }

    if (formName.includes('field-representative')) {
      await insert('phone_leads', {
        company: 'Family First',
        caller_name: `${first(data, ['first_name', 'First Name'])} ${first(data, ['last_name', 'Last Name'])}`.trim(),
        phone: first(data, ['phone', 'Phone']),
        email: first(data, ['email', 'Email']),
        reason_for_call: 'Field Property Representative Interest',
        property_address: [
          first(data, ['service_area', 'Primary service area']),
          first(data, ['home_city', 'Home city']),
          first(data, ['home_state', 'Home state'])
        ].filter(Boolean).join(', '),
        assigned_department: 'Acquisitions / Field Operations',
        ai_receptionist_notes: summary(data),
        status: 'new'
      });
    }

    return { statusCode: 200, body: 'Form saved to Supabase.' };
  } catch (error) {
    console.error(error);
    return { statusCode: 500, body: error.message };
  }
};