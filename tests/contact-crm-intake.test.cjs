const test = require('node:test');
const assert = require('node:assert/strict');
const source = require('node:fs').readFileSync(require('node:path').join(__dirname, '../netlify/functions/submission-created.js'), 'utf8');

test('general contact route exists and uses verified intake procedure', () => {
  assert.match(source, /deliverContactToCrm/);
  assert.match(source, /ffeg_ingest_verified_website_inquiry/);
  assert.match(source, /p_type: 'contact'/);
});
test('existing seller and field-representative routes are preserved', () => {
  assert.match(source, /formName.includes\('seller'\)/);
  assert.match(source, /formName.includes\('field-representative'\)/);
});
test('contact delivery fails closed and does not expose submitted details', () => {
  assert.match(source, /statusCode: 503/);
  assert.match(source, /statusCode: 502/);
  assert.match(source, /Submission saved by website/);
});
