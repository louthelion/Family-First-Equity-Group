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

exports.handler = async function(event) {
  try {
    const body = event.body ? JSON.parse(event.body) : {};
    const payload = body.payload || body;
    const data = payload.data || payload;
    const formName = clean(payload.form_name || data['form-name'] || data.form_name).toLowerCase();

    if (!data || Object.keys(data).length === 0) {
      return { statusCode: 200, body: 'No form data found.' };
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

    return { statusCode: 200, body: 'Form saved to Supabase.' };
  } catch (error) {
    console.error(error);
    return { statusCode: 500, body: error.message };
  }
};