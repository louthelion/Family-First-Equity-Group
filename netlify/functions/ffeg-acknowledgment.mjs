// FFEG Acknowledgment — universal thank-you email for website/intake leads.
// Rule (owner, 2026-10-31): anyone who contacts Family First Equity Group gets
// a thank-you; if their message lacks information, the thank-you also asks for
// the missing items in plain words. Plan: ffeg-acknowledgment-plan.md §1/§5.1.
// Mechanism: Resend (one fetch call, sending-only key in RESEND_API_KEY).
// FAIL-SAFE: this module never throws. A missing key or a failed send returns
// an outcome object; the caller's lead response is never affected.

const COMPANY = 'Family First Equity Group';
const ACK_FROM = 'contact@familyfirstequitygroup.com';
const PUBLIC_PHONE = '(407) 537-0535';
const RESEND_URL = 'https://api.resend.com/emails';
const SUBJECT = 'Thank you — we received your request | Family First Equity Group';

const clean = (v, n = 8000) => v == null ? '' : String(v).trim().slice(0, n);

// Intake-testable subset of the project's Quality Review missing() rules
// (plan §1.3): property address, phone, seller motivation/reason, buyer budget.
// Returns the missing items in plain words, in message order.
function missingInfoItems(x) {
  const missing = [];
  if (!clean(x.property_address)) missing.push('the property address');
  if (!clean(x.phone)) missing.push('your phone number');
  if (x.lead_type === 'seller' && !clean(x.reason)) missing.push('a few words about why you are selling');
  if (x.lead_type === 'buyer' && !clean(x.budget)) missing.push('your budget');
  return missing;
}

function joinPlain(items) {
  if (items.length <= 1) return items.join('');
  if (items.length === 2) return `${items[0]} and ${items[1]}`;
  return `${items.slice(0, -1).join(', ')}, and ${items[items.length - 1]}`;
}

function firstName(x) {
  const name = clean(x.full_name, 300);
  return name ? name.split(/\s+/)[0] : 'there';
}

// Renders variant A (standard) or B (more-info) from plan §5.1, as written.
function renderAcknowledgment(x, missing) {
  const variant = missing.length ? 'more_info' : 'standard';
  const hello = `Hello ${firstName(x)},`;
  const text = variant === 'standard'
    ? [hello, '',
      `Thank you for contacting ${COMPANY}. We appreciate you reaching out, and we have received your request.`,
      '',
      `A member of our team will contact you as soon as possible. If you would like to reach us in the meantime, just reply to this email, write to us at ${ACK_FROM}, or call us at ${PUBLIC_PHONE}.`,
      '',
      'Thank you,',
      COMPANY].join('\n')
    : [hello, '',
      `Thank you for contacting ${COMPANY}. We appreciate you reaching out, and we have received your request. We will contact you as soon as possible.`,
      '',
      `To help our team understand what you are trying to provide and prepare for our conversation, it would help to receive a little more information: ${joinPlain(missing)}. You can simply reply to this email with any of these details — or reach us at ${ACK_FROM} or ${PUBLIC_PHONE} — and we will add them to your request.`,
      '',
      'Thank you,',
      COMPANY].join('\n');
  return { variant, subject: SUBJECT, text };
}

// Sends the acknowledgment for a normalized lead. Never throws.
// Returns { outcome: 'sent'|'skipped-no-key'|'skipped-no-email'|'failed',
//           variant, missing, provider_id?, error? }.
async function sendAcknowledgment(lead, opts = {}) {
  const missing = missingInfoItems(lead || {});
  const { variant, subject, text } = renderAcknowledgment(lead || {}, missing);
  try {
    const to = clean(lead?.email, 320).toLowerCase();
    if (!to || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(to)) return { outcome: 'skipped-no-email', variant, missing };
    const key = clean(opts.apiKey != null ? opts.apiKey : (process.env.RESEND_API_KEY || ''), 20000);
    if (!key) return { outcome: 'skipped-no-key', variant, missing };
    const fetchImpl = opts.fetchImpl || globalThis.fetch;
    const r = await fetchImpl(RESEND_URL, {
      method: 'POST',
      headers: { authorization: `Bearer ${key}`, 'content-type': 'application/json' },
      body: JSON.stringify({ from: ACK_FROM, to: [to], subject, text })
    });
    let d = {};
    try { d = await r.json(); } catch {}
    if (!r.ok) return { outcome: 'failed', variant, missing, error: clean(d?.message || `Resend returned HTTP ${r.status}`, 500) };
    return { outcome: 'sent', variant, missing, provider_id: clean(d?.id || '', 200) };
  } catch (e) {
    return { outcome: 'failed', variant, missing, error: clean(e?.message || e, 500) };
  }
}

export { ACK_FROM, PUBLIC_PHONE, SUBJECT, missingInfoItems, renderAcknowledgment, sendAcknowledgment };
export default sendAcknowledgment;
