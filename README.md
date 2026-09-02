# Messerschmitt Foundation of Great Britain

![Status: Production Ready](https://img.shields.io/badge/status-production--ready-1B2A4A)
![HTML5](https://img.shields.io/badge/HTML5-semantic-E34F26)
![CSS3](https://img.shields.io/badge/CSS3-responsive-1572B6)
![JavaScript](https://img.shields.io/badge/JavaScript-vanilla%20ES6-F7DF1E)
![Accessibility](https://img.shields.io/badge/accessibility-WCAG%20AA-C5A059)
![License](https://img.shields.io/badge/license-MIT-1E3A2B)

The official website of the **Messerschmitt Foundation of Great Britain** — a modern,
mobile-first, standards-compliant **multi-page website** dedicated to the historical
preservation, technical archivism, restoration mentorship, and public education of
Messerschmitt microcars, Kabinenroller ("cabin scooters"), and the engineering legacy of
technical designer **Fritz Fend**.

---

## Table of Contents

- [Project Overview](#project-overview)
- [Architecture & File Structure](#architecture--file-structure)
- [Local Development Setup](#local-development-setup)
- [Image Replacement & Media Asset Pipeline](#image-replacement--media-asset-pipeline)
- [Deployment Guide (GitHub Pages)](#deployment-guide-github-pages)
- [Docker & Hetzner VPS Deployment](#docker--hetzner-vps-deployment)
- [Contributing Guidelines](#contributing-guidelines)
- [License](#license)

---

## Project Overview

This repository contains a complete rebuild of the Foundation's web presence to modern
web standards. The site tells the story of the Messerschmitt microcar — from the 1948
Fend Flitzer to the FMR Tg500 "Tiger" — and showcases the Foundation's featured exhibit,
**ME 200**, an original-specification 1958 Messerschmitt KR200 with genuine patina.

### Key Features

- **Separate page per section** — Home, About, History, Our Exhibits, and Contact each
  live on their own page, so every topic opens as its own browser tab with its own
  shareable URL.
- **Semantic HTML5** — meaningful landmarks, heading hierarchy, and ARIA roles.
- **Accessible by default** — skip links, focus management, `aria-expanded`/`aria-hidden`
  states, visible focus rings, and a WCAG AA-compliant colour palette.
- **Mobile-first responsive CSS** — custom properties (design tokens), CSS Grid, and
  Flexbox with breakpoints at 768px and 1024px.
- **Vanilla JavaScript** — no frameworks, no build step, no dependencies.
  - ARIA-managed mobile navigation drawer
  - Active-page highlighting in the header navigation
  - Client-side validated contact form
  - Floating "Back to Top" button
- **Official logo** — the Foundation mark ships in the header and footer via
  `assets/images/mfgb-logo.png`.
- **Interactive "Canopy Door" exhibit card** — a glassmorphism showcase of the ME 200
  whose acrylic lid hinges open on hover, tap, or keyboard to reveal the cabin's
  technical specs grid.
- **1950s vintage "Micro-Dashboard"** — a chrome speedometer scroll-progress bar (0–60
  MPH), a brass ignition-key theme switch (Classic Racing Green / Night Drive Dark),
  and a chrome engine START button with sequential rev lights.
- **Structured data** — Organization and Vehicle JSON-LD schema for rich search results.
- **Placeholder media system** — clean CSS containers ready to be swapped for real
  photography without breaking layout.

---

## Architecture & File Structure

```
messerschmitt-foundation-gb/
├── index.html        # Home — hero, featured exhibit spotlight & explore links
├── about.html        # About — mission, vehicle verification & key pillars
├── history.html      # History — interactive Kabinenroller timeline
├── imports.html      # UK Imports — live chassis register (embedded unchanged)
├── exhibits.html     # Our Exhibits — ME 200, KR175, Tg500 with spec tables
├── contact.html      # Contact — validated form, registry & visitor policy
├── styles.css        # Responsive CSS design system (custom properties & grids)
├── app.js            # Vanilla JS: nav drawer, active-page highlight, form, back-to-top
├── README.md         # This file — repository guide & deployment manual
└── assets/           # (Optional, after image pipeline — see below)
    └── images/       # mfgb-logo.png, me200.jpg, kr175.jpg, tg500.jpg, og-cover.jpg
```

| File | Role |
| ---- | ---- |
| `index.html` | Home page: hero with the ME 200 exhibit spotlight, media placeholder, and explore cards that link to every section page. |
| `about.html` | About page: the Foundation's mission, vehicle verification and maintenance work, plus the three key-pillar cards. |
| `history.html` | History page: the visual Kabinenroller timeline (1948–1958). |
| `imports.html` | UK Imports page: embeds the live MFGB Chassis Register dashboard (`fraserbyte.github.io/Messerschmitt`) unchanged in a full-height iframe. |
| `exhibits.html` | Exhibits page: ME 200 (with full technical specification table), KR175, and FMR Tg500 cards. |
| `contact.html` | Contact page: accessible form, Foundation details, UK registry, and visitor policy. |
| `styles.css` | All styling. Design tokens live in `:root` (palette, typography, spacing, elevation, radii). Contains the `.media-placeholder` system, card components, page-hero banners, and mobile-first media queries. |
| `app.js` | Modular IIFE with four independent initialisation routines: navigation toggle, active-page highlighting, form validation, and back-to-top visibility. |
| `README.md` | Documentation for local development, asset replacement, and GitHub Pages deployment. |

> **Note on structure:** GitHub Pages serves the repository root by default, so
> `index.html` (the Home page) lives at the top level of the repository and links to the
> other section pages (`about.html`, `history.html`, `imports.html`, `exhibits.html`,
> `contact.html`).
> Existing Foundation archive materials (PDFs and images) may be kept in a separate
> folder such as `archive/` and linked to from content once digitised.

---

## Local Development Setup

### Step 1 — Clone the repository

```bash
git clone https://github.com/<your-username>/messerschmitt-foundation-gb.git
cd messerschmitt-foundation-gb
```

### Step 2 — Open in VS Code

```bash
code .
```

### Step 3 — Run a local server

The site is pure static HTML/CSS/JS and can be served by any static file server.

**Option A — VS Code Live Server extension**

1. Install the **Live Server** extension (ritwickdey.LiveServer).
2. Open `index.html`.
3. Click **"Go Live"** in the status bar, or run the command:
   ```bash
   # Command Palette (Ctrl+Shift+P) → "Live Server: Open with Live Server"
   ```
4. The site opens at `http://127.0.0.1:5500`.

**Option B — Python's built-in server**

```bash
python3 -m http.server 8000
```

Then visit <http://localhost:8000> in your browser.

> **Tip:** Always serve over HTTP — opening `index.html` directly via `file://` may
> restrict some modern browser features.

---

## Image Replacement & Media Asset Pipeline

The site currently ships with structured **media placeholders** — styled CSS containers
with aspect-ratio locking, subtle grid backgrounds, and caption badges. No external image
URLs are hard-coded, so nothing can ever break the layout.

### Where the placeholders live

Each exhibit and the hero use a `.media-placeholder` element:

```html
<div class="media-placeholder hero-placeholder" role="img"
     aria-label="Exhibit photo placeholder for the ME 200">
  <svg class="placeholder-icon" ...></svg>
  <span class="placeholder-badge">Exhibit Photo Placeholder — ME 200</span>
  <span class="placeholder-caption">1958 Messerschmitt KR200 · 16:9</span>
</div>
```

### Replacing a placeholder with a real image

**1. Add your assets.** Create the folder and drop in optimised high-resolution images:

```bash
mkdir -p assets/images
# e.g. assets/images/me200.jpg, assets/images/kr175.jpg,
#      assets/images/tg500.jpg, assets/images/og-cover.jpg
```

**2. Swap the markup.** Replace the `.media-placeholder` block with a semantic figure:

```html
<figure class="media-figure">
  <img
    class="media-image"
    src="assets/images/me200.jpg"
    alt="A 1958 Messerschmitt KR200 in original specification, side view, cream finish"
    width="1600"
    height="900"
    loading="lazy">
  <figcaption>ME 200 — 1958 Messerschmitt KR200</figcaption>
</figure>
```

**3. Add the accompanying styles** (append to `styles.css`):

```css
.media-figure {
  margin: 0;
  border-radius: var(--radius-md);
  overflow: hidden;
  border: 1px solid var(--color-border);
  background: var(--color-placeholder);
}

.media-image {
  width: 100%;
  height: auto;
  aspect-ratio: 16 / 9;
  object-fit: cover;
  display: block;
}

.media-figure figcaption {
  padding: 0.6rem 1rem;
  font-size: 0.85rem;
  color: var(--color-text-light);
  background: var(--color-surface);
}
```

> `aspect-ratio` and `object-fit: cover` preserve the exact placeholder geometry, so the
> swap never shifts the layout. Always supply descriptive `alt` text (do not repeat the
> caption verbatim) and declare `width`/`height` to prevent layout shift.

### Recommended asset checklist

| Asset | Location | Suggested dimensions |
| ----- | -------- | -------------------- |
| ME 200 hero shot | `assets/images/me200.jpg` | 1600 × 900 (16:9) |
| KR175 exhibit | `assets/images/kr175.jpg` | 1200 × 900 (4:3) |
| FMR Tg500 exhibit | `assets/images/tg500.jpg` | 1200 × 900 (4:3) |
| Open Graph cover | `assets/images/og-cover.jpg` | 1200 × 630 (OG spec) |

---

## Deployment Guide (GitHub Pages)

### 1. Initialise the repository

If you haven't already:

```bash
git init
git add -A
git commit -m "Initial commit: Messerschmitt Foundation of Great Britain site"
```

### 2. Create a GitHub repository

1. Go to <https://github.com/new>.
2. Name it, e.g. `messerschmitt-foundation-gb`.
3. Do **not** initialise with a README (this one is coming).
4. Click **Create repository**.

### 3. Push to GitHub

```bash
git branch -M main
git remote add origin https://github.com/<your-username>/messerschmitt-foundation-gb.git
git push -u origin main
```

### 4. Enable GitHub Pages

1. On GitHub, open your repository.
2. Go to **Settings** → **Pages**.
3. Under **Build and deployment**, set **Source** to **Deploy from a branch**.
4. Select branch `main` and folder `/ (root)`.
5. Click **Save**.

Your site will be live within a few minutes at:

```
https://<your-username>.github.io/messerschmitt-foundation-gb/
```

### 5. Post-deploy checks

- [ ] Update the `og:url` and `og:image` meta tags in `index.html` to your live URL.
- [ ] Update the JSON-LD `url` to the live domain.
- [ ] Replace `your-username` in the README commands with your actual username.
- [ ] Optionally configure a custom domain under **Settings → Pages → Custom domain**.

### Subsequent updates

GitHub Pages rebuilds automatically on every push to `main`:

```bash
git add -A
git commit -m "Update exhibit content"
git push origin main
```

---

## Docker & Hetzner VPS Deployment

The repository ships with Docker tooling so the site can be self-hosted on a
Hetzner VPS (or any Linux server) as a tiny nginx container — no build step, no
runtime dependencies.

### Included files

| File | Purpose |
| ---- | ------- |
| `Dockerfile` | Multi-stage image: copies the static site into `nginx:alpine`. |
| `nginx.conf` | Static-asset tuning: gzip, cache headers, security headers. |
| `docker-compose.yml` | One-command build & run with `restart` + healthcheck. |
| `.dockerignore` | Keeps the Docker build context (and image) lean. |
| `Makefile` | Convenience shortcuts for `build`, `run`, `stop`, `logs`, etc. |

### 1. Provision a Hetzner VPS

Create a CX-series (or larger) VPS running Ubuntu 24.04, then connect over SSH:

```bash
ssh root@<your-vps-ip>
```

### 2. Install Docker Engine & Compose plugin

```bash
# Official convenience install (installs Docker + the Compose plugin)
curl -fsSL https://get.docker.com | sh

# Allow your user to run docker without sudo (log out/in afterwards)
usermod -aG docker $USER

# Verify
docker --version
docker compose version
```

### 3. Clone the repository

```bash
git clone https://github.com/fraserbyte/MFGB.com.git /opt/mfgb
cd /opt/mfgb
```

### 4. Build and start the site

```bash
docker compose up -d --build
```

The site is now live at `http://<your-vps-ip>`. Verify:

```bash
docker compose ps            # container should report "healthy"
curl -I http://localhost     # expect HTTP/1.1 200
```

### 5. Open the firewall

```bash
ufw allow OpenSSH
ufw allow 80/tcp
ufw allow 443/tcp
ufw enable
```

### 6. Add HTTPS with Caddy (recommended)

Caddy issues and renews Let's Encrypt certificates automatically with minimal
config. Install it on the host and reverse-proxy to the nginx container:

```bash
# /etc/caddy/Caddyfile
your-domain.com {
    reverse_proxy 127.0.0.1:80
}
```

```bash
systemctl enable --now caddy
```

(Alternative: publish the container on ports 80/443 and use `certbot` with
nginx directly.)

### Updating the site

```bash
cd /opt/mfgb
git pull
docker compose up -d --build
```

HTML is served with `no-cache` so browsers revalidate immediately after each
deploy; media is served with long-lived immutable caching for speed.

---

## Contributing Guidelines

Contributions that support the accurate documentation of historic vehicles are very
welcome. Please keep the following conventions in mind:

1. **Accuracy first** — this is a heritage project. Verify chassis numbers, dates, and
   specifications against primary sources before contributing content.
2. **Open an issue** for substantial changes or new sections before opening a pull request.
3. **Keep it static** — maintain the zero-dependency, no-build philosophy of this repo.
4. **Accessibility** — new markup must preserve the existing ARIA patterns and WCAG AA
   contrast levels.
5. **Commit messages** — use the conventional format, e.g.
   `feat: add Tg500 archive page`, `fix: correct KR200 production dates`.

Suggested contribution areas:

- Digitised archive documents (factory blueprints, period brochures).
- Restoration notes and technical reference articles.
- Verified owner registrations for the Community Registry.
- Photography for the media pipeline described above.

---

## License

Released under the [MIT License](LICENSE). The Messerschmitt name and marque remain the
property of their respective rights holders and are referenced here for historical and
educational purposes only.

© 2026 Messerschmitt Foundation of Great Britain. Dedicated to preserving automotive
engineering history.
