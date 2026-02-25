function encode(data) {
  return Object.keys(data)
    .map((key) => encodeURIComponent(key) + "=" + encodeURIComponent(data[key]))
    .join("&");
}

function hookForms() {
  const forms = document.querySelectorAll("form[data-netlify='true']");
  forms.forEach((form) => {
    form.addEventListener("submit", async (e) => {
      e.preventDefault();

      const btn = form.querySelector("button[type='submit']");
      if (btn) {
        btn.disabled = true;
        btn.textContent = "Submitting...";
      }

      const thanks = form.querySelector(".thanks");
      const formData = new FormData(form);
      const data = {};
      formData.forEach((v, k) => (data[k] = v));

      try {
        // Netlify Forms POST endpoint is the SAME site root
        const res = await fetch("/", {
          method: "POST",
          headers: { "Content-Type": "application/x-www-form-urlencoded" },
          body: encode(data),
        });

        if (!res.ok) throw new Error("Netlify rejected submission");

        // Show thank you (inside the form page)
        form.querySelectorAll(".fieldBlock, .submitBtn").forEach(el => el.style.display = "none");
        if (thanks) {
          thanks.style.display = "block";
          thanks.scrollIntoView({ behavior: "smooth", block: "start" });
        }
        form.reset();
      } catch (err) {
        alert("Something went wrong sending the form. Please try again.");
        if (btn) {
          btn.disabled = false;
          btn.textContent = "Submit";
        }
      }
    });
  });
}

document.addEventListener("DOMContentLoaded", hookForms);
