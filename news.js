(async function () {
 const status = document.getElementById('news-status');
 const grid = document.getElementById('news-items');
 if (!status || !grid) return;
 try {
  const response = await fetch('/.netlify/functions/ffeg-market-news', {headers:{Accept:'application/json'}});
  if (!response.ok) throw new Error('Feed unavailable');
  const data = await response.json();
  if (!Array.isArray(data.items) || !data.items.length) throw new Error('No current feed items');
  grid.replaceChildren();
  for (const item of data.items) {
   const url = new URL(item.url);
   if (url.protocol !== 'https:' || !['www.federalreserve.gov','www.census.gov','census.gov'].includes(url.hostname)) continue;
   const card = document.createElement('article');card.className='lane-card';
   const source = document.createElement('p');source.textContent = item.source;source.className='eyebrow';
   const title = document.createElement('h3');const link=document.createElement('a');link.textContent=item.title;link.href=url.href;link.target='_blank';link.rel='noopener noreferrer';title.append(link);
   const date = document.createElement('p');date.textContent=item.publishedAt ? 'Published '+new Date(item.publishedAt).toLocaleDateString() : 'Publication date not supplied by source';
   card.append(source,title,date);grid.append(card);
  }
  status.textContent='Source feeds checked '+new Date(data.fetchedAt).toLocaleString()+ (data.failedSources.length ? '. Some sources are unavailable; available stories are shown.' : '.');
 } catch (_) { status.textContent='Live headlines are temporarily unavailable. Use the original source links below, or explore our investment guides.'; }
})();