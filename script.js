const CENTRAL_LINE_DISPLAY = "(800) 827-9016";
const CENTRAL_LINE_TEL = "+18008279016";
const COMPANY_EMAIL = "contact@familyfirstequitygroup.com";

document.addEventListener("DOMContentLoaded", () => {
  document.querySelectorAll("[data-phone]").forEach((link) => {
    link.textContent = CENTRAL_LINE_DISPLAY;
    link.href = `tel:${CENTRAL_LINE_TEL}`;
  });
  document.querySelectorAll("[data-email]").forEach((link) => {
    link.textContent = COMPANY_EMAIL;
    link.href = `mailto:${COMPANY_EMAIL}`;
  });
  document.querySelectorAll("[data-year]").forEach((node) => {
    node.textContent = new Date().getFullYear();
  });

  const toggle = document.querySelector(".menu-toggle");
  const nav = document.querySelector(".site-nav");
  if (toggle && nav) {
    toggle.addEventListener("click", () => {
      const isOpen = nav.classList.toggle("open");
      toggle.setAttribute("aria-expanded", String(isOpen));
    });
  }
});
