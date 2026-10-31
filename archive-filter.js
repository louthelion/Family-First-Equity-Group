// Family First Equity Group — archive time-filter bar (design §5.6).
// Buttons: This week · This month · By month · By year.
// "By month" / "By year" show the full grouped archive — that grouped view
// is also the no-JavaScript default, so this script only ever hides
// entries for the This week / This month views and always restores them.
// Visibility is toggled with an inline !important display rule because
// some archive components carry their own !important display styles.
(function () {
  var bar = document.querySelector('.archive-filter');
  if (!bar) return;
  var buttons = Array.prototype.slice.call(bar.querySelectorAll('[data-filter]'));
  var status = bar.querySelector('.archive-filter-status');
  var archive = document.querySelector('.archive-year');
  if (!buttons.length || !archive) return;

  function setHidden(node, hidden) {
    if (hidden) node.style.setProperty('display', 'none', 'important');
    else node.style.removeProperty('display');
  }
  function groupOf(node) {
    return node.closest('.education-grid, .archive-batch') || node.parentElement;
  }

  var entries = Array.prototype.slice.call(
    archive.querySelectorAll('.education-card, .archive-entry')
  ).map(function (node) {
    var time = node.querySelector('time[datetime]');
    var stamp = node.getAttribute('data-date') || (time ? time.getAttribute('datetime') : '');
    var d = stamp ? new Date(stamp + 'T12:00:00') : null;
    return { node: node, date: d && !isNaN(d) ? d : null, visible: true };
  }).filter(function (e) { return e.date; });
  if (!entries.length) return;

  // Group containers (.education-grid / .archive-batch) in document order,
  // so an emptied group takes its month heading with it.
  var groups = [];
  entries.forEach(function (e) {
    var g = groupOf(e.node);
    if (groups.indexOf(g) === -1) groups.push(g);
  });
  var groupVisible = new Map(groups.map(function (g) { return [g, true]; }));

  function applyHeadings() {
    var kids = Array.prototype.slice.call(archive.children);
    var visibleAhead = false;
    for (var i = kids.length - 1; i >= 0; i--) {
      var kid = kids[i];
      if (groupVisible.has(kid)) {
        if (groupVisible.get(kid)) visibleAhead = true;
      } else if (/^H[123]$/.test(kid.tagName)) {
        setHidden(kid, !visibleAhead);
        if (visibleAhead) visibleAhead = false;
      }
    }
    // The year eyebrow at the top labels the whole year: it stays while
    // any group in the year is visible.
    var eyebrow = archive.querySelector(':scope > .eyebrow');
    if (eyebrow) setHidden(eyebrow, !groups.some(function (g) { return groupVisible.get(g); }));
  }

  function startOfWeek(d) {
    var x = new Date(d.getFullYear(), d.getMonth(), d.getDate());
    x.setDate(x.getDate() - ((x.getDay() + 6) % 7)); // Monday
    return x;
  }

  function setMode(mode) {
    var now = new Date();
    var weekStart = startOfWeek(now);
    var weekEnd = new Date(weekStart); weekEnd.setDate(weekEnd.getDate() + 7);
    var shown = 0;
    entries.forEach(function (e) {
      var keep = true;
      if (mode === 'week') keep = e.date >= weekStart && e.date < weekEnd;
      if (mode === 'month') keep = e.date.getFullYear() === now.getFullYear() && e.date.getMonth() === now.getMonth();
      e.visible = keep;
      setHidden(e.node, !keep);
      if (keep) shown++;
    });
    groups.forEach(function (g) {
      var visible = entries.some(function (e) { return groupOf(e.node) === g && e.visible; });
      groupVisible.set(g, visible);
      setHidden(g, !visible);
    });
    applyHeadings();
    buttons.forEach(function (b) {
      var active = b.getAttribute('data-filter') === mode;
      b.setAttribute('aria-pressed', String(active));
      b.classList.toggle('gold', active);
      b.classList.toggle('outline', !active);
    });
    if (status) {
      status.textContent = mode === 'week'
        ? (shown ? shown + (shown === 1 ? ' entry' : ' entries') + ' from this week.' : 'Nothing was published this week yet — “By month” shows the full archive.')
        : mode === 'month'
          ? (shown ? shown + (shown === 1 ? ' entry' : ' entries') + ' from this month.' : 'Nothing was published this month yet — “By month” shows the full archive.')
          : 'Showing the full archive, grouped by ' + (mode === 'byyear' ? 'year' : 'month') + '.';
    }
  }

  buttons.forEach(function (b) {
    b.addEventListener('click', function () { setMode(b.getAttribute('data-filter')); });
  });
  setMode('bymonth');
})();
