// Draft preview mirror; public-site production remains unchanged.
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


// Route real contact submissions through the existing verified and idempotent
// database RPC. Netlify Forms retains the original submission if delivery fails.
async function deliverContactToCrm(payload, data, formName, inquiryType = 'contact') {
  if (!['contact', 'seller'].includes(inquiryType)) return { statusCode: 400, body: 'Unsupported inquiry.' };
  if (clean(data['bot-field'])) return { statusCode: 200, body: 'Ignored.' };
  const submissionId = clean(payload.id || payload.submission_id || data.submission_uuid);
  if (!/^[A-Za-z0-9_-]{8,160}$/.test(submissionId)) {
    return { statusCode: 400, body: 'A valid submission reference is required.' };
  }
  const name = first(data, ['name', 'full_name', 'contact_name']);
  const email = first(data, ['email']);
  const phone = first(data, ['phone']);
  if (!name || (!email && !phone)) {
    return { statusCode: 400, body: 'Contact details are required.' };
  }
  if (inquiryType === 'seller' && !first(data, ['property_address'])) {
    return { statusCode: 400, body: 'Property address is required.' };
  }
  const consent = first(data, ['consent']).toLowerCase();
  if (!['on', 'true', 'yes', '1'].includes(consent)) {
    return { statusCode: 400, body: 'Consent is required.' };
  }

  const url = String(process.env.SUPABASE_URL || '').replace(/\/$/, '');
  const key = String(process.env.SUPABASE_SERVICE_ROLE_KEY || '');
  if (url !== 'https://jgpvrblzyznyprtffirw.supabase.co' || key.length < 32) {
    console.error('ffeg_contact_crm_configuration_unavailable');
    return { statusCode: 503, body: 'Submission saved by website; internal routing is temporarily unavailable.' };
  }

  try {
    const headers = { apikey: key, 'content-type': 'application/json' };
    if (!key.startsWith('sb_secret_')) headers.Authorization = 'Bearer ' + key;
    const res = await fetch(url + '/rest/v1/rpc/ffeg_ingest_verified_website_inquiry', {
      method: 'POST', headers, signal: AbortSignal.timeout(15000),
      body: JSON.stringify({ p_submission_id: submissionId, p_form_name: formName, p_type: inquiryType, p_data: data })
    });
    const confirmation = await res.json().catch(() => null);
    if (!res.ok || confirmation?.ok !== true || confirmation.target_table !== (inquiryType === 'seller' ? 'seller_leads' : 'phone_leads')) {
      console.error('ffeg_contact_crm_delivery_failed', res.status);
      return { statusCode: 502, body: 'Submission saved by website; internal routing is pending.' };
    }
    return { statusCode: 200, body: 'Inquiry recorded in business dashboard.' };
  } catch {
    console.error('ffeg_contact_crm_delivery_unavailable');
    return { statusCode: 502, body: 'Submission saved by website; internal routing is pending.' };
  }
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

    if (formName === 'family-first-contact') {
      return await deliverContactToCrm(payload, data, 'Family-First-Contact');
    }
    if (formName === 'family-first-quick-seller-request') {
      return await deliverContactToCrm(payload, data, 'Family-First-Quick-Seller-Request', 'seller');
    }

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