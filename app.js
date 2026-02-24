// app.js — universal (Index + Forms)
// Works with: Netlify forms + inline Thank You (no thank-you.html redirects)

(function () {
  // ---------- helpers ----------
  const $ = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));

  // Encode form data for Netlify POST
  function encodeFormData(form) {
    const data = new FormData(form);
    const params = new URLSearchParams();

    for (const [k, v] of data.entries()) {
      params.append(k, typeof v === "string" ? v : String(v));
    }
    return params.toString();
  }

  // Show inline thank you panel (inside page)
  function showThanks(form) {
    const thanks = $("#thanks") || $(".thanks");
    const wrap = $(".wrap") || document.body;

    // hide the form UI
    form.style.display = "none";

    // show thanks
    if (thanks) {
      thanks.style.display = "block";
      thanks.scrollIntoView({ behavior: "smooth", block: "start" });
    } else {
      // fallback message if thanks block is missing
      const div = document.createElement("div");
      div.className = "thanks";
      div.style.display = "block";
      div.innerHTML = `
        <div class="panel">
          <h2>Thank you.</h2>
          <p>We received your submission. Our team will contact you via email with next steps.</p>
        </div>
      `;
      wrap.prepend(div);
      div.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }

  // Button active state (works for your new gradient/multi-color too)
  function setActive(btn, groupSelector = ".btn") {
    const group = btn.closest(".btnGroup") || document;
    $$(groupSelector, group).forEach(b => b.classList.remove("active"));
    btn.classList.add("active");
  }

  // ---------- index page navigation (optional) ----------
  // Any button with data-go="somepage.html" will navigate
  $$(".btn[data-go]").forEach(btn => {
    btn.addEventListener("click", () => {
      setActive(btn);
      const go = btn.getAttribute("data-go");
      if (go) window.location.href = go;
    });
  });

  // ---------- show/hide sections inside a page (optional) ----------
  // Any button with data-show="#sectionId" will hide other .section and show that one
  $$(".btn[data-show]").forEach(btn => {
    btn.addEventListener("click", () => {
      setActive(btn);
      const target = btn.getAttribute("data-show");
      if (!target) return;

      $$(".section").forEach(s => (s.style.display = "none"));
      const el = $(target);
      if (el) {
        el.style.display = "block";
        el.scrollIntoView({ behavior: "smooth", block: "start" });
      }
    });
  });

  // ---------- Netlify form submit (IMPORTANT) ----------
  // This captures submission and shows THANK YOU inline, no redirect.
  $$("form").forEach(form => {
    form.addEventListener("submit", async (e) => {
      e.preventDefault();

      // disable submit button while sending
      const submitBtn = form.querySelector('button[type="submit"], input[type="submit"]');
      if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.dataset.originalText = submitBtn.innerText || submitBtn.value || "";
        if ("innerText" in submitBtn) submitBtn.innerText = "Submitting...";
        if ("value" in submitBtn) submitBtn.value = "Submitting...";
      }

      try {
        // Netlify requires a "name" attribute on form: <form name="..." data-netlify="true">
        // POST to same page path
        const body = encodeFormData(form);

        const res = await fetch(window.location.pathname, {
          method: "POST",
          headers: { "Content-Type": "application/x-www-form-urlencoded" },
          body
        });

        if (!res.ok) throw new Error("Network response not ok");

        showThanks(form);
      } catch (err) {
        alert("Something went wrong sending the form. Please try again.");
        console.error(err);
      } finally {
        if (submitBtn) {
          submitBtn.disabled = false;
          const t = submitBtn.dataset.originalText || "";
          if ("innerText" in submitBtn) submitBtn.innerText = t || "Submit";
          if ("value" in submitBtn) submitBtn.value = t || "Submit";
        }
      }
    });
  });

})();
