const FFEG_PUBLIC_PHONE_DISPLAY='(407) 537-0535';
const FFEG_PUBLIC_PHONE_TEL='+14075370535';
const FFEG_OLD_PHONE_TEL='+18008279016';
const FFEG_OLD_PHONE_PATTERNS=[
  /\(800\)\s*827-9016/g,
  /800[-.\s]*827[-.\s]*9016/g,
  /1[-.\s]*800[-.\s]*827[-.\s]*9016/g,
  /\+1\s*800\s*827\s*9016/g
];

function normalizeFamilyFirstPublicPhone(){
  document.querySelectorAll('a[href^="tel:"]').forEach(link=>{
    const href=(link.getAttribute('href')||'').replace(/[^+\d]/g,'');
    const text=(link.textContent||'').trim();
    if(href===FFEG_OLD_PHONE_TEL||/800\D*827\D*9016/.test(text)){
      link.setAttribute('href',`tel:${FFEG_PUBLIC_PHONE_TEL}`);
      link.textContent=FFEG_PUBLIC_PHONE_DISPLAY;
    }
  });
  const walker=document.createTreeWalker(document.body,NodeFilter.SHOW_TEXT);
  const nodes=[];
  while(walker.nextNode())nodes.push(walker.currentNode);
  nodes.forEach(node=>{
    let next=node.nodeValue||'';
    FFEG_OLD_PHONE_PATTERNS.forEach(pattern=>{next=next.replace(pattern,FFEG_PUBLIC_PHONE_DISPLAY)});
    if(next!==node.nodeValue)node.nodeValue=next;
  });
}

function addFieldInterestNavigation(){
  const nav=document.querySelector('.site-nav');
  if(nav&&!nav.querySelector('a[href="field-representative-interest.html"]')){
    const link=document.createElement('a');
    link.href='field-representative-interest.html';
    link.textContent='Field Opportunities';
    const contact=Array.from(nav.querySelectorAll('a')).find(item=>/contact/i.test(item.textContent||''));
    if(contact)nav.insertBefore(link,contact);else nav.appendChild(link);
  }
  document.querySelectorAll('.footer-links').forEach(group=>{
    if(/resources|explore/i.test(group.querySelector('h2')?.textContent||'')&&!group.querySelector('a[href="field-representative-interest.html"]')){
      const link=document.createElement('a');
      link.href='field-representative-interest.html';
      link.textContent='Field Opportunities';
      group.appendChild(link);
    }
  });
}

function addHomeFieldInterestCard(){
  if(!document.body.classList.contains('home'))return;
  const grid=document.querySelector('.service-path-grid');
  if(grid&&!grid.querySelector('[data-field-interest-card]')){
    const card=document.createElement('article');
    card.className='service-path-card';
    card.setAttribute('data-field-interest-card','');
    card.innerHTML='<span class="service-number">07</span><h3>On-Demand Field Property Representatives</h3><p>Interested in occasional property visits for Family First? Join the field-interest pool for possible property photo, video, visible-condition, access, and basic site-review assignments when opportunities need an in-person visit.</p><a class="button green" href="field-representative-interest.html">Join Field Interest Pool</a>';
    grid.appendChild(card);
  }
  const heroButtons=document.querySelector('.hero .button-row');
  if(heroButtons&&!heroButtons.querySelector('[data-family-first-call]')){
    const call=document.createElement('a');
    call.className='button gold';
    call.href=`tel:${FFEG_PUBLIC_PHONE_TEL}`;
    call.setAttribute('data-family-first-call','');
    call.textContent=`Call ${FFEG_PUBLIC_PHONE_DISPLAY}`;
    heroButtons.appendChild(call);
  }
}

const toggle=document.querySelector('.menu-toggle');
const nav=document.querySelector('.site-nav');
const footerSocial=document.querySelector('.footer-social .social-links');
if(nav&&footerSocial){
  const mobile=document.createElement('div');
  mobile.className='mobile-social';
  mobile.innerHTML='<p class="mobile-social-title">Follow Family First Equity Group</p>';
  const links=footerSocial.cloneNode(true);
  links.setAttribute('aria-label','Family First Equity Group social media');
  mobile.appendChild(links);
  nav.appendChild(mobile);
}
if(toggle&&nav){
  toggle.addEventListener('click',()=>{
    const open=nav.classList.toggle('open');
    toggle.setAttribute('aria-expanded',String(open));
    toggle.setAttribute('aria-label',open?'Close menu':'Open menu');
    document.body.classList.toggle('nav-open',open);
  });
  nav.querySelectorAll('a:not([href="#"])').forEach(a=>a.addEventListener('click',()=>{
    nav.classList.remove('open');
    toggle.setAttribute('aria-expanded','false');
    toggle.setAttribute('aria-label','Open menu');
    document.body.classList.remove('nav-open');
  }));
}

document.querySelectorAll('[data-year]').forEach(el=>el.textContent=new Date().getFullYear());
document.querySelectorAll('[data-property-coming-soon]').forEach(button=>button.addEventListener('click',()=>alert('Property details are coming soon. No active property listing is available at this time.')));
document.querySelectorAll('[data-credit-help-select]').forEach(select=>{
  const message=select.closest('form')?.querySelector('[data-credit-help-message]');
  if(!message)return;
  const update=()=>message.hidden=select.value!=='Yes';
  select.addEventListener('change',update);
  update();
});

normalizeFamilyFirstPublicPhone();
addFieldInterestNavigation();
addHomeFieldInterestCard();

// A single submission handler: first store the complete form, including files,
// with this website's Netlify Forms. The server event performs the private bridge.
const FFEG_APPROVED_WEBSITE_SOURCES=new Set(['family_first_website','referral','facebook','instagram','linkedin','google','email_campaign']);
let intakeSource='family_first_website';
try {
 const requested=new URLSearchParams(location.search).get('source');
 if(FFEG_APPROVED_WEBSITE_SOURCES.has(requested))sessionStorage.setItem('ffegLeadSource',requested);
 const saved=sessionStorage.getItem('ffegLeadSource');
 if(FFEG_APPROVED_WEBSITE_SOURCES.has(saved))intakeSource=saved;
} catch {}
document.querySelectorAll('form[data-netlify="true"]').forEach(form=>{
 form.addEventListener('submit',async event=>{
  event.preventDefault();
  if(form.dataset.leadSubmitting==='yes'||!form.reportValidity())return;
  const button=form.querySelector('button[type="submit"]');
  const original=button?.textContent||'Submit';
  let status=form.querySelector('[data-lead-submit-status]');
  if(!status){status=document.createElement('p');status.dataset.leadSubmitStatus='';status.setAttribute('aria-live','polite');form.append(status)}
  const show=(message,error=false)=>{status.textContent=message;status.setAttribute('role',error?'alert':'status')};
  form.dataset.leadSubmitting='yes';
  try{
   const uuid=form.elements.submission_uuid;
   if(uuid&&!uuid.value)uuid.value=crypto.randomUUID();
   if(form.elements.source)form.elements.source.value=intakeSource;
   const payload=new FormData(form);
   payload.set('form-name',form.getAttribute('name'));
   const uploadBytes=Array.from(payload.values()).reduce((n,v)=>n+(v instanceof File?v.size:0),0);
   if(uploadBytes>7*1024*1024)throw new Error('Attachments must total less than 7 MB. Please send a link for larger videos.');
   if(button){button.disabled=true;button.textContent='Sending…'}
   show('Sending your inquiry…');
   const response=await fetch('/',{method:'POST',body:payload});
   if(!response.ok)throw new Error('Your inquiry could not be saved. Please try again.');
   show('Thank you. Your inquiry has been received for review. An appointment or transaction is not confirmed.');
   form.dataset.dashboardSaved='pending';
   if(button)button.textContent='Inquiry received';
  }catch(error){
   show(error.message||'Submission failed. Please try again.',true);
   form.dataset.leadSubmitting='no';
   if(button){button.disabled=false;button.textContent=original}
  }
 });
});
