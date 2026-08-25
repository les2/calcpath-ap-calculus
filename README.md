# Full Dive AP — offline-ready course guides

[![Validate](https://github.com/les2/calcpath-ap-calculus/actions/workflows/ci.yml/badge.svg)](https://github.com/les2/calcpath-ap-calculus/actions/workflows/ci.yml)
[![Deploy GitHub Pages](https://github.com/les2/calcpath-ap-calculus/actions/workflows/deploy-pages.yml/badge.svg)](https://github.com/les2/calcpath-ap-calculus/actions/workflows/deploy-pages.yml)
[![Support on Ko-fi](https://ko-fi.com/img/githubbutton_sm.svg)](https://ko-fi.com/5reason)

Full Dive AP is a reusable framework for complete course roadmaps, trusted resources, printable references, and private training sessions. One data-driven Angular PWA can host many courses without duplicating the application. AP Calculus AB + BC is the first course package.

The existing repository and site URLs intentionally keep the CalcPath name for now. The currently published AP Calculus release is at [calcpath-ap-calculus.les2.chatgpt.site](https://calcpath-ap-calculus.les2.chatgpt.site/roadmap), and the source remains at [github.com/les2/calcpath-ap-calculus](https://github.com/les2/calcpath-ap-calculus). This Full Dive AP generalization should be tested locally before it replaces that release.

## What students get

- A searchable, bookmarkable roadmap for each available course
- Curated videos, authoritative references, and free tools
- A print-optimized reference guide with real TeX mathematics and accessible MathML
- Private Training Mode sessions with sourced questions, timers, self-grading, filters, and resumable sessions
- An installable PWA that keeps the application and course datasets available offline after the first successful load
- Update detection, responsive layouts, dark mode, and clean history-based routes

External videos, websites, and calculators still require internet access. Progress and study sessions stay on the student's device; Full Dive AP has no student accounts or analytics database.

## One shell, many course packages

```text
public/data/
├── app.json
├── courses.json
└── courses/
    └── ap-calculus/
        ├── course.json
        ├── roadmap.json
        ├── tools.json
        ├── reference.json
        └── practice.json

public/schemas/
├── app.schema.json
├── courses.schema.json
├── course.schema.json
├── roadmap.schema.json
├── tools.schema.json
├── reference.schema.json
├── practice.schema.json
└── build-info.schema.json
```

The shell discovers courses through `courses.json`. Each catalog item points to a manifest that supplies its data files, navigation, headings, descriptions, filters, accents, quality targets, and course disclaimer. Angular pages contain shared behavior, not AP Calculus-specific branches.

Read [the data architecture](docs/data-architecture.md) for the runtime and storage model. Follow [the course-authoring guide](docs/course-authoring.md) when adding a class. Coding agents can use the checked-in `.agents/skills/add-study-course/` skill, which encodes the same workflow and verification rules.

## Course routes

Each available course gets the same top-level structure:

- `/courses` — data-driven course catalog
- `/courses/:courseId/roadmap` — curriculum, search, filters, and progress
- `/courses/:courseId/tools` — curated calculators and learning tools
- `/courses/:courseId/reference` — printable formula/reference guide
- `/courses/:courseId/training` — private, persistent training sessions

Course IDs also namespace roadmap progress, IndexedDB catalogs, and study sessions. The legacy IndexedDB database name is retained solely so existing AP Calculus sessions can migrate safely.

## Add another course

1. Choose a stable lowercase kebab-case ID such as `ap-physics-1`.
2. Create `public/data/courses/<course-id>/` with a manifest and all four datasets.
3. Point each file at its JSON Schema and keep course-specific copy/configuration in the manifest.
4. Register the manifest in `public/data/courses.json`.
5. Run `npm run validate:data`, `npm test`, and `npm run build`.
6. Test every course route, printing, saved state, and offline behavior before publishing.

The detailed checklist and field responsibilities live in [docs/course-authoring.md](docs/course-authoring.md).

## Practice-question trust rules

Full Dive AP does not allow AI-authored or AI-modified practice questions. Embedded questions are faithful, format-only transcriptions of openly licensed publisher material, with exact locators for the publisher's question and supplied answer. If republication or the answer cannot be verified, the item must remain an external link.

Publishers are normalized in a `sources` registry and questions refer to them by `sourceId`. Records also carry a course/topic mapping, license, source exercise ID, transcription status, verification date, format, difficulty, calculator policy, estimated time, and tags. The non-negotiable rules are in [AGENTS.md](AGENTS.md), and validation rejects incomplete provenance.

The AP Calculus package currently contains 1,164 sourced practice records from seven collections, including 555 embedded OpenStax items: five publisher-authored questions with publisher-supplied answers for each of the 111 roadmap topics. Difficulty is Full Dive AP editorial metadata; it is not a publisher rating and never changes the mathematics.

## Run it locally

This project requires Node.js 22.22.3 or newer.

```bash
npm install
npm run dev
```

Open the address printed by Angular, then start at `/courses`. Before committing a change, run:

```bash
npm run build
```

The build runs unit tests, validates every registered course package and cross-dataset relationship, generates version information, produces the Angular PWA, and prepares the hosted Site worker.

Useful individual commands:

```bash
npm test                 # Angular/Vitest unit tests
npm run validate:data    # all JSON Schemas and semantic data rules
npm run mine:practice    # reproducible AP Calculus catalog refresh
```

## Why these technologies fit the product

| Product need | Choice | Why |
| --- | --- | --- |
| One app for many classes | JSON course catalog + manifests | New course content can be added without forking the UI. |
| Install without native app stores | [Progressive Web App](https://www.w3.org/TR/appmanifest/) | Supporting browsers can add Full Dive AP to a home screen or launcher. |
| Work through bad Wi-Fi | [Angular service worker](https://angular.dev/ecosystem/service-workers) | The shell and local course datasets are cached after the first visit. |
| Share and resume a precise view | [Angular Router](https://angular.dev/guide/routing) | Course and page identity live in clean URLs; roadmap state can use query parameters. |
| Make content portable and checkable | JSON + [JSON Schema 2020-12](https://json-schema.org/draft/2020-12) | Humans and tools can inspect the same explicit contracts before runtime. |
| Save structured private study data | [IndexedDB](https://developer.mozilla.org/en-US/docs/Web/API/IndexedDB_API) through [Dexie](https://dexie.org/) | Large catalogs and training sessions remain queryable, offline, and local to the browser. |
| Typeset math professionally | [KaTeX](https://katex.org/) | TeX renders quickly as readable HTML plus MathML and prints cleanly. |
| Maintain an accessible app shell | [Angular](https://angular.dev/) + [Angular Material](https://material.angular.dev/) | Routing, components, forms, accessibility foundations, and testing share one supported stack. |
| Reject broken data before release | [AJV](https://ajv.js.org/) + [Vitest](https://vitest.dev/) | Schemas, semantic checks, migrations, and interaction logic run in automated builds. |
| Publish inspectable source | [GitHub](https://github.com/) + [GitHub Actions](https://docs.github.com/en/actions) | Forks, pull requests, validation, and GitHub Pages deployment remain public and repeatable. |
| Offer a managed public home | [ChatGPT Sites](https://learn.chatgpt.com/docs/sites) | The app can be hosted without operating a custom application server. |

The header's optional Ko-fi support control is an ordinary themed Angular link rather than a third-party script. Ko-fi loads only after a visitor deliberately follows it, so it does not add runtime tracking or weaken offline behavior.

## Beginner setup: make your own

1. Create a free [GitHub account](https://github.com/signup).
2. Open the [Full Dive AP repository](https://github.com/les2/calcpath-ap-calculus) and choose **Fork**.
3. Install [GitHub Desktop](https://desktop.github.com/download/), sign in, and clone your fork.
4. Install the [ChatGPT desktop app](https://chatgpt.com/download/) and open the cloned folder in Codex.
5. Ask ChatGPT to read `AGENTS.md`, `docs/course-authoring.md`, and the `add-study-course` skill before creating your subject package.
6. Run the local checks, review the app yourself, then commit and push with GitHub Desktop.
7. If you want a GitHub Pages mirror, open **Settings → Pages**, choose **GitHub Actions**, and use the included workflow after updating the repository base path if your fork has a different name.

GitHub explains how to [fork and clone with GitHub Desktop](https://docs.github.com/en/desktop/adding-and-cloning-repositories/cloning-and-forking-repositories-from-github-desktop) and [configure Pages](https://docs.github.com/en/pages/getting-started-with-github-pages/using-custom-workflows-with-github-pages).

## How this was made with ChatGPT

The project was built collaboratively in the [ChatGPT desktop app](https://chatgpt.com/download/) with Codex and Sites. The human defined the audience, trust boundaries, content goals, product language, and interaction feedback. ChatGPT helped research implementation choices, change the Angular source, structure and validate data, add tests, configure deployment, and iterate from hands-on review.

The productive loop was: describe the outcome and constraints, build the smallest real version, use it, identify concrete friction, verify important content against primary sources, and repeat. The checked-in schemas, contributor rules, course documentation, and skill now preserve those decisions for future people and agents.

### Condensed prompt to recreate the pattern

```text
Build a public, installable, offline-ready study framework named [name]. It
must support multiple courses through a top-level JSON catalog and one
self-contained, schema-validated data package per course. Each package has a
manifest, roadmap, tools, printable TeX reference, and sourced practice catalog.

Use clean course-scoped routes, a responsive accessible UI, PWA updates, and
IndexedDB for private course-scoped progress. Never upload student data. Cache
the app and JSON for offline use; external resources can require internet.

Do not invent or alter practice questions. Embed only faithful, format-only
transcriptions whose license permits republication and whose publisher supplies
an answer; store exact problem and answer locators. Otherwise link externally.

Create JSON Schema contracts, semantic validation, tests, beginner-facing
course-authoring documentation, and an agent skill for adding courses. Show me
a local working version for review before pushing or deploying anything.
```

Full Dive AP is free to use and fork. If it helps, support is optional through [Ko-fi](https://ko-fi.com/5reason). AP Calculus is an independent study aid and is not affiliated with or endorsed by College Board.
