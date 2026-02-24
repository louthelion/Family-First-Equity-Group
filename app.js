/// Tabs + Netlify form submit (thank-you inside page)

function setActiveTab(groupId, showId){
  const group = document.querySelector(`[data-tabgroup="${groupId}"]`);
  if(!group) return;

  group.querySelectorAll(".tabbtn").forEach(btn=>{
    btn.classList.toggle("active", btn.dataset.show === showId);
  });

  group.querySelectorAll(".formwrap").forEach(w=>{
    w.classList.toggle("hidden", w.id !== showId);
  });
}

document.addEventListener("click", (e)=>{
  const btn = e.target.closest(".tabbtn");
  if(!btn) return;
  e.preventDefault();
  setActiveTab(btn.dataset.group, btn.dataset.show);
});

function encodeFormData(form){
  const data = new FormData(form);
  return new URLSearchParams(data).toString();
}

async function netlifySubmit(form){
  const submitBtn = form.querySelector('button[type="submit"]');
  const thanksBox = form.closest(".formwrap")?.querySelector(".thanks");
  const errorBox = form.closest(".formwrap")?.querySelector("[data-error]");

  if(errorBox) errorBox.textContent = "";

  submitBtn.disabled = true;
  const original = submitBtn.textContent;
  submitBtn.textContent = "Submitting...";

  try{
    const body = encodeFormData(form);

    const res = await fetch("/", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body
    });

    if(!res.ok) throw new Error("Submit failed");

    // Hide form + show thanks
    form.style.display = "none";
    if(thanksBox) thanksBox.classList.add("show");

  }catch(err){
    if(errorBox){
      errorBox.textContent = "Something went wrong sending the form. Please try again.";
    }else{
      alert("Something went wrong sending the form. Please try again.");
    }
    submitBtn.disabled = false;
    submitBtn.textContent = original;
  }
}

document.addEventListener("submit", (e)=>{
  const form = e.target;
  if(form.matches("form[data-netlify='true']")){
    e.preventDefault();
    netlifySubmit(form);
  }
});
