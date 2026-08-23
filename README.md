# CalcPath — AP Calculus Roadmap

[![Validate](https://github.com/les2/calcpath-ap-calculus/actions/workflows/ci.yml/badge.svg)](https://github.com/les2/calcpath-ap-calculus/actions/workflows/ci.yml)
[![Deploy GitHub Pages](https://github.com/les2/calcpath-ap-calculus/actions/workflows/deploy-pages.yml/badge.svg)](https://github.com/les2/calcpath-ap-calculus/actions/workflows/deploy-pages.yml)

An offline-ready study guide for AP Calculus AB and BC. CalcPath organizes all 111 curriculum topics into a searchable roadmap with curated video lessons, authoritative references, free math tools, local progress tracking, and a printable formula sheet.

## Live website

**[Open CalcPath](https://calcpath-ap-calculus.les2.chatgpt.site/)**

[GitHub Pages mirror](https://les2.github.io/calcpath-ap-calculus/) — rebuilt and deployed automatically from `main`.

The guide itself works offline after the first visit. External videos, references, and calculator tools require an internet connection.

## Features

- Complete AP Calculus AB and BC topic roadmap
- AB/BC filters and full-text topic search
- Organic Chemistry Tutor lessons where available
- Authoritative topic references
- Progress saved locally on the student's device
- Installable PWA with offline caching and update notifications
- Curated free, ad-free graphing, CAS, solver, and scientific tools
- Print-optimized derivative, integral, trigonometry, theorem, and algebra reference
- Responsive layout and dark mode

## Application routes

- `/roadmap` — searchable AP curriculum with URL-backed `q`, `course`, and `unit` state
- `/tools` — curated calculators, solvers, and computer algebra systems
- `/reference` — standalone printable formula and identity guide

## Data

Curriculum, tools, and formulas are maintained as JSON in `public/data/` so the guide can be updated without restructuring the application.

## Development

Built with Angular 22, Angular Router, Angular Material, and Angular's service worker. Requires Node.js 22.22.3 or newer.

```bash
npm install
npm run dev
npm run build
```

`npm run build` runs the unit tests and curriculum-data validation before producing the production site. Pull requests and pushes are checked by GitHub Actions; pushes to `main` also deploy the GitHub Pages mirror.

## Curriculum source

Topic organization and exam weighting follow the [College Board AP Calculus AB and BC Course and Exam Description](https://apcentral.collegeboard.org/media/pdf/ap-calculus-ab-and-bc-course-and-exam-description.pdf).

CalcPath is an independent study aid and is not affiliated with or endorsed by College Board.
