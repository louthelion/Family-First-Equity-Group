// Shared constants (edit if needed)
const CENTRAL_LINE_DISPLAY = "(800) 827-9016";
const CENTRAL_LINE_TEL = "+18008279016";
const COMPANY_EMAIL = "contact@familyfirstequitygroup.com";

function wireContact(){
  const phone = document.querySelector("[data-phone]");
  const email = document.querySelector("[data-email]");
  const year = document.querySelector("[data-year]");
  if(phone){
    phone.textContent = CENTRAL_LINE_DISPLAY;
    phone.setAttribute("href", `tel:${CENTRAL_LINE_TEL}`);
  }
  if(email){
    email.textContent = COMPANY_EMAIL;
    email.setAttribute("href", `mailto:${COMPANY_EMAIL}`);
  }
  if(year) year.textContent = new Date().getFullYear();
}

document.addEventListener("DOMContentLoaded", wireContact);
