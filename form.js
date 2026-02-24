/* form.js — Inline THANK YOU (no redirect) + Netlify-friendly submit
   Works when your page has:
   - <form data-netlify="true" ...>
   - <div id="formPanel"> ...form... </div>
   - <div id="thanks" style="display:none"> ...thank you... </div>
*/

(function () {
  // Run after HTML loads
  document.addEventListener("DOMContentLoaded", () => {
    const form = document.querySelector("form[data-netlify='true']") || document.querySelector("form");
    const thanks = document.getElementById("thanks");
    const formPanel = document.getElementById("formPanel");

    // If form.js is not connected, nothing happens — so we add a console message for testing.
    console.log("[form.js] loaded");

    if (!form) {
      console.warn("[form.js] No <form> found on this page.");
      return;
    }

    // Stop any redirect behavior
    // (Netlify can redirect if action points to a missing page)
    if (!form.getAttribute("action")) {
      form.setAttribute("action", "/");
    }

    // Helper: show thank-you inside the same page
    function showThanks() {
      if (formPanel) formPanel.style.display = "none";
      if (thanks) {
        thanks.style.display = "block";
        // scroll to top so user sees it immediately
        window.scrollTo({ top: 0, behavior: "smooth" });
      } else {
        alert("Thank you! We received your submission.");
      }
    }

    // Netlify-style encode
    function encode(data) {
      return Object.keys(data)
        .map((key) => encodeURIComponent(key) + "=" + encodeURIComponent(data[key]))
        .join("&");
    }

    form.addEventListener("submit", async (e) => {
      e.preventDefault();

      // Quick validation: Netlify needs all fields to have name=""
      const bad = [...form.querySelectorAll("input, select, textarea")]
        .filter((el) => el.hasAttribute("required"))
        .some((el) => !String(el.value || "").trim());

      if (bad) {
        alert("Please fill out all required fields.");
        return;
      }

      // Build payload
      const formData = new FormData(form);
      const payload = {};
      formData.forEach((value, key) => (payload[key] = value));

      // Netlify requires form-name
      const formName =
        form.getAttribute("name") ||
        payload["form-name"] ||
        "netlify-form";

      payload["form-name"] = formName;

      try {
        // POST to same origin (Netlify captures it)
        const res = await fetch("/", {
          method: "POST",
          headers: { "Content-Type": "application/x-www-form-urlencoded" },
          body: encode(payload),
        });

        if (!res.ok) {
          console.error("[form.js] submit failed:", res.status);
          alert("Something went wrong sending the form. Please try again.");
          return;
        }

        // Success → show inline thanks
        showThanks();
        form.reset();
      } catch (err) {
        console.error("[form.js] submit error:", err);
        alert("Something went wrong sending the form. Please try again.");
      }
    });
  });
})();
