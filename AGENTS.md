# Project Rules

- Work directly in the repository root.
- Keep editable portfolio content centralized in `src/data/portfolio.ts`.
- Keep sections split under `src/sections` and reusable UI/layout pieces under `src/components`.
- Use Motion for React for component-level animation and GSAP ScrollTrigger only for scroll-linked sequences.
- Preserve reduced-motion support when changing animation code.
- Do not add real employers, metrics, degrees, or awards unless supplied by the portfolio owner.

## Verification

Run these before handing off changes:

```bash
npm run lint
npm run build
```
