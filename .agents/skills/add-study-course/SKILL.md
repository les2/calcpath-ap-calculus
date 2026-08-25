---
name: add-study-course
description: Add or revise a Full Dive AP course package using the repository's catalog, manifest, four JSON dataset contracts, provenance policy, course-scoped storage model, validators, and shared Angular routes. Use when creating a new course, importing curriculum/resources/practice data, changing a course's structure, or auditing whether course content is fully data-driven.
---

# Add a Full Dive AP course

Build courses as data packages. Do not create a second application, duplicate page components, or add conditionals keyed to a course ID.

## Start with repository rules

1. Read `../../../AGENTS.md` completely. Its practice-question provenance rules are mandatory.
2. Read `../../../docs/course-authoring.md` and `../../../docs/data-architecture.md`.
3. Inspect `../../../public/data/courses.json`, all schemas in `../../../public/schemas/`, and one existing course package.

## Create the package

1. Choose a stable lowercase kebab-case course ID.
2. Create `public/data/courses/<course-id>/course.json` plus `roadmap.json`, `tools.json`, `reference.json`, and `practice.json`.
3. Put course identity, labels, navigation, filters, accents, page copy, and dataset pointers in the manifest. If a reasonable course needs new copy or configuration, extend the generic schema and TypeScript contract for every course; do not special-case it.
4. Add exactly one catalog entry to `public/data/courses.json`. Keep it `coming-soon` until the complete package validates.
5. Use normalized practice sources: define each publisher/source once and refer to it with `sourceId` from questions.
6. Use `courseId` in browser-persisted records and `full-dive-ap:<course-id>:` keys for any new local-storage state.

## Protect source fidelity

Never author or alter practice mathematics. Only mechanical transcription and display formatting are permitted for embedded material. Require an explicit reusable license, exact source exercise ID, exact prompt and answer URLs, publisher-supplied answer, `format-only` transcription status, and manual verification date. Otherwise store an external link-only item. Keep editorial metadata clearly separate from publisher facts.

## Verify

Run:

```bash
npm run validate:data
npm test
npm run build
```

Then start `npm run dev` and inspect the catalog plus all four routes for the new course. Confirm deep-link refresh, printing, responsive layout, and strict separation of saved state between courses. Never deploy or push unless the user explicitly asks after reviewing the local version.
