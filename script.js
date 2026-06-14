const toggle=document.querySelector('.menu-toggle');const nav=document.querySelector('.site-nav');const footerSocial=document.querySelector('.footer-social .social-links');if(nav&&footerSocial){const mobileSocial=document.createElement('div');mobileSocial.className='mobile-social';mobileSocial.innerHTML='<p class="mobile-social-title">Follow Family First Equity Group</p>';const mobileLinks=footerSocial.cloneNode(true);mobileLinks.setAttribute('aria-label','Family First Equity Group social media');mobileSocial.appendChild(mobileLinks);nav.appendChild(mobileSocial)}if(toggle&&nav){toggle.addEventListener('click',()=>{const open=nav.classList.toggle('open');toggle.setAttribute('aria-expanded',String(open));toggle.setAttribute('aria-label',open?'Close menu':'Open menu');document.body.classList.toggle('nav-open',open)});nav.querySelectorAll('a:not([href="#"])').forEach(a=>a.addEventListener('click',()=>{nav.classList.remove('open');toggle.setAttribute('aria-expanded','false');toggle.setAttribute('aria-label','Open menu');document.body.classList.remove('nav-open')}))}document.querySelectorAll('.social-links a[href="#"]').forEach(a=>a.addEventListener('click',event=>event.preventDefault()));document.querySelectorAll('[data-year]').forEach(el=>el.textContent=new Date().getFullYear());

const learningSearch = document.querySelector('[data-learning-search]');
const learningCards = [...document.querySelectorAll('[data-lesson-card]')];
const learningFilters = [...document.querySelectorAll('[data-learning-filter]')];
if (learningSearch && learningCards.length) {
  let activeLearningCategory = 'all';
  const updateLearningLibrary = () => {
    const query = learningSearch.value.trim().toLowerCase();
    let visible = 0;
    learningCards.forEach((card) => {
      const categoryMatch = activeLearningCategory === 'all' || card.dataset.category === activeLearningCategory;
      const searchMatch = !query || card.dataset.search.includes(query);
      card.hidden = !(categoryMatch && searchMatch);
      if (!card.hidden) visible += 1;
    });
    const results = document.querySelector('#learning-results');
    const empty = document.querySelector('[data-learning-empty]');
    if (results) results.textContent = `Showing ${visible} ${visible === 1 ? 'lesson' : 'lessons'}.`;
    if (empty) empty.hidden = visible !== 0;
  };
  learningSearch.addEventListener('input', updateLearningLibrary);
  learningFilters.forEach((filter) => filter.addEventListener('click', () => {
    activeLearningCategory = filter.dataset.learningFilter;
    learningFilters.forEach((item) => item.classList.toggle('is-active', item === filter));
    updateLearningLibrary();
  }));
}
