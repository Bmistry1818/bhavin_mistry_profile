# Bhavin Mistry Personal Branding Page

A clean, premium personal brand landing page built from Bhavin Mistry's LinkedIn profile themes: AI strategy, engineering leadership, enterprise transformation, and practical Gen AI adoption.

## Files
- [index.html](index.html) — page structure and content
- [styles.css](styles.css) — visual system and responsive design
- [script.js](script.js) — navigation, footer year, and article feed
- [data/blogs.json](data/blogs.json) — published article data

## Local preview
Open the site locally with:

python3 -m http.server 8000

Then visit:

http://localhost:8000

## GitHub Pages deployment
1. Push this repository to GitHub.
2. In the repository, open Settings > Pages.
3. Set Source to "Deploy from a branch".
4. Select Branch: main and Folder: /root.
5. Save. GitHub will publish the site at:
   https://bhavinmistry.com/

This is a static site and works well for GitHub Pages without any build step.

## Article feed

The browser loads `data/blogs.json`. Keep this in a public folder: GitHub Pages may treat `_data` as Jekyll input rather than publish it.

Install Node.js 22+ and pnpm 11.19.0, then run:

```sh
pnpm install --frozen-lockfile
pnpm test
pnpm update:blogs
```

The scheduled workflow reuses `automation/update-blogs` for its update PR. It handles RSS and Atom, follows redirects, validates dates and URLs, and uses stable article IDs. Failed sources retain their cached articles; a total outage fails the job without overwriting the feed. Unchanged articles do not produce timestamp-only commits.

The checked-in entries currently link to profile/article listings, so their buttons say “Browse … writing.” Replace these with verified individual article URLs. Keep the static cards in `index.html` aligned with curated content; they provide a fallback when JavaScript is unavailable.

## Content still needed

- A professional portrait and permission to use it.
- Two or three verified case studies with your role and measurable outcomes.
- Exact article URLs and confirmed publication dates.
- Any preferred contact or booking URL beyond LinkedIn.

Do not invent metrics, employers, testimonials, or credentials. The social preview currently uses the existing favicon; replace it with a dedicated branded sharing image when one is available.

## Validation

The validation workflow runs feed parsing and outage tests and checks browser JavaScript syntax. Before publishing, also check mobile navigation, keyboard use, the no-JavaScript fallback, and that `/data/blogs.json` returns successfully on the deployed site.
