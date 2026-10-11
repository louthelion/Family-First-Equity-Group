const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.join(__dirname, '..');
const page = fs.readFileSync(path.join(root, 'seller-request.html'), 'utf8');
const home = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
const backend = fs.readFileSync(path.join(root, 'netlify/functions/submission-created.js'), 'utf8');

test('seller's primary first-step form is a native Netlify form', () => {
  assert.match(page, /<form name="Family-First-Quick-Seller-Request" method="POST" data-netlify="true"/);
  assert.match(page, /netlify-honeypot="bot-field"/);
  for (const name of ['name','phone','property_address','city','state','consent']) {
    assert.match(page, new RegExp('name="' + name + '"[^>]*required'));
  }
});
test('homepage seller links use short intake and detailed form remains available', () => {
  assert.ok((home.match(/seller-request\.html/g) || []).length >= 3);
  assert.match(page, /href="seller-intake.html"/);
});
test('secure CRM receives quick seller form without changing existing contact route', () => {
  assert.match(backend, /formName === 'family-first-quick-seller-request'/);
  assert.match(backend, /deliverContactToCrm\(payload, data, 'Family-First-Quick-Seller-Request', 'seller'\)/);
  assert.match(backend, /formName === 'family-first-contact'/);
  assert.match(backend, /'seller_leads' : 'phone_leads'/);
});
