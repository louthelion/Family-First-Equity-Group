(() => {
  const ENDPOINT = 'https://idyllic-brioche-a7ac83.netlify.app/.netlify/functions/ffeg-titancore-chatgpt-lead-sender';

  function field(form, name) {
    const input = form.elements[name];
    if (!input) return '';
    if (typeof RadioNodeList !== 'undefined' && input instanceof RadioNodeList) {
      return Array.from(input)
        .filter((item) => item.checked || item.selected)
        .map((item) => item.value)
        .filter(Boolean)
        .join(', ');
    }
    return input.value || '';
  }

  function fullName(form) {
    return (field(form, 'first_name') + ' ' + field(form, 'last_name')).trim() || field(form, 'full_name') || field(form, 'name');
  }

  function address(form, leadType) {
    const values = [
      field(form, 'property_address'),
      field(form, 'address'),
      field(form, 'location_interest'),
      field(form, 'city') || field(form, 'preferred_city'),
      field(form, 'state') || field(form, 'preferred_state'),
      field(form, 'zip_code') || field(form, 'zip') || field(form, 'preferred_zip_area')
    ].filter(Boolean);

    const unique = values.filter((value, index) => values.indexOf(value) === index);
    return leadType === 'buyer' ? unique.join(' | ') : unique.join(', ');
  }

  function notes(form) {
    const lines = [];
    new FormData(form).forEach((value, key) => {
      if (key === 'bot-field' || key === 'form-name') return;
      if (value instanceof File) {
        if (value.name) lines.push(key + ': ' + value.name);
        return;
      }
      lines.push(key + ': ' + value);
    });
    return lines.join('\n');
  }

  function leadType(form) {
    const name = (form.getAttribute('name') || '').toLowerCase();
    const path = window.location.pathname.toLowerCase();
    const reviewPath = field(form, 'review_path').toLowerCase();

    if (name.includes('seller') || path.includes('seller-intake') || reviewPath.includes('seller') || reviewPath.includes('disposition')) {
      return 'seller';
    }

    if (name.includes('property-review') && (reviewPath.includes('buyer') || reviewPath.includes('acquisition'))) {
      return 'buyer';
    }

    return '';
  }

  function statusElement(form) {
    let status = form.querySelector('[data-endpoint-submit-status]');
    if (status) return status;

    status = document.createElement('p');
    status.setAttribute('data-endpoint-submit-status', '');
    status.setAttribute('aria-live', 'polite');
    status.className = 'form-note';
    status.style.fontWeight = '700';
    status.style.marginTop = '1rem';

    const button = form.querySelector('button[type="submit"]');
    if (button) button.insertAdjacentElement('afterend', status);
    else form.appendChild(status);
    return status;
  }

  function showStatus(form, message, isError) {
    const status = statusElement(form);
    status.textContent = message;
    status.setAttribute('role', isError ? 'alert' : 'status');
    status.style.color = isError ? '#b91c1c' : '#087457';
  }

  async function postLead(form, type) {
    const payload = {
      lead_type: type,
      full_name: fullName(form),
      phone: field(form, 'phone'),
      email: field(form, 'email'),
      property_address: address(form, type),
      property_type: field(form, 'property_type') || field(form, 'buyer_property_interest') || field(form, 'investment_type') || 'Unknown',
      notes: notes(form)
    };

    const response = await fetch(ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    });

    const raw = await response.text();
    let data = null;
    try {
      data = raw ? JSON.parse(raw) : null;
    } catch (_) {
      data = null;
    }

    if (!response.ok || !data || data.ok !== true) {
      throw new Error(raw || ('HTTP ' + response.status + ' ' + response.statusText));
    }

    return data;
  }

  document.addEventListener('submit', async (event) => {
    const form = event.target;
    if (!(form instanceof HTMLFormElement)) return;

    const type = leadType(form);
    if (type !== 'seller' && type !== 'buyer') return;

    event.preventDefault();
    event.stopImmediatePropagation();

    if (form.dataset.endpointSubmitting === 'yes') return;
    form.dataset.endpointSubmitting = 'yes';

    const button = form.querySelector('button[type="submit"]');
    const originalText = button ? button.textContent : '';

    try {
      if (button) {
        button.disabled = true;
        button.textContent = 'Sending request...';
      }
      showStatus(form, 'Sending your information securely...', false);
      const result = await postLead(form, type);
      showStatus(form, result.message || 'Thank you. Your information was submitted successfully.', false);
      if (button) button.textContent = 'Submitted successfully';

      window.setTimeout(() => {
        HTMLFormElement.prototype.submit.call(form);
      }, 700);
    } catch (error) {
      const exactError = error && error.message ? error.message : String(error);
      showStatus(form, 'Submission failed: ' + exactError, true);
      console.error('Family First Seller/Buyer submission failed:', error);
      form.dataset.endpointSubmitting = 'no';
      if (button) {
        button.disabled = false;
        button.textContent = originalText;
      }
    }
  }, true);
})();
