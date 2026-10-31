// Family First Equity Group — site search (content-system design §5.5).
// One search box, one generated index, no service: searches the static
// search-index.json (blog posts, articles, lessons, books) and merges live
// matches from the News archive read function (headline records kept in
// Netlify Blobs). Matching is simple case-insensitive word/substring
// matching over title + category + summary (and news headline/teaser).
// Search matches titles and summaries only — not full post text.
(function () {
  var form = document.getElementById('ffeg-search-form');
  var input = document.getElementById('ffeg-search-input');
  var resultsBox = document.getElementById('ffeg-search-results');
  if (!form || !input || !resultsBox) return;

  var SECTION_LABELS = { blog: 'BLOG', article: 'ARTICLE', lesson: 'LESSON', book: 'BOOK', news: 'NEWS' };
  var MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
  // Same publisher-host allowlist discipline as news.js / news-archive.js:
  // a news result only renders when its link points at an approved source.
  var NEWS_HOSTS = ['www.mortgagenewsdaily.com', 'mortgagenewsdaily.com', 'www.federalreserve.gov', 'federalreserve.gov', 'www.realtor.com', 'realtor.com', 'www.census.gov', 'census.gov', 'eyeonhousing.org', 'www.eyeonhousing.org'];
  var indexPromise = null;

  function el(tag, cls, text) {
    var n = document.createElement(tag);
    if (cls) n.className = cls;
    if (text != null) n.textContent = text;
    return n;
  }

  function dateLabel(date) {
    if (!date) return '';
    var parts = String(date).split('-');
    if (parts.length === 2) return MONTHS[parseInt(parts[1], 10) - 1] + ' ' + parts[0]; // month-granularity, e.g. lessons "2026-06"
    var d = new Date(date + (String(date).length === 10 ? 'T12:00:00Z' : ''));
    if (isNaN(d)) return String(date);
    return d.toLocaleDateString(undefined, { month: 'long', day: 'numeric', year: 'numeric', timeZone: 'UTC' });
  }

  function matches(entry, words) {
    var haystack = (entry.title + ' ' + (entry.category || '') + ' ' + (entry.summary || '')).toLowerCase();
    return words.every(function (w) {
      if (haystack.indexOf(w) !== -1) return true;
      // Forgive a plural: "photos" should still find "photo"/"photographs".
      if (w.length > 3 && w.charAt(w.length - 1) === 's') return haystack.indexOf(w.slice(0, -1)) !== -1;
      return false;
    });
  }

  function loadIndex() {
    if (!indexPromise) {
      indexPromise = fetch('search-index.json', { headers: { Accept: 'application/json' } })
        .then(function (r) { if (!r.ok) throw new Error('index'); return r.json(); })
        .then(function (data) { return Array.isArray(data) ? data : []; })
        .catch(function () { return []; });
    }
    return indexPromise;
  }

  // The archive read function returns one month per call ({month, months,
  // records}). Query the current month plus the recent months it reports
  // (up to 6 months back) so a topic from a recent headline still finds it.
  function loadNews() {
    var first = fetch('/.netlify/functions/ffeg-news-archive', { headers: { Accept: 'application/json' } })
      .then(function (r) { if (!r.ok) throw new Error('news'); return r.json(); });
    return first.then(function (data) {
      var months = (Array.isArray(data.months) && data.months.length ? data.months : [data.month]).slice(-6);
      var current = data.month;
      var rest = months.filter(function (m) { return m !== current; });
      var jobs = rest.map(function (m) {
        return fetch('/.netlify/functions/ffeg-news-archive?month=' + encodeURIComponent(m), { headers: { Accept: 'application/json' } })
          .then(function (r) { return r.ok ? r.json() : { records: [] }; })
          .catch(function () { return { records: [] }; });
      });
      return Promise.all([data].concat(jobs)).then(function (all) {
        var records = [];
        all.forEach(function (d) { if (d && Array.isArray(d.records)) records = records.concat(d.records); });
        return records.filter(function (r) {
          if (!r || !r.title || !r.url) return false;
          var url;
          try { url = new URL(r.url); } catch (e) { return false; }
          return url.protocol === 'https:' && NEWS_HOSTS.indexOf(url.hostname) !== -1;
        }).map(function (r) {
          return {
            title: r.title,
            section: 'news',
            category: r.source || '',
            date: String(r.publishedAt || '').slice(0, 10),
            summary: r.teaser || '',
            url: r.url,
            external: true
          };
        });
      });
    }).catch(function () { return []; });
  }

  function render(results, query) {
    resultsBox.innerHTML = '';
    if (!results.length) {
      resultsBox.appendChild(el('p', 'search-status', 'No matches for “' + query + '” in titles or summaries. Try a shorter word — for example “inherited”, “liens”, or “rates”.'));
      return;
    }
    resultsBox.appendChild(el('p', 'search-status', results.length + (results.length === 1 ? ' result' : ' results') + ' for “' + query + '”, newest first:'));
    var list = el('div', 'search-results');
    results.forEach(function (entry) {
      var card = el('article', 'search-result');
      var flagRow = el('p', 'search-result-meta');
      flagRow.appendChild(el('span', 'tag', SECTION_LABELS[entry.section] || String(entry.section).toUpperCase()));
      var when = dateLabel(entry.date);
      if (when) flagRow.appendChild(el('time', null, when));
      if (entry.section === 'book' && entry.bookSection) {
        flagRow.appendChild(el('span', 'search-book-section', entry.bookSection === 'by-luders' ? 'By Luders' : 'Recommended'));
      }
      card.appendChild(flagRow);
      var heading = el('h3', 'search-result-title');
      var link = el('a', null, entry.title);
      link.href = entry.url;
      if (entry.external) { link.target = '_blank'; link.rel = 'noopener noreferrer'; }
      heading.appendChild(link);
      card.appendChild(heading);
      if (entry.summary) card.appendChild(el('p', 'search-result-summary', entry.summary));
      if (entry.external) card.appendChild(el('p', 'search-result-note', 'News story — opens at the publisher.'));
      list.appendChild(card);
    });
    resultsBox.appendChild(list);
  }

  form.addEventListener('submit', function (event) {
    event.preventDefault();
    var query = input.value.trim();
    if (!query) return;
    var words = query.toLowerCase().split(/\s+/).filter(Boolean);
    resultsBox.innerHTML = '';
    resultsBox.appendChild(el('p', 'search-status', 'Searching…'));
    Promise.all([loadIndex(), loadNews()]).then(function (loaded) {
      var all = loaded[0].concat(loaded[1]);
      var found = all.filter(function (entry) { return matches(entry, words); });
      found.sort(function (a, b) { return String(b.date).localeCompare(String(a.date)); });
      render(found, query);
    });
  });
})();
