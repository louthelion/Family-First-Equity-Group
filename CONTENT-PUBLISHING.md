# Content Publishing — Family First Equity Group

The formal publish checklist for Blog, Articles, and Learn content on
familyfirstequitygroup.com. This is the rule of the Content & Learning
Department: **a piece is not published until every item below ships in the
same pull request.** Drafts go to Quality Review, then to the CEO for
signature, and only then publish — **nothing publishes unsigned.**

## The publish checklist (all in ONE pull request)

- [ ] **1. The piece itself** — the post/lesson file (e.g.
      `blog-<slug>.html`, `article-<slug>.html`, `learn-<slug>.html`),
      complete and proofread.
- [ ] **2. The index card** — the piece appears on its section index:
      Blog → `blog.html`, Articles → `articles.html` (current weekly
      batch), Learn → the lesson grid on `learning-center.html`.
- [ ] **3. The ARCHIVE entry** — the permanent record, in the same PR:
      - **Blog post** → a card in the **current month block** of
        `blog-archive.html` (create the new month block when the month
        turns).
      - **Article** → an entry in a **new `.archive-batch`** ("Week of …")
        in `article-archive.html`, under its year and month.
      - **Lesson** → an entry in the **`learn-index.json` manifest** with
        its **exact `dateAdded`** (`YYYY-MM-DD` for anything published
        after the Learn rebuild; the original June 2026 lessons honestly
        keep month granularity, `2026-06` — never invent a day that was
        not recorded), plus its card in the "All lessons" archive view on
        `learning-center.html`.
      - **Book** → an entry in the `books` array of `learn-index.json`,
        carrying its `section` field — `"recommended"` or `"by-luders"` —
        and its exact `dateAdded`.
- [ ] **4. Search index + sitemap regenerated** — run
      `node scripts/build-search-index.mjs` and commit the regenerated
      `search-index.json` **and** `sitemap.xml` in the same PR. The script
      reads the sources of truth (the two archive pages and
      `learn-index.json`), so a piece that has its archive entry and
      manifest entry becomes searchable and crawlable the moment it is
      live. If the script's entry counts do not include the new piece,
      the archive/manifest step above was missed — stop and fix it.
- [ ] **5. Index grids stay capped** — `blog.html` and `articles.html`
      keep the **newest ~8 pieces only**. When a new piece pushes an
      index past the cap, the oldest piece's card rolls off the index in
      the same PR. Nothing is lost: the post file and its archive entry
      stay untouched — **the archive is the permanent record.**
- [ ] **6. SEO fields complete** (SEO plan §5a-4) — every new page ships
      at birth with:
      - a unique `<title>`,
      - a **unique meta description** (never copy another page's),
      - a **canonical tag**:
        `<link rel="canonical" href="https://www.familyfirstequitygroup.com/<page>.html">`,
      - for Learn lessons, the `learn-index.json` manifest entry
        (item 3) — the manifest entry *is* part of the SEO fields,
      - for posts/articles, the **BlogPosting JSON-LD block** from the
        template below, filled in with the piece's real headline and
        dates.
- [ ] **7. Alt-text rule** (SEO plan §5b-6) — **any `<img>` ships with
      descriptive alt text, or it doesn't ship.** For property photos,
      describe the property (type / neighborhood / what the photo shows).
      No exceptions, no empty `alt=""` on content images.
- [ ] **8. House rules hold** — **no invented prices, statistics,
      clients, or testimonials** anywhere in the piece, its cards, its
      summaries, or its schema. Facts come from the owner or from a
      named, dated source. The public phone number, anywhere one appears,
      is **(407) 537-0535** — the only public number.
- [ ] **9. Approval flow completed** — Draft → **Quality Review** →
      **CEO signature** → publish. The signature comes before the merge,
      never after.
- [ ] **10. Ship through the normal flow** — branch → PR → Netlify deploy
      preview green and the new piece checked on the preview →
      squash-merge → verify the piece, its archive entry, and its search
      result live on https://familyfirstequitygroup.com.

**News is the standing exception — the sharpened standard (owner,
2026-11-11):** news items are FULL BRIEFINGS read on the News page
itself, from the CEO-approved source set. Every item ships with all
of the following, or it does not ship:

- **A full briefing, never a stub** — headline, date, and scope tag
  (LOCAL / UNITED STATES / WORLDWIDE), plus a body of **at least
  three paragraphs (at least ~120 words)** written in our own words:
  what happened, the key numbers, and what it means in plain words
  for a Central Florida homeowner or investor. No truncated summary,
  no ellipsis leading off the page. Facts stay strictly to what the
  credited source reported; no number is ever invented.
- **One real picture per item** — a free-license library photo
  (Unsplash CDN), set inside the article card, with descriptive alt
  text (checklist item 7 applies) and a plain-text photo credit line
  under the picture. Never a source article's own photograph and
  never a hotlinked news photo.
- **Referral by name only, never a link** — the source is credited as
  a plain-text line with its date (`Source: …` style). A news item
  carries **no URL, no anchor, and no outbound door of any kind**;
  a reader who wants to go further is told, by name, which way to
  go — and everything we publish stays readable on this site.
- **The stock-market morning line** keeps the latest verified index
  closes only; a new close is never fabricated to fill the line.

They are not individually signed. The archive renders the same
items, in the same full on-page form (picture and full body
included), from `news-data.js`. **Morning-cadence refresh rule:**
every refresh pass edits `news-data.js` and mirrors the same items
as static articles in `news.html`, in the same pull request, and
every refreshed or new item must meet this same standard — full
briefing, picture, name-only credit — so the standard survives the
refresh, not just the launch. No other checklist step applies.

## Books — the bookshop (news.html referral shelf)

The bookshop sits on `news.html` below the news feed, structurally and
visually separate from it, labelled as a separate shelf, not news.
News items still carry no links; the bookshop's buy doors are the only
doors on that page that will ever leave the site, and only for a book.

- **Book-card structure** — every book card carries the same slots: a
  **cover slot**, a **title slot**, an **on-page summary slot** (a full
  summary in our own words, read on the page), and a **price slot**,
  plus **two buy doors** for Books by Luders: **"Buy here"** (sold on
  Luders' own page) and **"Buy on Amazon"** (his Amazon KDP listing,
  where he is the seller). Recommended books carry one buy referral
  door each. Until a real link exists, every door stays a placeholder
  (`#buy-books-by-luders`, `#buy-amazon-books-by-luders`,
  `#buy-<slug>` for recommendations), clearly marked in an HTML
  comment as awaiting the owner's sitting.
- **No-invention rule** — no book title, cover, or price is published
  until the owner supplies it. No book by Luders exists yet: the
  My Books area ships as structure only, marked as his publishing
  home with the first books in preparation, both doors inactive and
  honestly labelled, and no price shown. Never fabricate a catalog,
  a cover, or a price to fill the shelf.
- **Recommended books** — a recommended book must be a **real title
  by a real, named author**, listed with a summary written **in our
  own words** (never publisher copy) and a free-value note saying
  what a reader learns for free from the summary alone. The real
  store link for a recommendation drops in only at the owner's
  sitting — never invent a store URL or an affiliate code.

## Post / article HTML template pattern

New post and article pages follow the existing post-page pattern
(`.article-hero` / `.article-shell` for articles, the blog post hero for
blog posts, the shared header/footer, `style.css` + `investor.css`,
`script.js`). The head of every new post/article carries its SEO fields,
including this **BlogPosting JSON-LD block** (SEO plan §5a-4). Replace
every `{{…}}` placeholder with the piece's real values:

```html
<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@type": "BlogPosting",
  "headline": "{{HEADLINE}}",
  "datePublished": "{{YYYY-MM-DD}}",
  "dateModified": "{{YYYY-MM-DD}}",
  "author": {
    "@type": "Organization",
    "name": "Family First Equity Group",
    "url": "https://www.familyfirstequitygroup.com/"
  },
  "publisher": {
    "@type": "Organization",
    "name": "Family First Equity Group",
    "url": "https://www.familyfirstequitygroup.com/"
  },
  "mainEntityOfPage": "https://www.familyfirstequitygroup.com/{{PAGE-FILENAME}}"
}
</script>
```

Notes on the template:

- `dateModified` equals `datePublished` on first publish; update it when
  the piece is substantively revised (and ship that revision through the
  same checklist).
- The author and publisher are the company — never invent a named
  individual author.
- This block is a **template for future pieces**. It is filled in on the
  new post's own page at publish time; it never ships with placeholder
  values, and no sample post is created to demonstrate it.

## How search and the sitemap stay honest

`scripts/build-search-index.mjs` generates `search-index.json` (titles,
sections, categories, dates, summaries, URLs for every blog post,
article, lesson, and book) and `sitemap.xml` (the same content plus the
site's public pages) from the archive pages and `learn-index.json`. Book
entries keep their shelf apart in the index with a `bookSection` field
(`"recommended"` / `"by-luders"`) alongside `section: "book"`. Because
both files are generated — never hand-edited — they cannot drift from
what the archives actually hold, as long as this checklist is followed
and the script is re-run in every publish PR.
