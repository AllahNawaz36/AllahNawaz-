# Allah Nawaz — UI/UX & Product Designer

**Live portfolio:** [https://allahnawaz36.github.io/AllahNawaz-/](https://allahnawaz36.github.io/AllahNawaz-/)

Professional single-page portfolio for **Allah Nawaz**, a UI/UX and Product Designer based in Islamabad, Pakistan. Focus areas include SaaS platforms, web applications, mobile experiences, user flows, information architecture, wireframes and high-fidelity interface design.

---

## About this repository

| File | Purpose |
|------|---------|
| `portfolio.html` | Complete single-page portfolio (source of truth) |
| `robots.txt` | Search-engine crawl rules |
| `sitemap.xml` | XML sitemap for indexing |
| `social-preview.svg` | Open Graph / social sharing image (converted to PNG on deploy) |
| `.github/workflows/pages.yml` | GitHub Actions workflow that deploys to GitHub Pages |
| `.nojekyll` | Ensures GitHub Pages serves files without Jekyll processing |

The site is deployed automatically to **GitHub Pages** whenever changes are pushed to the `main` branch.

---

## Sections

1. **Selected work** — Curated product and interface case studies (Behance embeds)
2. **More projects** — Additional design work
3. **Motion & VFX** — Motion and visual exploration
4. **About** — Background and design approach
5. **Experience** — Capabilities and contribution style
6. **Process** — Structured design workflow
7. **Contact** — Email and WhatsApp enquiry options

---

## Professional profiles

- [LinkedIn](https://www.linkedin.com/in/allah-nawaz-productdesigner/)
- [Behance](https://www.behance.net/allahnawaz175)

---

## Local preview

Open `portfolio.html` directly in a browser, or serve the folder with any static server:

```bash
# Example with Python
python -m http.server 8080
```

Then visit `http://localhost:8080/portfolio.html`.

---

## Deployment notes

The GitHub Actions workflow:

1. Copies `portfolio.html` → `_site/index.html`
2. Copies supporting files (`robots.txt`, `sitemap.xml`, `social-preview.svg`)
3. Converts the SVG social preview to PNG (1200×630)
4. Deploys the `_site` folder to GitHub Pages

No build step or framework is required. The site is pure HTML, CSS and minimal JavaScript.

---

## License

All rights reserved © Allah Nawaz.  
Portfolio content and design are the intellectual property of the author.
