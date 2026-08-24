# CalcPath — AP Calculus Roadmap

[![Validate](https://github.com/les2/calcpath-ap-calculus/actions/workflows/ci.yml/badge.svg)](https://github.com/les2/calcpath-ap-calculus/actions/workflows/ci.yml)
[![Deploy GitHub Pages](https://github.com/les2/calcpath-ap-calculus/actions/workflows/deploy-pages.yml/badge.svg)](https://github.com/les2/calcpath-ap-calculus/actions/workflows/deploy-pages.yml)
[![Support CalcPath on Ko-fi](https://ko-fi.com/img/githubbutton_sm.svg)](https://ko-fi.com/5reason)

CalcPath is an installable, offline-ready study guide for AP Calculus AB and BC. It organizes all 111 curriculum topics into a searchable roadmap with video lessons, authoritative references, free math tools, local progress tracking, and a printable formula guide.

## Try the app

**[Open CalcPath](https://calcpath-ap-calculus.les2.chatgpt.site/roadmap)**

[GitHub Pages mirror](https://les2.github.io/calcpath-ap-calculus/) — rebuilt and published automatically after every push to `main`.

The guide works offline after the first successful visit. Videos, references, and external calculator tools still require an internet connection.

CalcPath is free to use and fork. If it helped you, you can optionally [leave a tip on Ko-fi](https://ko-fi.com/5reason).

## What CalcPath includes

- Every AP Calculus AB and BC curriculum topic
- AB/BC filters and full-text search
- Organic Chemistry Tutor lessons where suitable videos are available
- Authoritative topic references
- Progress saved privately on the student's device
- An installable Progressive Web App with offline caching and update notifications
- Free, ad-free graphing, symbolic algebra, solver, and scientific tools
- A print-optimized reference guide with real TeX mathematics and accessible MathML
- Private, named Grade Maxxing study runs with a user-controlled timer, in-app Creative Commons questions, intentional external practice links, and local-only progress
- Clean, shareable routes, responsive layouts, and dark mode

## How this was made with ChatGPT

CalcPath was created collaboratively in the [ChatGPT desktop app](https://learn.chatgpt.com/docs/app) using ChatGPT Work, Codex, and [Sites](https://learn.chatgpt.com/docs/sites). The human supplied the product idea, audience, curriculum requirements, design direction, and ongoing feedback. ChatGPT helped turn that direction into a working Angular application, researched implementation choices, wrote and revised the source, added tests, connected GitHub, configured automated deployment, and published the live Site.

The useful pattern was not “give AI one sentence and accept whatever appears.” It was a short loop:

1. Describe the audience, purpose, constraints, and non-negotiable features.
2. Ask ChatGPT to build the smallest recognizable version.
3. Open it, try it, and report specific friction in ordinary language.
4. Ask ChatGPT to verify important content and technical decisions against primary sources.
5. Add tests and automatic deployment before inviting other people to rely on it.
6. Keep refining the source and the live app together.

### A condensed prompt you can reuse

Copy this prompt into ChatGPT, replace the bracketed parts, and attach any source material you want the app to follow:

```text
Build a public, installable, offline-ready roadmap app for [subject or goal].
The audience is [who it is for], so make it fast, welcoming, accessible, and
easy for a non-expert to navigate.

Use a modern web framework with clean URL routes and a responsive component
system. Make it a PWA that works offline after the first visit, detects updates,
and can be installed without a native app store. Keep editable curriculum and
resource content in JSON. Save personal progress only on the user's device.

Create these sections: [roadmap], [tools/resources], and [printable reference].
Use authoritative sources and link to them. Render mathematical notation with
real TeX/MathML, not plain text. Add tests, data validation, a public GitHub
repository, and GitHub Actions that validate pull requests and deploy pushes to
main. Include a beginner-friendly README explaining setup and customization.

Use Sites to publish a public version. Show me the working app early, then keep
iterating from my feedback. Do not stop at a mockup: build, test, publish, and
give me the repository and live URLs.
```

You do not need to know the right programming vocabulary. Describe what people should be able to do, what should happen when the internet disappears, what information must be trustworthy, and what currently feels confusing. ChatGPT can translate those product requirements into technical work.

## Beginner setup: make your own version

There are two reasonable paths. The first is almost entirely conversational. The second gives you a local copy and is best if you want to learn, inspect every change, or accept contributions.

### Path A: start in ChatGPT

1. Create or sign in to a [ChatGPT account](https://chatgpt.com/).
2. Install the [ChatGPT desktop app](https://chatgpt.com/download/) or use ChatGPT on the web. The [official quickstart](https://learn.chatgpt.com/docs/quickstart) explains the available surfaces.
3. In the desktop app, use **Work** for research and Sites, or choose **Codex** when you want ChatGPT to work directly with a local project folder.
4. Start with the reusable prompt above. Mention `@Sites` or explicitly ask for a website when you want ChatGPT to build and host it.
5. Review the preview, ask for changes in plain language, and test the important paths yourself.
6. In Sites, choose the intended audience only after checking the content, links, and privacy implications.

Sites can create and host a project without requiring you to configure a traditional web server. It also keeps versions, deployments, sharing settings, and basic analytics together. Availability and limits can depend on your ChatGPT plan or workspace.

### Path B: fork CalcPath and customize it

1. Create a free [GitHub account](https://github.com/signup). GitHub stores the source, tracks every revision, and runs the automated checks.
2. Open the [CalcPath repository](https://github.com/les2/calcpath-ap-calculus) and choose **Fork**. A fork is your own copy; changing it does not change the original project.
3. Install [GitHub Desktop](https://desktop.github.com/download/) and sign in. GitHub's [beginner guide](https://docs.github.com/en/desktop/overview/getting-started-with-github-desktop) explains cloning, commits, pushes, and branches without requiring terminal commands.
4. Clone your fork to a folder on your computer.
5. Open that folder in the ChatGPT desktop app under **Codex**. Ask: “Explain this project to a beginner, then help me replace the AP Calculus content with [my subject]. Preserve the offline PWA, tests, and deployment workflow.”
6. Most content lives in `public/data/`. Ask ChatGPT to edit those JSON files and to update tests whenever the structure changes.
7. Review the changes, commit them in GitHub Desktop, and push them to GitHub.
8. In your repository, open **Settings → Pages**, choose **GitHub Actions** as the source, and run the included deployment workflow. Update the repository name in the `build:pages` script if your fork uses a different name.

GitHub's guides explain how to [fork and clone with GitHub Desktop](https://docs.github.com/en/desktop/adding-and-cloning-repositories/cloning-and-forking-repositories-from-github-desktop) and [configure GitHub Pages](https://docs.github.com/en/pages/getting-started-with-github-pages/using-custom-workflows-with-github-pages).

### Optional: run it on your computer

Local development is useful but not required for changing simple content with ChatGPT.

1. Install the current supported [Node.js](https://nodejs.org/en/download) release. This project requires Node.js 22.22.3 or newer.
2. Open a terminal in the cloned project folder.
3. Install the project and start the development server:

```bash
npm install
npm run dev
```

4. Open the local address printed in the terminal. Changes appear while the server is running.
5. Before pushing, run the same checks used by GitHub:

```bash
npm run build
```

If a command fails, copy the complete error into ChatGPT and ask it to diagnose the cause before changing anything.

## Why these technologies were chosen

The architecture starts with what the app should do, not with fashionable tools.

| Product goal | Choice | Why it fits |
| --- | --- | --- |
| Open instantly on phones and computers | Web application | One link works across modern browsers; there is no separate iOS, Android, Windows, or macOS codebase. |
| Install without an app store | [Progressive Web App](https://www.w3.org/TR/appmanifest/) and web app manifest | Supporting browsers can add CalcPath to the home screen or app launcher while updates still come from the web. |
| Keep the guide available during bad Wi-Fi or travel | [Angular service worker](https://angular.dev/ecosystem/service-workers) | It caches the application shell, curriculum JSON, formulas, icons, and math fonts after the first visit. External links remain online resources. |
| Update safely | Versioned service-worker builds plus an in-app update notice | A newly published version downloads in the background; the student chooses when to reload, and locally saved progress remains intact. |
| Make sections bookmarkable and shareable | [Angular Router](https://angular.dev/guide/routing) with clean history-based routes | `/roadmap`, `/tools`, and `/reference` behave as distinct pages, while search/filter state can live in the URL. |
| Make content easy to replace | Plain JSON files | A teacher—or ChatGPT—can edit topics, tools, and formulas without redesigning the application. JSON is portable and easy to validate. |
| Keep student progress private and simple | Browser local storage | Checks and theme preferences stay on that device. CalcPath does not need accounts, a remote database, or a student-data backend. |
| Show mathematics as mathematics | [KaTeX](https://katex.org/) with TeX and MathML | Fractions, radicals, integrals, identities, and print output use professional mathematical typesetting with an accessible representation. |
| Use a consistent, accessible interface | [Angular](https://angular.dev/) and [Angular Material](https://material.angular.dev/) | Angular supplies structured components, routing, forms, and testing; Material provides a maintained UI foundation. |
| Catch mistakes before publishing | [Vitest](https://vitest.dev/) plus custom data checks | Unit tests cover roadmap behavior, while validation checks topic counts, unique IDs, HTTPS links, and every TeX expression. |
| Let anyone inspect and improve it | Public [GitHub](https://github.com/) repository | The full history is visible, forks are easy to create, and contributions can be reviewed as pull requests. |
| Publish every approved change automatically | [GitHub Actions](https://docs.github.com/en/actions) and [GitHub Pages](https://docs.github.com/en/pages) | Pull requests are checked automatically; pushes to `main` rebuild and publish the public mirror without manual file uploads. |
| Provide a managed public home | [ChatGPT Sites](https://learn.chatgpt.com/docs/sites) | Sites handles the hosted project, public URL, versions, deployments, access settings, and analytics while the same source remains on GitHub. |

### Optional creator support without a third-party widget

CalcPath's header includes a small **Leave a tip** link to [Ko-fi](https://ko-fi.com/5reason). Ko-fi supplies floating widgets and embedded panels, but it also explicitly supports creating a button in your own style and linking it directly to your Ko-fi page. CalcPath uses that simpler approach:

- No third-party JavaScript is loaded while students study.
- The PWA shell remains fully available offline.
- Ko-fi opens only when someone deliberately follows the link.
- The control automatically matches CalcPath's light and dark themes.
- The support link is isolated in a reusable Angular component.

The essential Angular template is ordinary accessible HTML:

```html
<a
  class="support-link"
  href="https://ko-fi.com/5reason"
  target="_blank"
  rel="noopener noreferrer"
  aria-label="Leave a tip for CalcPath on Ko-fi (opens in a new tab)"
>
  <span aria-hidden="true">☕</span>
  <span>Leave a tip</span>
</a>
```

Replace `5reason` with your Ko-fi username and style the link like any other component. For a GitHub README, Ko-fi provides a hosted badge:

```markdown
[![Support me on Ko-fi](https://ko-fi.com/img/githubbutton_sm.svg)](https://ko-fi.com/yourusername)
```

See Ko-fi's official guides to its [tip widgets and custom buttons](https://help.ko-fi.com/hc/en-us/articles/360018381678-Ko-fi-tip-widget) and [brand assets](https://help.ko-fi.com/hc/en-us/articles/360007169493-Can-I-use-the-Ko-fi-logo-to-promote-my-page).

### Why there is no database

CalcPath does not have shared accounts, teacher dashboards, synced progress, comments, or user-generated records. Its durable content ships as files, and personal state belongs to the browser. A database would add cost, privacy questions, migrations, and failure modes without improving the current experience. If a future version genuinely needs progress shared across devices, that would be the point to design authentication and storage deliberately.

## Project map

```text
src/app/                 Angular pages, routing, and components
public/data/             Curriculum, tools, and TeX formula content
public/manifest.webmanifest
                         Installable-app name, icons, scope, and colors
ngsw-config.json         Offline cache policy
scripts/                 Data checks and deployment preparation
.github/workflows/       Pull-request validation and Pages deployment
worker/                  Clean-route fallback for the primary hosted Site
.openai/hosting.json     Link to the ChatGPT Sites project
```

There is intentionally no `db/`, `drizzle/`, or D1 example code. The app does
not use a server database. Its versioned JSON catalog is the canonical published
copy; the browser normalizes that catalog into [IndexedDB](https://developer.mozilla.org/en-US/docs/Web/API/IndexedDB_API)
through [Dexie](https://dexie.org/docs/Tutorial/Angular), a typed IndexedDB wrapper,
for fast structured queries and offline access. Study sessions live in a
separate IndexedDB object store and are never uploaded. Existing sessions are
migrated automatically from the earlier `localStorage` format. The service
worker still caches the application shell and transport responses; IndexedDB
stores the app’s structured records.

## Application routes

- `/roadmap` — searchable curriculum with URL-backed `q`, `course`, and `unit` state
- `/tools` — curated calculators, solvers, and computer algebra systems
- `/reference` — standalone printable formula and identity guide
- `/grade-maxxing` — persistent named study runs with a total timer, self-grading, licensed question attribution, and device-local progress

## Automated quality checks

`npm run build` runs the unit tests and validates the curriculum data before producing a production Site build. The checks currently verify:

- Roadmap filtering, AB/BC selection, progress calculations, and completion toggles
- Exactly 10 units and 111 unique curriculum topic IDs
- Required unit metadata and HTTPS resource links
- Tool names and HTTPS URLs
- Non-empty formula groups and valid KaTeX/TeX expressions

The **Validate** GitHub workflow runs on every push and pull request. The **Deploy GitHub Pages** workflow repeats the checks and publishes only a successful `main` build.

## Practice-question sourcing

CalcPath does not allow AI-authored or AI-modified practice questions. Embedded
questions must be faithful, format-only transcriptions of openly licensed
material with exact publisher locators for both the problem and its published
answer. Link-only questions remain on the publisher's site. The complete rules
for people and coding agents are in [AGENTS.md](AGENTS.md), and the data
validator enforces the required provenance fields.

The beta practice catalog currently contains 1,089 records from seven source
collections published by University of Michigan Mathematics, Active Calculus,
College Board, Paul’s Online Math Notes, and OpenStax. The 480 embedded OpenStax
records provide five publisher-authored questions and publisher-supplied
answers for every Unit 1 through Unit 9 roadmap topic.
They are mechanically converted from a pinned revision of the openly licensed
source CNXML, including tables and referenced figures; CalcPath does not
rewrite the mathematics.

The JSON data model stores publishers once in a normalized `sources` registry.
Each compact question stores a `sourceId` plus its exact exercise, problem, and
answer locators. Records also include roadmap topic, course, format, difficulty,
calculator policy, estimated time, collection or year, and skill tags. Run
`npm run mine:practice` to refresh the reproducible catalog from the curated
source map; review the result before committing it.

The Grade Maxxing builder can filter that catalog by publisher site, broad
problem type, content delivery (`Embedded` or `External`), and four beta
difficulty bands: easy, medium, hard, and ridiculous.
Difficulty is CalcPath editorial metadata, not a rating supplied by
the publishers. The reproducible catalog script assigns it from each problem’s
source context and relative placement within its published set; it never edits
or attempts to reinterpret the mathematics.

## Curriculum source

Topic organization and exam weighting follow the [College Board AP Calculus AB and BC Course and Exam Description](https://apcentral.collegeboard.org/media/pdf/ap-calculus-ab-and-bc-course-and-exam-description.pdf).

CalcPath is an independent study aid and is not affiliated with or endorsed by College Board. External resources remain the property of their respective publishers.
