# Portfolio

A dark, cinematic developer portfolio built with React, Vite, TypeScript, Tailwind CSS, Motion for React, GSAP ScrollTrigger, Lenis, and Lucide React.

## Run Locally

```bash
npm install
npm run dev
```

## Verify

```bash
npm run lint
npm run build
```

## Edit Content

All editable portfolio content lives in `src/data/portfolio.ts`. Update education, certifications, experience, leadership/service, projects, notes, and social links there.

The portfolio intentionally omits street address, phone number, unsupported project links, and unverified certifications. Add project URLs or credential details only when they are ready to publish.

Keep the placeholder domain `https://example.com` updated before publishing. Also update `public/robots.txt`, `public/sitemap.xml`, and the metadata in `index.html` with the final domain.

## Motion

Lenis handles smooth scrolling, Motion for React handles component entrances and micro-interactions, and GSAP ScrollTrigger powers the desktop horizontal project sequence. Reduced-motion users get standard scrolling and non-pinned project cards.
