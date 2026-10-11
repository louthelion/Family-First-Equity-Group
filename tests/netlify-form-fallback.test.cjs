const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const path = require('node:path');

const file = fs.readFileSync(path.join(__dirname, '../script.js'), 'utf8');
const marker = 'document.querySelectorAll(\'form[data-netlify="true"]\').forEach';
const handlerSource = file.slice(file.lastIndexOf(marker));

async function attempt(directWorks, nativeWorks = true) {
  let handleSubmit, nativeCalls = 0;
  const messages = [];
  const button = {disabled: false, textContent: 'Submit'};
  const form = {
    dataset: {},
    querySelector: () => button,
    addEventListener(name, callback) {if (name === 'submit') handleSubmit = callback;}
  };
  function FakeForm(){}
  FakeForm.prototype.submit = function() {
    if (!nativeWorks) throw new Error('Synthetic native error');
    nativeCalls++;
  };
  vm.runInNewContext(handlerSource, {
    document: {querySelectorAll: () => [form]},
    HTMLFormElement: FakeForm,
    send: async () => directWorks ? {message: 'Sent'} : Promise.reject(Error('Synthetic endpoint down')),
    show: (f, text, kind) => messages.push({text, kind}),
    setTimeout: callback => callback(),
    console: {warn(){}, error(){}}
  });
  await handleSubmit({preventDefault(){}});
  return {nativeCalls, messages, dataset: form.dataset, button};
}

test('native form submits when direct CRM fails', async () => {
  const result = await attempt(false);
  assert.equal(result.nativeCalls, 1);
  assert.match(result.messages.at(-1).text, /website form instead/i);
});
test('successful direct CRM also retains Netlify form copy', async () => {
  const result = await attempt(true);
  assert.equal(result.nativeCalls, 1);
  assert.equal(result.dataset.dashboardSaved, 'yes');
});
test('native submission failure remains visible and retryable', async () => {
  const result = await attempt(false, false);
  assert.equal(result.nativeCalls, 0);
  assert.equal(result.dataset.leadSubmitting, 'no');
  assert.equal(result.button.disabled, false);
  assert.equal(result.messages.at(-1).kind, 'error');
});
