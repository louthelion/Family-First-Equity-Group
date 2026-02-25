(function () {
  function $(sel, root=document){ return root.querySelector(sel); }

  async function handleSubmit(form) {
    const btn = form.querySelector('[data-submit]');
    const thanks = document.getElementById('thanks');
    const errorBox = document.getElementById('errorBox');

    if (errorBox) errorBox.classList.add('hidden');
    if (btn) { btn.textContent = 'Submitting...'; btn.disabled = true; }

    try {
      const formData = new FormData(form);

      // Netlify requires posting to the current page path
      const resp = await fetch(form.getAttribute('action') || window.location.pathname, {
        method: 'POST',
        headers: { 'Accept': 'application/x-www-form-urlencoded;charset=UTF-8' },
        body: new URLSearchParams(formData).toString()
      });

      if (!resp.ok) throw new Error('Network response not OK');

      // Success → hide form, show thanks
      form.classList.add('hidden');
      if (thanks) {
        thanks.classList.remove('hidden');
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
    } catch (e) {
      if (errorBox) errorBox.classList.remove('hidden');
      if (btn) { btn.textContent = 'Submit'; btn.disabled = false; }
    }
  }

  window.addEventListener('DOMContentLoaded', () => {
    document.querySelectorAll('form[data-ff-netlify]').forEach(form => {
      form.addEventListener('submit', (ev) => {
        ev.preventDefault();
        handleSubmit(form);
      });
    });
  });
})();
