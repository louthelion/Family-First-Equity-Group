(async function () {
 const status = document.getElementById('news-status');
 const front = document.getElementById('news-front');
 const leadBox = document.getElementById('news-lead');
 const railBox = document.getElementById('news-rail-rows');
 const fallback = document.getElementById('news-fallback');
 if (!status || !leadBox || !railBox) return;
 // Browser-side allowlist — MUST match the hosts in
 // netlify/functions/ffeg-news-feeds.mjs or items are silently dropped.
 const ALLOWED_HOSTS = ['www.mortgagenewsdaily.com','mortgagenewsdaily.com','www.federalreserve.gov','federalreserve.gov','www.realtor.com','realtor.com','www.census.gov','census.gov','eyeonhousing.org','www.eyeonhousing.org'];
 const SECTION_LABELS = {rates:'Interest Rates',market:'The Housing Market',economy:'Real Estate Economy'};
 const SECTION_BOXES = {rates:document.getElementById('news-rates'),market:document.getElementById('news-market'),economy:document.getElementById('news-economy')};
 const clean = item => {
  if (!item || !item.title || !item.url) return null;
  let url; try { url = new URL(item.url); } catch { return null; }
  if (url.protocol !== 'https:' || !ALLOWED_HOSTS.includes(url.hostname)) return null;
  const when = Date.parse(item.publishedAt);
  if (!Number.isFinite(when)) return null;
  return {title:String(item.title), teaser:String(item.teaser||''), url:url.href, source:String(item.source||''), section:SECTION_LABELS[item.section] ? item.section : 'market', when};
 };
 const fullDate = ts => new Date(ts).toLocaleDateString(undefined,{weekday:'long',year:'numeric',month:'long',day:'numeric'});
 const shortDate = ts => new Date(ts).toLocaleDateString(undefined,{month:'short',day:'numeric'});
 const relative = ts => {
  const diff = Date.now() - ts, hours = Math.floor(diff/3600000);
  if (hours < 1) return 'Just now';
  if (hours < 24) return hours + 'h ago';
  const days = Math.floor(hours/24);
  if (days === 1) return 'Yesterday';
  if (days < 7) return days + ' days ago';
  return shortDate(ts);
 };
 const el = (tag, cls, text) => { const n = document.createElement(tag); if (cls) n.className = cls; if (text != null) n.textContent = text; return n; };
 const sourceLink = (item, text) => { const a = el('a', null, text); a.href = item.url; a.target = '_blank'; a.rel = 'noopener noreferrer'; return a; };
 try {
  const response = await fetch('/.netlify/functions/ffeg-market-news', {headers:{Accept:'application/json'}});
  if (!response.ok) throw new Error('Feed unavailable');
  const data = await response.json();
  const items = (Array.isArray(data.items) ? data.items : []).map(clean).filter(Boolean)
   .sort((a,b) => b.when - a.when);
  if (!items.length) throw new Error('No current feed items');
  // Lead story: newest overall, excluded from its section list.
  const lead = items[0];
  const flag = el('span','news-flag', SECTION_LABELS[lead.section]);
  const h2 = el('h2'); h2.append(sourceLink(lead, lead.title));
  leadBox.append(flag, h2);
  if (lead.teaser) leadBox.append(el('p','teaser', lead.teaser));
  const meta = el('p','meta', lead.source + ' · ' + fullDate(lead.when) + ' · ');
  meta.append(sourceLink(lead, 'Read at the source →'));
  leadBox.append(meta);
  // Latest Headlines rail: next 8 newest.
  for (const item of items.slice(1, 9)) {
   const row = sourceLink(item); row.className = 'headline-row';
   const hl = el('span','hl', item.title);
   row.append(el('time', null, relative(item.when)), hl, el('span','source-chip', item.source));
   railBox.append(row);
  }
  if (front) front.hidden = false;
  // Section blocks: compact rows, lead excluded, cap 6.
  for (const key of Object.keys(SECTION_BOXES)) {
   const box = SECTION_BOXES[key]; if (!box) continue;
   box.replaceChildren();
   const rows = items.filter(i => i.section === key && i !== lead).slice(0, 6);
   if (!rows.length) { box.append(el('p','news-empty','No stories from this section right now — check the latest headlines above.')); continue; }
   for (const item of rows) {
    const art = el('article','news-item');
    art.append(el('p','meta', fullDate(item.when)));
    const h3 = el('h3'); h3.append(sourceLink(item, item.title)); art.append(h3);
    if (item.teaser) art.append(el('p','teaser', item.teaser));
    art.append(el('p','meta', item.source));
    box.append(art);
   }
  }
  // UPDATED TODAY chip when the newest story is under 24h old.
  if (Date.now() - lead.when < 86400000) {
   const chip = document.getElementById('news-updated-chip');
   if (chip) chip.hidden = false;
  }
  status.textContent = 'Latest update checked ' + new Date(data.fetchedAt).toLocaleString() + ' · Sources: Mortgage News Daily, Realtor.com Research, NAHB, Federal Reserve, U.S. Census Bureau' + (Array.isArray(data.failedSources) && data.failedSources.length ? ' · Some sources are unavailable right now; available stories are shown.' : '');
 } catch (_) {
  if (front) front.hidden = true;
  for (const key of Object.keys(SECTION_BOXES)) { const box = SECTION_BOXES[key]; if (box) box.replaceChildren(); }
  if (fallback) fallback.hidden = false;
  status.textContent = 'Live headlines are temporarily unavailable. Use the original source links below, or explore our investment guides.';
 }
})();
