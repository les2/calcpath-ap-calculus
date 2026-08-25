# Full Dive AP data architecture

Full Dive AP is one application shell that can host many independent course packages. The shell owns routing, offline behavior, theming, course discovery, printable references, and private browser storage. A course owns its curriculum and all course-specific words, links, filters, colors, and practice material.

## Published data layout

```text
public/data/
├── app.json                         # global brand, repository, support, footer
├── courses.json                     # top-level course catalog
└── courses/
    └── ap-calculus/
        ├── course.json              # manifest, page copy, navigation, data pointers
        ├── roadmap.json             # units, topics, videos, references
        ├── tools.json               # course-appropriate tools
        ├── reference.json           # printable TeX reference groups
        └── practice.json            # normalized sources and sourced questions

public/schemas/                      # JSON Schema 2020-12 contracts
```

`courses.json` is the only discovery index. An available course points to its `course.json`; the manifest then points to that course's four datasets. Dataset URLs are resolved relative to the manifest, so packages remain self-contained and portable.

## Runtime flow

1. The shell loads `app.json` and `courses.json`.
2. `/courses` renders the catalog without hard-coded course cards.
3. `/courses/:courseId/...` loads the selected manifest.
4. Each page asks for its named dataset through `CourseDataService`.
5. The service worker caches `/data/**` and `/schemas/**` with the application shell for offline use.
6. Practice data is normalized into IndexedDB through Dexie. Study runs and roadmap progress are namespaced by course ID and never uploaded.

The IndexedDB database intentionally keeps its historical `calcpath` name so an existing AP Calculus install can migrate its local study sessions. New browser keys use `full-dive-ap:<course-id>:`; reads also recognize the earlier `studypath:` keys. New records carry `courseId`, and catalog record keys include the course ID to prevent collisions between packages.

## Routes

Every course receives the same route family:

```text
/courses
/courses/:courseId/roadmap
/courses/:courseId/tools
/courses/:courseId/reference
/courses/:courseId/training
```

The old route shape is not a compatibility requirement. Course identity is explicit in every content route, so bookmark, query-string, progress, and practice state can be scoped correctly.

## Contracts and validation

All published JSON documents declare a `$schema`. The contracts are:

- `app.schema.json` — application-level brand and external links
- `courses.schema.json` — course discovery catalog
- `course.schema.json` — one course manifest and all page configuration
- `roadmap.schema.json` — units and topic resources
- `tools.schema.json` — grouped external tools
- `reference.schema.json` — printable label/TeX pairs
- `practice.schema.json` — source registry, licenses, locators, metadata, and question variants
- `build-info.schema.json` — generated release timestamp and version

Run `npm run validate:data` for schema validation plus cross-dataset rules. Those rules ensure manifest IDs and file references agree, roadmap IDs are unique, practice topics exist in the roadmap, source IDs resolve, TeX renders, links use HTTPS, and declared quality counts are met.

## What remains code

The shared interaction model remains Angular code: routing, filtering, checkboxes, timers, self-grading, storage, update prompts, and print behavior. Course identity, navigation, labels, page copy, content, filters, and data locations are configuration. A new course should not require a new Angular page or a conditional branch keyed to its ID.
