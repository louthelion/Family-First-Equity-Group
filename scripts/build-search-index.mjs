#!/usr/bin/env node
// Family First Equity Group — build the site search index and the sitemap
// from the sources of truth, so neither file can drift from what the site
// actually holds (content-system design §5.5, SEO plan §5a-5).
//
// Sources of truth:
//   - blog-archive.html    -> every published blog post
//   - article-archive.html -> every published article
//   - learn-index.json     -> every lesson, plus book entries when the
//                             manifest's "books" array is non-empty
//   - the repo's public .html pages -> the static page list for the sitemap
//
// Usage:  node scripts/build-search-index.mjs
// Writes: search-index.json and sitemap.xml at the repo root.
// Run this in the SAME pull request as every publish (see
// CONTENT-PUBLISHING.md). No dependencies — Node standard library only.

import { readFileSync, writeFileSync, readdirSync, existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const SITE = 'https://www.familyfirstequitygroup.com';

const read = (name) => readFileSync(join(ROOT, name), 'utf8');

// Decode the small set of HTML entities that appear in archive copy.
function text(html) {
  return String(html || '')
    .replace(/<[^>]*>/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&rsquo;/g, '’')
    .replace(/&lsquo;/g, '‘')
    .replace(/&ldquo;/g, '“')
    .replace(/&rdquo;/g, '”')
    .replace(/&mdash;/g, '—')
    .replace(/&ndash;/g, '–')
    .replace(/&hellip;/g, '…')
    .replace(/&#39;|&apos;/g, "'")
    .replace(/&quot;/g, '"')
    .replace(/\s+/g, ' ')
    .trim();
}

function metaDescription(file) {
  if (!existsSync(join(ROOT, file))) return '';
  const m = read(file).match(/<meta\s+name="description"\s+content="([^"]*)"/i);
  return m ? text(m[1]) : '';
}

// --- Blog posts, from blog-archive.html -------------------------------------
// Archive card shape: <article class="education-card blog-card"> containing
// <p class="content-type">category</p>, <time datetime>, <h3>title</h3>,
// a summary <p>, and a read link.
function parseBlogArchive() {
  const html = read('blog-archive.html');
  const entries = [];
  const cardRe = /<article class="education-card blog-card">([\s\S]*?)<\/article>/g;
  let m;
  while ((m = cardRe.exec(html)) !== null) {
    const card = m[1];
    const category = text((card.match(/<p class="content-type">([\s\S]*?)<\/p>/) || [])[1]);
    const date = (card.match(/<time datetime="([^"]+)"/) || [])[1] || '';
    const title = text((card.match(/<h3>([\s\S]*?)<\/h3>/) || [])[1]);
    const url = (card.match(/<a href="([^"]+\.html)"/) || [])[1] || '';
    // The summary is the first plain <p> that is not the category line.
    let summary = '';
    for (const p of card.matchAll(/<p>([\s\S]*?)<\/p>/g)) { summary = text(p[1]); if (summary) break; }
    if (!summary) summary = metaDescription(url);
    if (title && url) entries.push({ title, section: 'blog', category, date, summary, url });
  }
  return entries;
}

// --- Articles, from article-archive.html ------------------------------------
// Archive entry shape: <a class="archive-entry" href="..."> containing
// <small>category</small>, <strong>title</strong>, and <time datetime>.
// Article archive rows carry no summary, so the summary falls back to the
// article page's own meta description (the page is its own source of truth).
function parseArticleArchive() {
  const html = read('article-archive.html');
  const entries = [];
  const rowRe = /<a class="archive-entry" href="([^"]+\.html)">([\s\S]*?)<\/a>/g;
  let m;
  while ((m = rowRe.exec(html)) !== null) {
    const url = m[1];
    const row = m[2];
    const category = text((row.match(/<small>([\s\S]*?)<\/small>/) || [])[1]);
    const title = text((row.match(/<strong>([\s\S]*?)<\/strong>/) || [])[1]);
    const date = (row.match(/<time datetime="([^"]+)"/) || [])[1] || '';
    const summary = metaDescription(url);
    if (title && url) entries.push({ title, section: 'article', category, date, summary, url });
  }
  return entries;
}

// --- Lessons and books, from learn-index.json --------------------------------
// Books choice (documented per the Step 3 brief): a book entry keeps its
// manifest `section` value in a dedicated `bookSection` field ("recommended"
// or "by-luders") AND gets the distinct index section "book", so search can
// badge every book as BOOK while still telling the two shelves apart.
function parseLearnManifest() {
  const manifest = JSON.parse(read('learn-index.json'));
  const entries = [];
  for (const lesson of manifest.lessons || []) {
    entries.push({
      title: lesson.title,
      section: 'lesson',
      category: lesson.path || '',
      date: lesson.dateAdded || '',
      summary: lesson.summary || '',
      url: `${lesson.slug}.html`,
    });
  }
  for (const book of manifest.books || []) {
    entries.push({
      title: book.title,
      section: 'book',
      bookSection: book.section || '',
      category: book.author ? `Book — ${book.author}` : 'Book',
      date: book.dateAdded || '',
      summary: book.summary || book.why || '',
      url: book.url || 'learning-center.html',
    });
  }
  return entries;
}

const entries = [...parseBlogArchive(), ...parseArticleArchive(), ...parseLearnManifest()]
  // Newest first. Lesson/book dates may be month-granularity ("2026-06");
  // they compare correctly as ISO prefixes.
  .sort((a, b) => String(b.date).localeCompare(String(a.date)));

writeFileSync(join(ROOT, 'search-index.json'), JSON.stringify(entries, null, 2) + '\n');

// --- Sitemap ------------------------------------------------------------------
// Static page list: the repo's public .html pages (root plus the section
// folders that hold an index page), excluding utility/template pages and
// the legacy Learn duplicate variants (they 301 to canonical lessons via
// _redirects, so listing them would point search engines at redirects).
const EXCLUDED_PAGES = new Set([
  'property-detail-template.html', // template, not a page
  'thank-you.html',                // post-form utility page
  'lead-intake-live.html',         // internal intake utility page
  'sell.html',                     // redirect stub -> seller page
  'learn.html',                    // redirect stub -> learning-center.html
  // Legacy duplicate Learn variants — 301 to the canonical lessons.
  'learn-cash-sale.html',
  'learn-title-taxes-liens.html',
  'learn-property-photos-documents.html',
  'learn-commercial-real-estate.html',
  'learn-fix-and-flip.html',
  'learn-insurance-coordination.html',
  'learn-property-management.html',
  'learn-structure-coordination.html',
  'learn-structure-trust-insurance.html',
]);

const staticPages = [];
for (const name of readdirSync(ROOT)) {
  if (name.endsWith('.html') && !EXCLUDED_PAGES.has(name)) staticPages.push(name);
}
for (const dir of readdirSync(ROOT, { withFileTypes: true })) {
  if (!dir.isDirectory() || dir.name.startsWith('.') || ['netlify', 'node_modules', 'scripts', 'tests'].includes(dir.name)) continue;
  if (existsSync(join(ROOT, dir.name, 'index.html'))) staticPages.push(`${dir.name}/index.html`);
}
staticPages.sort();

// lastmod comes only from dated sources of truth; undated pages omit it
// rather than inventing a date.
const lastmodByUrl = new Map(entries.map((e) => [e.url, /^\d{4}-\d{2}-\d{2}/.test(e.date) ? e.date.slice(0, 10) : null]));

const urls = staticPages.map((page) => {
  const loc = page === 'index.html' ? `${SITE}/` : `${SITE}/${page}`;
  const lastmod = lastmodByUrl.get(page);
  return `  <url>\n    <loc>${loc}</loc>${lastmod ? `\n    <lastmod>${lastmod}</lastmod>` : ''}\n  </url>`;
});

const sitemap = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls.join('\n')}\n</urlset>\n`;
writeFileSync(join(ROOT, 'sitemap.xml'), sitemap);

const bySection = {};
for (const e of entries) bySection[e.section] = (bySection[e.section] || 0) + 1;
console.log(`search-index.json: ${entries.length} entries`, bySection);
console.log(`sitemap.xml: ${staticPages.length} URLs`);
