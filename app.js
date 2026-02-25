function encode(data) {
  return new URLSearchParams(data).toString();
}

function setInvestorMode(form, isInvestor) {
  const inv = form.querySelector('[data-investor]');
  const non = form.querySelector('[data-noninvestor]');
  if (!inv || !non) return;
  inv.classList.toggle('hidden', !isInvestor);
  non.classList.toggle('hidden', isInvestor);
}

document.addEventListener('DOMContentLoaded', () => {
  document.querySelectorAll('form[data-ff]').forEach((form) => {
    // toggle sections
    const radios = form.querySelectorAll('input[name="is_investor"]');
    radios.forEach(r => {
      r.addEventListener('change', () => {
        setInvestorMode(form, r.value === 'Yes');
      });
    });

    // default view
    const checked = form.querySelector('input[name="is_investor"]:checked');
    if (checked) setInvestorMode(form, checked.value === 'Yes');

    form.addEventListener('submit', async (e) => {
      e.preventDefault();

      const btn = form.querySelector('button[type="submit"]');
      const errorBox = form.querySelector('.errorBox');
      const thanks = document.getElementById('thanks');
      if (errorBox) errorBox.classList.add('hidden');
      if (btn) { btn.disabled = true; btn.textContent = 'Submitting...'; }

      try {
        const formData = new FormData(form);
        // IMPORTANT: Netlify needs form-name in the payload
        const payload = {};
        formData.forEach((v, k) => payload[k] = v);

        const res = await fetch('/', {
          method: 'POST',
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
          body: encode(payload)
        });

        if (!res.ok) throw new Error('Network/submit error');

        // Show thank you inside same page
        form.classList.add('hidden');
        if (thanks) thanks.classList.remove('hidden');

        // scroll to top of thank you
        window.scrollTo({ top: 0, behavior: 'smooth' });

      } catch (err) {
        if (errorBox) errorBox.classList.remove('hidden');
        if (btn) { btn.disabled = false; btn.textContent = 'Submit'; }
      }
    });
  });
});
