// Learn page "All lessons" archive view.
// The by-path and by-date listings are rendered into learning-center.html as
// static HTML, so they work without JavaScript. When learn-index.json loads,
// both views are re-rendered from the manifest so the manifest stays the
// single source of truth for lessons added after the Learn rebuild.
(function () {
  var byPathBtn = document.getElementById('view-by-path');
  var byDateBtn = document.getElementById('view-by-date');
  var byPathView = document.getElementById('all-lessons-by-path');
  var byDateView = document.getElementById('all-lessons-by-date');
  if (!byPathBtn || !byDateBtn || !byPathView || !byDateView) return;

  var PATH_ORDER = ['Selling a House', 'Buying a House', 'Inherited & Family Property', 'Investors'];
  var MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

  function monthLabel(dateAdded) {
    var parts = String(dateAdded).split('-');
    var year = parts[0];
    var month = MONTHS[parseInt(parts[1], 10) - 1];
    return month ? month + ' ' + year : String(dateAdded);
  }

  function lessonRow(lesson) {
    var a = document.createElement('a');
    a.href = lesson.slug + '.html';
    a.textContent = lesson.title;
    var span = document.createElement('span');
    span.className = 'lesson-added';
    span.textContent = 'Added ' + monthLabel(lesson.dateAdded);
    a.appendChild(span);
    return a;
  }

  function batch(heading, lessons) {
    var div = document.createElement('div');
    div.className = 'archive-batch';
    var h = document.createElement('h3');
    h.textContent = heading;
    div.appendChild(h);
    lessons.forEach(function (lesson) { div.appendChild(lessonRow(lesson)); });
    return div;
  }

  function render(lessons) {
    byPathView.innerHTML = '';
    PATH_ORDER.forEach(function (path) {
      var inPath = lessons.filter(function (l) { return l.path === path; });
      if (inPath.length) byPathView.appendChild(batch(path, inPath));
    });
    var months = [];
    lessons.forEach(function (l) { if (months.indexOf(l.dateAdded) === -1) months.push(l.dateAdded); });
    months.sort().reverse();
    byDateView.innerHTML = '';
    months.forEach(function (m) {
      var inMonth = lessons.filter(function (l) { return l.dateAdded === m; });
      byDateView.appendChild(batch(monthLabel(m), inMonth));
    });
  }

  function show(which) {
    var byPath = which === 'path';
    byPathView.hidden = !byPath;
    byDateView.hidden = byPath;
    byPathBtn.setAttribute('aria-pressed', String(byPath));
    byDateBtn.setAttribute('aria-pressed', String(!byPath));
    byPathBtn.className = byPath ? 'button gold' : 'button outline';
    byDateBtn.className = byPath ? 'button outline' : 'button gold';
  }

  byPathBtn.addEventListener('click', function () { show('path'); });
  byDateBtn.addEventListener('click', function () { show('date'); });

  fetch('learn-index.json')
    .then(function (r) { if (!r.ok) throw new Error('manifest'); return r.json(); })
    .then(function (data) { if (data && Array.isArray(data.lessons) && data.lessons.length) render(data.lessons); })
    .catch(function () { /* static listings already on the page remain in place */ });
})();
