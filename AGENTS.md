# Full Dive AP contributor rules

These instructions apply to every person or AI agent working in this repository.

## Practice-question provenance is non-negotiable

Full Dive AP may transcribe and format a published problem, but it must never invent,
adapt, repair, simplify, complete, remix, or solve a practice problem.

For an embedded question:

- Use only a source whose license explicitly permits republication.
- Record an exact, stable locator for the published question and for its
  publisher-supplied answer or solution.
- Copy the complete question and answer. Preserve every constant, variable,
  condition, instruction, and subpart.
- Permitted changes are mechanical presentation only: TeX normalization, line
  wrapping, accessible labels, and typographic punctuation that does not alter
  meaning.
- Do not write an answer, hint, explanation, title, or intermediate step that
  was not supplied by the publisher. If the publisher does not supply an
  answer, the problem cannot be embedded as an answered card.
- Do not freeze parameters from a randomized problem template. Keep randomized
  problems external unless the publisher provides a fixed, citable instance
  with a fixed answer.
- Attribution must say `Transcribed from ...` and identify the exact exercise.
  Never use vague language such as `adapted from`.
- Set the source record's transcription status to `format-only` and record the
  date it was checked against the source.

For an external question:

- Do not reproduce the question or answer unless its license permits that use.
- Link to the exact publisher problem and exact publisher answer when possible.
- Identify it as `link-only`; do not imply that Full Dive AP verified an AI-created
  solution.

Before committing practice data, manually compare the rendered card with both
source locators and run `npm run validate:data`. The validator must reject an
embedded question without its exercise identifier, question locator, answer
locator, permitted license, verification date, and `format-only` status. Never
weaken these checks to admit a questionable item; remove or quarantine the item
instead.

## Course packages are data, not page forks

Read [docs/data-architecture.md](docs/data-architecture.md) and
[docs/course-authoring.md](docs/course-authoring.md) before changing course
structure. Every course must use the shared catalog, manifest, four dataset
contracts, course-scoped routes, and course-scoped browser storage. Do not add
course-ID conditionals to page components when the value belongs in a manifest
or dataset. The repository skill at `.agents/skills/add-study-course/` encodes
the repeatable authoring and verification workflow.
