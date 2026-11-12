// Family First Equity Group — News archive.
//
// Same sharpened retention standard as the News page (owner,
// 2026-11-11): every item renders on this page as a FULL BRIEFING —
// headline, date, scope tag, its picture, and its whole body in our
// own words (paragraph by paragraph from the shared data file) — plus
// a plain-text source credit. Referral is by name only: no item is a
// link, no item carries an outbound door, and nothing fetches an
// outside feed; the archive renders from the shared data file
// (news-data.js), grouped by month and week.
(function () {
 var status = document.getElementById('archive-status');
 var weeksBox = document.getElementById('archive-weeks');
 var titleBox = document.getElementById('archive-month-title');
 var listBox = document.getElementById('archive-month-list');
 var prevBtn = document.getElementById('archive-prev');
 var nextBtn = document.getElementById('archive-next');
 if (!status || !weeksBox || !titleBox) return;
 var el = function (tag, cls, text) { var n = document.createElement(tag); if (cls) n.className = cls; if (text != null) n.textContent = text; return n; };
 var monthName = function (key) { var d = new Date(key + '-01T12:00:00Z'); return d.toLocaleDateString(undefined, { month: 'long', year: 'numeric', timeZone: 'UTC' }); };
 var weekLabel = function (iso) { var d = new Date(iso + 'T12:00:00Z'); d.setUTCDate(d.getUTCDate() - ((d.getUTCDay() + 6) % 7)); return 'Week of ' + d.toLocaleDateString(undefined, { month: 'long', day: 'numeric', year: 'numeric', timeZone: 'UTC' }); };
 var bodyParas = function (item) {
  if (Array.isArray(item.paragraphs) && item.paragraphs.length) return item.paragraphs;
  return item.summary ? [item.summary] : [];
 };
 var picture = function (item) {
  if (!item.image || !item.image.src) return null;
  var fig = el('figure', 'news-photo');
  var img = el('img');
  img.setAttribute('src', item.image.src);
  img.setAttribute('alt', item.image.alt || '');
  img.setAttribute('loading', 'lazy');
  fig.append(img);
  if (item.image.credit) fig.append(el('figcaption', 'meta', item.image.credit));
  return fig;
 };

 var items = (Array.isArray(window.FFEG_NEWS_ITEMS) ? window.FFEG_NEWS_ITEMS : [])
  .filter(function (r) { return r && r.title && r.credit && /^\d{4}-\d{2}-\d{2}$/.test(r.dateISO || '') && bodyParas(r).length; })
  .sort(function (a, b) { return String(b.dateISO).localeCompare(String(a.dateISO)); });

 var months = [];
 for (var i = 0; i < items.length; i++) { var k = items[i].dateISO.slice(0, 7); if (months.indexOf(k) === -1) months.push(k); }
 months.sort();
 var requested = new URLSearchParams(location.search).get('month') || '';
 var month = months.indexOf(requested) !== -1 ? requested : (months.length ? months[months.length - 1] : '');
 if (!month) {
  status.textContent = 'No stories have been archived yet. The archive collects the stories published on the News page \u2014 check back soon.';
  return;
 }
 titleBox.textContent = monthName(month);
 var idx = months.indexOf(month);
 if (listBox) for (var m = 0; m < months.length; m++) {
  var a = el('a', 'archive-month-link', monthName(months[m]));
  a.href = 'news-archive.html?month=' + months[m];
  if (months[m] === month) a.setAttribute('aria-current', 'true');
  listBox.append(a, document.createTextNode(' '));
 }
 if (prevBtn && idx > 0) { prevBtn.href = 'news-archive.html?month=' + months[idx - 1]; prevBtn.hidden = false; }
 if (nextBtn && idx >= 0 && idx < months.length - 1) { nextBtn.href = 'news-archive.html?month=' + months[idx + 1]; nextBtn.hidden = false; }

 var rows = items.filter(function (r) { return r.dateISO.slice(0, 7) === month; });
 if (!rows.length) {
  status.textContent = 'No stories have been archived for this month yet.';
  return;
 }
 status.textContent = rows.length + (rows.length === 1 ? ' story' : ' stories') + ' archived for ' + monthName(month) + ' \u2014 each one a full briefing that reads in full on this page.';

 var groups = new Map();
 for (var j = 0; j < rows.length; j++) { var label = weekLabel(rows[j].dateISO); if (!groups.has(label)) groups.set(label, []); groups.get(label).push(rows[j]); }
 groups.forEach(function (list, label) {
  var batch = el('div', 'archive-batch');
  batch.append(el('h3', null, label));
  for (var r = 0; r < list.length; r++) {
   var art = el('article', 'news-item');
   art.append(el('span', 'news-flag', (list[r].scope ? list[r].scope + ' \u00B7 ' : '') + (list[r].sectionLabel || 'News')));
   art.append(el('h4', null, list[r].title));
   if (list[r].dateLabel) {
    var dateP = el('p', 'meta news-date');
    var time = el('time', null, list[r].dateLabel);
    time.setAttribute('datetime', list[r].dateISO);
    dateP.append(time);
    art.append(dateP);
   }
   var pic = picture(list[r]);
   if (pic) art.append(pic);
   var paras = bodyParas(list[r]);
   for (var p = 0; p < paras.length; p++) art.append(el('p', p === 0 ? 'teaser' : 'teaser news-body', paras[p]));
   art.append(el('p', 'meta', 'Source: ' + list[r].credit));
   batch.append(art);
  }
  weeksBox.append(batch);
 });
})();
