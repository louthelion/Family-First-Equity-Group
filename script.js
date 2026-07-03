const toggle = document.querySelector('.menu-toggle');
const nav = document.querySelector('.site-nav');
const footerSocial = document.querySelector('.footer-social .social-links');

if (nav && footerSocial) {
  const mobileSocial = document.createElement('div');
  mobileSocial.className = 'mobile-social';
  mobileSocial.innerHTML = '<p class="mobile-social-title">Follow Family First Equity Group</p>';
  const mobileLinks = footerSocial.cloneNode(true);
  mobileLinks.setAttribute('aria-label', 'Family First Equity Group social media');
  mobileSocial.appendChild(mobileLinks);
  nav.appendChild(mobileSocial);
}

if (toggle && nav) {
  toggle.addEventListener('click', () => {
    const open = nav.classList.toggle('open');
    toggle.setAttribute('aria-expanded', String(open));
    toggle.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
    document.body.classList.toggle('nav-open', open);
  });

  nav.querySelectorAll('a:not([href="#"])').forEach((a) =>
    a.addEventListener('click', () => {
      nav.classList.remove('open');
      toggle.setAttribute('aria-expanded', 'false');
      toggle.setAttribute('aria-label', 'Open menu');
      document.body.classList.remove('nav-open');
    })
  );
}

document.querySelectorAll('[data-year]').forEach((el) => {
  el.textContent = new Date().getFullYear();
});

document.querySelectorAll('[data-property-coming-soon]').forEach((button) =>
  button.addEventListener('click', () => {
    alert('Property details are coming soon. No active property listing is available at this time.');
  })
);

document.querySelectorAll('[data-credit-help-select]').forEach((select) => {
  const form = select.closest('form');
  const message = form ? form.querySelector('[data-credit-help-message]') : null;
  if (!message) return;
  const update = () => {
    message.hidden = select.value !== 'Yes';
  };
  select.addEventListener('change', update);
  update();
});

const FFEG_DB_URL = 'https://jgpvrblzyznyprtffirw.supabase.co';
const FFEG_PUBLIC_DB_KEY = 'sb_publishable_4MZbcaMuJ-_GfaZh1jb4yA_tyyj7EfP';
let ffeDbClient = null;

function getField(form, name) {
  const item = form.elements[name];
  if (!item) return '';
  if (item instanceof RadioNodeList || (typeof item.length === 'number' && !item.type)) {
    return Array.from(item)
      .filter((el) => el.checked || el.selected)
      .map((el) => el.value)
      .filter(Boolean)
      .join(', ');
  }
  if (item.type === 'file') {
    return item.files && item.files.length ? item.files.length + ' uploaded file(s) saved by Netlify form' : '';
  }
  return item.value || '';
}

function formSummary(form) {
  const lines = [];
  new FormData(form).forEach((value, key) => {
    if (key === 'bot-field' || key === 'form-name') return;
    if (value instanceof File) {
      if (value.name) lines.push(key + ': ' + value.name);
    } else {
      lines.push(key + ': ' + value);
    }
  });
  return lines.join('\n');
}

function loadDb() {
  return new Promise((resolve, reject) => {
    if (ffeDbClient) return resolve(ffeDbClient);
    if (window.supabase) {
      ffeDbClient = window.supabase.createClient(FFEG_DB_URL, FFEG_PUBLIC_DB_KEY);
      return resolve(ffeDbClient);
    }
    const script = document.createElement('script');
    script.src = 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2';
    script.onload = () => {
      ffeDbClient = window.supabase.createClient(FFEG_DB_URL, FFEG_PUBLIC_DB_KEY);
      resolve(ffeDbClient);
    };
    script.onerror = reject;
    document.head.appendChild(script);
  });
}

function fullName(form) {
  return (getField(form, 'first_name') + ' ' + getField(form, 'last_name')).trim() || getField(form, 'full_name') || getField(form, 'name');
}

function propertyAddress(form) {
  return [
    getField(form, 'property_address'),
    getField(form, 'address'),
    getField(form, 'city') || getField(form, 'preferred_city'),
    getField(form, 'state') || getField(form, 'preferred_state'),
    getField(form, 'zip_code') || getField(form, 'zip') || getField(form, 'preferred_zip_area')
  ]
    .filter(Boolean)
    .join(', ');
}

function sellerRow(form) {
  return {
    source: 'family_first_website',
    full_name: fullName(form),
    phone: getField(form, 'phone'),
    email: getField(form, 'email'),
    property_address: propertyAddress(form),
    reason_for_selling: getField(form, 'selling_reason') || getField(form, 'desired_outcome') || getField(form, 'reason_for_selling'),
    urgency: getField(form, 'selling_timeline') || getField(form, 'meeting_availability') || getField(form, 'urgency'),
    notes: formSummary(form),
    status: 'new'
  };
}

function buyerRow(form) {
  return {
    source: 'family_first_website',
    full_name: fullName(form),
    phone: getField(form, 'phone'),
    email: getField(form, 'email'),
    budget: getField(form, 'budget') || getField(form, 'purchase_budget') || getField(form, 'price_range'),
    location_interest: getField(form, 'location_interest') || getField(form, 'preferred_city') || getField(form, 'city') || getField(form, 'state'),
    property_type: getField(form, 'property_type') || getField(form, 'investment_type'),
    notes: formSummary(form),
    status: 'new'
  };
}

function phoneLeadRow(form, reason, department) {
  return {
    company: 'Family First',
    caller_name: fullName(form),
    phone: getField(form, 'phone'),
    email: getField(form, 'email'),
    reason_for_call: reason,
    property_address: propertyAddress(form),
    assigned_department: department,
    ai_receptionist_notes: formSummary(form),
    status: 'new'
  };
}

function trustCaseRow(form) {
  return {
    client_name: fullName(form),
    phone: getField(form, 'phone'),
    email: getField(form, 'email'),
    purpose: getField(form, 'purpose') || getField(form, 'ownership_type') || 'Structure, trust, insurance, or ownership coordination',
    property_address: propertyAddress(form),
    ownership_notes: getField(form, 'ownership_notes') || getField(form, 'property_relationship') || getField(form, 'desired_outcome'),
    missing_documents: getField(form, 'missing_documents') || getField(form, 'supporting_documents'),
    status: 'new'
  };
}

function detectFormType(form) {
  const name = (form.getAttribute('name') || '').toLowerCase();
  const path = window.location.pathname.toLowerCase();
  const reviewPath = (getField(form, 'review_path') || '').toLowerCase();
  const propertyType = (getField(form, 'property_type') || '').toLowerCase();
  const buyerSignals = [getField(form, 'cash_buyer'), getField(form, 'purchase_plan'), getField(form, 'credit_score_range'), getField(form, 'vaultara_referral')].filter(Boolean).join(' ').toLowerCase();
  const text = (name + ' ' + path + ' ' + reviewPath + ' ' + propertyType + ' ' + buyerSignals).toLowerCase();

  if (text.includes('seller') || text.includes('sell-property') || text.includes('sell your property') || text.includes('disposition')) return 'seller';
  if (text.includes('buyer') || text.includes('buy') || text.includes('view properties') || text.includes('properties') || text.includes('acquisition') || text.includes('cash buyer') || text.includes('financing')) return 'buyer';
  if (text.includes('trust') || text.includes('structure') || text.includes('insurance') || text.includes('legacy') || text.includes('estate')) return 'trust';
  if (text.includes('property-management') || text.includes('management')) return 'management';
  if (text.includes('contact') || text.includes('feedback')) return 'contact';
  return 'contact';
}

function leadQualitySummary(form, type) {
  const pieces = [];
  if (type === 'seller') {
    pieces.push('timeline=' + (getField(form, 'selling_timeline') || 'not provided'));
    pieces.push('price=' + (getField(form, 'desired_fixed_price') || 'not provided'));
    pieces.push('property=' + (getField(form, 'property_type') || 'not provided'));
    pieces.push('address=' + (propertyAddress(form) || 'not provided'));
  }
  if (type === 'buyer') {
    pieces.push('review_path=' + (getField(form, 'review_path') || 'not provided'));
    pieces.push('cash_buyer=' + (getField(form, 'cash_buyer') || 'not provided'));
    pieces.push('purchase_plan=' + (getField(form, 'purchase_plan') || 'not provided'));
    pieces.push('credit_score_range=' + (getField(form, 'credit_score_range') || 'not provided'));
    pieces.push('property_type=' + (getField(form, 'property_type') || 'not provided'));
  }
  if (type === 'management') {
    pieces.push('units=' + (getField(form, 'units') || 'not provided'));
    pieces.push('occupancy=' + (getField(form, 'occupancy') || 'not provided'));
    pieces.push('monthly_revenue=' + (getField(form, 'monthly_revenue') || 'not provided'));
  }
  return pieces.join(' | ');
}

async function saveLeadToDashboard(form) {
  const db = await loadDb();
  const type = detectFormType(form);
  let result;

  if (type === 'seller') result = await db.from('seller_leads').insert(sellerRow(form));
  if (type === 'buyer') result = await db.from('buyer_leads').insert(buyerRow(form));
  if (type === 'trust') result = await db.from('trust_cases').insert(trustCaseRow(form));
  if (type === 'management') result = await db.from('phone_leads').insert(phoneLeadRow(form, 'Property management website request', 'Property Management Department'));
  if (type === 'contact') result = await db.from('phone_leads').insert(phoneLeadRow(form, 'Website contact or feedback request', 'Communications Department'));

  if (result && result.error) throw result.error;
  return type;
}

function trackFamilyFirstReport(reportType, summary) {
  loadDb()
    .then((db) =>
      db.from('reports').insert({
        company: 'Family First Equity Group',
        report_type: reportType,
        report_summary: summary,
        sent_to_titancore: true,
        status: 'active_live'
      })
    )
    .catch((err) => console.warn('Family First report tracking issue:', err));
}

trackFamilyFirstReport('Website Page View', 'Page: ' + window.location.pathname + ' | Title: ' + document.title + ' | Referrer: ' + (document.referrer || 'direct'));

document.querySelectorAll('form[data-netlify="true"]').forEach((form) => {
  form.addEventListener('submit', async (e) => {
    if (form.dataset.dashboardSaved === 'yes') return;
    e.preventDefault();

    const button = form.querySelector('button[type="submit"]');
    const originalText = button ? button.textContent : '';
    let type = detectFormType(form);

    try {
      if (button) {
        button.disabled = true;
        button.textContent = 'Saving request...';
      }
      type = await saveLeadToDashboard(form);
      trackFamilyFirstReport('Lead Submitted', 'Lead type: ' + type + ' | Form: ' + (form.getAttribute('name') || 'unknown') + ' | Page: ' + window.location.pathname + ' | ' + leadQualitySummary(form, type));
    } catch (err) {
      console.warn('Dashboard lead save issue:', err);
      trackFamilyFirstReport('Lead Save Needs Review', 'Form still submitted through Netlify. Lead type: ' + type + ' | Form: ' + (form.getAttribute('name') || 'unknown') + ' | Page: ' + window.location.pathname + ' | ' + leadQualitySummary(form, type));
    } finally {
      form.dataset.dashboardSaved = 'yes';
      if (button) button.textContent = 'Submitting...';
      HTMLFormElement.prototype.submit.call(form);
      if (button) {
        setTimeout(() => {
          button.disabled = false;
          button.textContent = originalText;
        }, 3000);
      }
    }
  });
});

document.querySelectorAll('a.button, button.button, .site-nav a, .listing-card button').forEach((item) => {
  item.addEventListener('click', () => {
    const label = (item.textContent || item.getAttribute('aria-label') || 'unknown click').trim().replace(/\s+/g, ' ');
    const target = item.getAttribute('href') || item.dataset.target || 'button-only';
    trackFamilyFirstReport('Website Button Click', 'Clicked: ' + label + ' | Target: ' + target + ' | Page: ' + window.location.pathname);
  });
});
