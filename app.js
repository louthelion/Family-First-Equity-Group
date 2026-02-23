// Netlify form submit + thank you INSIDE the same page (no thankyou.html)
async function netlifySubmit(form) {
  const data = new FormData(form);

  // Netlify needs a POST to "/"
  const res = await fetch("/", {
    method: "POST",
    body: data
  });

  if (!res.ok) throw new Error("Submit failed");
}

function wireForms() {
  const forms = document.querySelectorAll("form[data-netlify='true']");
  forms.forEach((form) => {
    form.addEventListener("submit", async (e) => {
      e.preventDefault();

      const thanks = document.getElementById("thanks");
      const formWrap = document.getElementById("formWrap");

      try {
        await netlifySubmit(form);
        if (formWrap) formWrap.style.display = "none";
        if (thanks) thanks.style.display = "block";
        form.reset();
        window.scrollTo({ top: 0, behavior: "smooth" });
      } catch (err) {
        alert("Something went wrong sending the form. Please try again.");
      }
    });
  });
}

document.addEventListener("DOMContentLoaded", wireForms);
