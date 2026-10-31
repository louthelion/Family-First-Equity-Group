(async function () {
 const status = document.getElementById('archive-status');
 const weeksBox = document.getElementById('archive-weeks');
 const titleBox = document.getElementById('archive-month-title');
 const listBox = document.getElementById('archive-month-list');
 const prevBtn = document.getElementById('archive-prev');
 const nextBtn = document.getElementById('archive-next');
 if (!status || !weeksBox || !titleBox) return;
 // Same allowlist discipline as news.js: only publisher hosts render.
 const ALLOWED_HOSTS = ['www.mortgagenewsdaily.com','mortgagenewsdaily.com','www.federalreserve.gov','federalreserve.gov','www.realtor.com','realtor.com','www.census.gov','census.gov','eyeonhousing.org','www.eyeonhousing.org'];
 const el = (tag, cls, text) => { const n = document.createElement(tag); if (cls) n.className = cls; if (text != null) n.textContent = text; return n; };
 const monthName = key => { const d = new Date(key + '-01T12:00:00Z'); return d.toLocaleDateString(undefined,{month:'long',year:'numeric',timeZone:'UTC'}); };
 const dayLabel = ts => new Date(ts).toLocaleDateString(undefined,{month:'short',day:'numeric'});
 const weekLabel = ts => { const d = new Date(ts); d.setDate(d.getDate() - ((d.getDay() + 6) % 7)); return 'Week of ' + d.toLocaleDateString(undefined,{month:'long',day:'numeric',year:'numeric'}); };
 const requested = new URLSearchParams(location.search).get('month') || '';
 try {
  const response = await fetch('/.netlify/functions/ffeg-news-archive' + (requested ? '?month=' + encodeURIComponent(requested) : ''), {headers:{Accept:'application/json'}});
  if (!response.ok) throw new Error('Archive unavailable');
  const data = await response.json();
  const records = (Array.isArray(data.records) ? data.records : []).filter(r => {
   if (!r || !r.title || !r.url) return false;
   let url; try { url = new URL(r.url); } catch { return false; }
   return url.protocol === 'https:' && ALLOWED_HOSTS.includes(url.hostname) && Number.isFinite(Date.parse(r.publishedAt));
  }).sort((a,b) => Date.parse(b.publishedAt) - Date.parse(a.publishedAt));
  titleBox.textContent = monthName(data.month);
  // Month navigation.
  const months = Array.isArray(data.months) && data.months.length ? data.months : [data.month];
  const idx = months.indexOf(data.month);
  if (listBox) for (const m of months) {
   const a = el('a','archive-month-link', monthName(m));
   a.href = 'news-archive.html?month=' + m;
   if (m === data.month) a.setAttribute('aria-current','true');
   listBox.append(a, document.createTextNode(' '));
  }
  if (prevBtn && idx > 0) { prevBtn.href = 'news-archive.html?month=' + months[idx-1]; prevBtn.hidden = false; }
  if (nextBtn && idx >= 0 && idx < months.length - 1) { nextBtn.href = 'news-archive.html?month=' + months[idx+1]; nextBtn.hidden = false; }
  if (!records.length) {
   status.textContent = 'No headlines have been archived for this month yet. The archive collects new headlines every few hours — check back soon, or read today\u2019s news.';
   return;
  }
  status.textContent = records.length + (records.length === 1 ? ' headline' : ' headlines') + ' archived for ' + monthName(data.month) + '.';
  // Group by week, newest week first, rows newest first inside each week.
  const groups = new Map();
  for (const r of records) { const label = weekLabel(r.publishedAt); if (!groups.has(label)) groups.set(label, []); groups.get(label).push(r); }
  for (const [label, rows] of groups) {
   const batch = el('div','archive-batch');
   batch.append(el('h3', null, label));
   for (const r of rows) {
    const row = el('a','headline-row');
    let url; try { url = new URL(r.url); } catch { continue; }
    row.href = url.href; row.target = '_blank'; row.rel = 'noopener noreferrer';
    row.append(el('time', null, dayLabel(r.publishedAt)), el('span','hl', r.title), el('span','source-chip', r.source || ''));
    batch.append(row);
   }
   weeksBox.append(batch);
  }
 } catch (_) {
  status.textContent = 'The archive is temporarily unavailable. Today\u2019s headlines are on the News page.';
 }
})();
