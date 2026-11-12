// Family First Equity Group — News page status line + pictures.
//
// Sharpened retention standard (owner, 2026-11-11): the stories
// themselves are static, on-page FULL BRIEFINGS in news.html —
// headline, date, scope tag, picture, and a multi-paragraph body in
// our own words, with a plain-text source credit. Referral is by name
// only; nothing on this page carries an outbound door to a publisher.
// This script maintains the status line and the "Updated today" chip
// from the shared data file (news-data.js), and it makes sure every
// static article carries its picture from that same data file: if an
// article's markup ever lags the data file, the picture is inserted
// from the data here. It renders no outbound doors and fetches
// nothing.
(function () {
 var status = document.getElementById('news-status');
 if (!status) return;
 var items = Array.isArray(window.FFEG_NEWS_ITEMS) ? window.FFEG_NEWS_ITEMS.slice() : [];
 if (!items.length) {
  status.textContent = 'Local stories, summarized in full on this page \u2014 sources credited under every story.';
  return;
 }
 items.sort(function (a, b) { return String(b.dateISO).localeCompare(String(a.dateISO)); });
 var newest = Date.parse(items[0].dateISO + 'T12:00:00');
 if (Number.isFinite(newest) && Date.now() - newest < 36 * 3600000 && Date.now() - newest > -12 * 3600000) {
  var chip = document.getElementById('news-updated-chip');
  if (chip) chip.hidden = false;
 }
 var line = window.FFEG_MORNING_LINE;
 status.textContent = items.length + ' ' + (items.length === 1 ? 'story' : 'stories') +
  ' (local, U.S. & worldwide), each a full briefing in full on this page' +
  (line && line.dateLabel ? ', plus the stock-market morning line for ' + line.dateLabel : '') +
  '. Sources are credited under every story \u2014 reading never leaves this site.';

 // Pictures: one per item, from the data file, inside the article
 // card. Static articles in news.html already carry theirs; insert
 // only where one is missing so a data refresh can never leave an
 // article picture-less.
 if (typeof document.querySelectorAll === 'function') {
  var articles = document.querySelectorAll('.news-item');
  for (var i = 0; i < articles.length && i < items.length; i++) {
   var item = items[i];
   if (!item.image || !item.image.src) continue;
   if (articles[i].querySelector && articles[i].querySelector('img')) continue;
   var fig = document.createElement('figure');
   fig.className = 'news-photo';
   var img = document.createElement('img');
   img.setAttribute('src', item.image.src);
   img.setAttribute('alt', item.image.alt || '');
   img.setAttribute('loading', 'lazy');
   fig.append(img);
   if (item.image.credit) {
    var cap = document.createElement('figcaption');
    cap.className = 'meta';
    cap.textContent = item.image.credit;
    fig.append(cap);
   }
   var heading = articles[i].querySelector ? articles[i].querySelector('h3') : null;
   if (heading && heading.parentNode === articles[i] && typeof articles[i].insertBefore === 'function') {
    // Place the picture right after the article's date line if there
    // is one, otherwise right after the headline.
    var anchor = heading.nextSibling;
    while (anchor && anchor.className && String(anchor.className).indexOf('news-date') !== -1) anchor = anchor.nextSibling;
    articles[i].insertBefore(fig, anchor || null);
   } else if (typeof articles[i].append === 'function') {
    articles[i].append(fig);
   }
  }
 }
})();
