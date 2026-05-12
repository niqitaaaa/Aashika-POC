# Aashika-POC — BALCO Succession Intelligence (Fresh POC)

Fresh POC built from the `PRD.docx` content for the Strategic Succession Intelligence Platform.

## What this POC includes

- Strategic Dashboard with KPI cards
- Readiness distribution and role risk view
- Critical Role Explorer with 3 successors per role
- Tag gap comparison (STR/OPS/BUS/LEAD/TRANS)
- Scenario Planning (0–24 months)
- PRD-aligned formulas:
  - EDI Final = `ROUND((E + D + I)/3, 2)`
  - Tag Gap = `Role Tag Average - Successor Tag Average`
  - Readiness category thresholds
  - Bench Strength and Succession Readiness Index

## Run locally

```bash
npm install
npm run dev
```

## Build

```bash
npm run build
```

## Fresh hosted link (GitHub Pages)

This repo now includes a Pages deployment workflow at:

`/home/runner/work/Aashika-POC/Aashika-POC/.github/workflows/deploy-pages.yml`

After merging to `main` and enabling GitHub Pages for Actions, the site will be hosted at:

`https://niqitaaaa.github.io/Aashika-POC/`
