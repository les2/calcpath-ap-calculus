# Add a course to Full Dive AP

Use this process for a new course package. People and coding agents follow the same contracts.

## 1. Choose the course ID

Use a stable lowercase kebab-case ID such as `ap-physics-1`. Create `public/data/courses/<course-id>/`. Copying the AP Calculus directory is useful for shape, but replace every piece of course-specific content and attribution.

## 2. Create the manifest

Add `course.json` and validate it with `public/schemas/course.schema.json`. The manifest defines:

- identity, accent color, and disclaimer;
- expected unit/topic/practice coverage;
- relative names of the four datasets;
- top navigation labels and paths;
- page headings, descriptions, search labels, filters, visuals, source display names, and unit accents.

Keep presentation copy here instead of adding course-name checks to Angular components.

## 3. Create all four datasets

Every available course has the same package surface:

| File | Contract | Purpose |
| --- | --- | --- |
| `roadmap.json` | `roadmap.schema.json` | Units, topics, video links, authoritative references |
| `tools.json` | `tools.schema.json` | Curated tools grouped by task |
| `reference.json` | `reference.schema.json` | Printable labels and TeX formulas |
| `practice.json` | `practice.schema.json` | Normalized source registry and embedded/external questions |

Set each document's `$schema` to `../../../schemas/<name>.schema.json`. IDs must be unique within the course. Every practice `topicId` must exist in that course's roadmap.

Practice questions have stricter provenance rules. Read the repository `AGENTS.md` before adding them. Never invent, adapt, repair, simplify, or solve a published question. Embedded items require a license permitting republication, publisher-supplied answers, exact prompt and answer locators, and a verified format-only transcription. When those conditions are not met, make the item external.

## 4. Register the package

Add one entry to `public/data/courses.json`. Use status `available` only when the manifest and all four datasets exist and pass validation. Use `coming-soon` for a visible placeholder; unavailable entries are not routable.

## 5. Validate before opening the app

```bash
npm run validate:data
npm test
npm run build
```

Do not weaken a schema or quality threshold merely to make incomplete data pass. Correct the record, lower a deliberately provisional expectation in the manifest with an explanation, or keep the course unavailable.

## 6. Test the course as a user

Run `npm run dev`, open `/realms`, and verify:

- the card and accent come from the catalog;
- all four course routes load directly and after refresh;
- roadmap filters and URLs survive navigation;
- TeX renders on screen and prints legibly;
- practice filters, source attribution, answers, timers, and saved sessions work;
- data remains available after an online first load followed by an offline reload in a production/PWA build;
- another course's progress or training sessions never appear.

Only publish after the local review is accepted.
