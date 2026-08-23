"use client";

import { useEffect, useMemo, useState } from "react";

type Topic = { id: string; title: string };
type Unit = { id: number; title: string; shortTitle: string; course: "AB + BC" | "BC only"; weight: string; color: string; reference: string; video: string; topics: Topic[] };
type Tool = { name: string; category: string; url: string; description: string; best: string };
type FormulaGroup = { title: string; items: [string, string][] };

const starterUnits: Unit[] = [
  { id: 1, title: "Limits and Continuity", shortTitle: "Limits", course: "AB + BC", weight: "AB 10–12% · BC 4–7%", color: "#ff6b35", reference: "https://en.wikipedia.org/wiki/Limit_of_a_function", video: "https://www.youtube.com/watch?v=YNstP0ESndU", topics: [{ id: "1.1", title: "Introducing Calculus" }, { id: "1.2", title: "Defining Limits and Using Limit Notation" }] },
  { id: 2, title: "Differentiation: Definition and Basic Rules", shortTitle: "Derivative rules", course: "AB + BC", weight: "AB 10–12% · BC 4–7%", color: "#5d3fd3", reference: "https://en.wikipedia.org/wiki/Derivative", video: "https://www.youtube.com/watch?v=5yfh5cf4-0w", topics: [{ id: "2.1", title: "Average and Instantaneous Rates of Change" }] },
  { id: 6, title: "Integration and Accumulation of Change", shortTitle: "Integrals", course: "AB + BC", weight: "AB/BC 17–20%", color: "#008f7a", reference: "https://en.wikipedia.org/wiki/Integral", video: "https://www.youtube.com/watch?v=Gc3QvUB0PkI", topics: [{ id: "6.1", title: "Exploring Accumulations of Change" }] },
  { id: 10, title: "Infinite Sequences and Series", shortTitle: "Sequences + series", course: "BC only", weight: "BC 17–18%", color: "#d73964", reference: "https://en.wikipedia.org/wiki/Series_(mathematics)", video: "https://www.youtube.com/results?search_query=The+Organic+Chemistry+Tutor+Taylor+series", topics: [{ id: "10.1", title: "Convergent and Divergent Infinite Series" }] },
];

function arrow(isSearch: boolean) { return isSearch ? "Find videos ↗" : "Watch lesson ↗"; }

export default function RoadmapApp() {
  const [units, setUnits] = useState<Unit[]>(starterUnits);
  const [tools, setTools] = useState<Tool[]>([]);
  const [formulaGroups, setFormulaGroups] = useState<FormulaGroup[]>([]);
  const [query, setQuery] = useState("");
  const [course, setCourse] = useState<"ALL" | "AB" | "BC">("ALL");
  const [expanded, setExpanded] = useState<number | null>(1);
  const [completed, setCompleted] = useState<string[]>([]);
  const [dark, setDark] = useState(false);
  const [updateReady, setUpdateReady] = useState(false);

  useEffect(() => {
    Promise.all([
      fetch("/data/topics.json").then((r) => r.json()),
      fetch("/data/tools.json").then((r) => r.json()),
      fetch("/data/formulas.json").then((r) => r.json()),
    ]).then(([topicData, toolData, formulaData]) => { setUnits(topicData.units); setTools(toolData.tools); setFormulaGroups(formulaData.groups); }).catch(() => undefined);
    try { setCompleted(JSON.parse(localStorage.getItem("calcpath-progress") || "[]")); setDark(localStorage.getItem("calcpath-theme") === "dark"); } catch { /* local storage may be unavailable */ }
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.register("/sw.js").then((registration) => {
        registration.addEventListener("updatefound", () => {
          const worker = registration.installing;
          worker?.addEventListener("statechange", () => { if (worker.state === "installed" && navigator.serviceWorker.controller) setUpdateReady(true); });
        });
      }).catch(() => undefined);
    }
  }, []);

  useEffect(() => { document.documentElement.dataset.theme = dark ? "dark" : "light"; localStorage.setItem("calcpath-theme", dark ? "dark" : "light"); }, [dark]);

  const visible = useMemo(() => units.map((unit) => ({ ...unit, topics: unit.topics.filter((topic) => `${unit.title} ${topic.title}`.toLowerCase().includes(query.toLowerCase())) })).filter((unit) => {
    const courseMatch = course === "ALL" || course === "BC" || unit.course === "AB + BC";
    return courseMatch && (unit.topics.length > 0 || (!query && unit.title.toLowerCase().includes(query.toLowerCase())));
  }), [units, query, course]);
  const totalTopics = units.reduce((sum, unit) => sum + unit.topics.length, 0);
  const progress = totalTopics ? Math.round((completed.length / totalTopics) * 100) : 0;

  function toggleTopic(id: string) {
    const next = completed.includes(id) ? completed.filter((topic) => topic !== id) : [...completed, id];
    setCompleted(next); localStorage.setItem("calcpath-progress", JSON.stringify(next));
  }

  return (
    <main>
      <header className="topbar">
        <a className="brand" href="#top" aria-label="CalcPath home"><span className="brand-mark">∫</span><span>CalcPath</span></a>
        <nav aria-label="Main navigation"><a className="active" href="#roadmap">Roadmap</a><a href="#tools">Tools</a><a href="#cheatsheet">Formula sheet</a></nav>
        <div className="header-actions"><span className="progress-pill"><b>{progress}%</b> complete</span><button className="icon-button" onClick={() => setDark(!dark)} aria-label="Toggle theme">{dark ? "☀" : "◐"}</button></div>
      </header>

      <section className="hero" id="top">
        <div className="hero-copy">
          <p className="eyebrow"><span>AP</span> CALCULUS · AB + BC</p>
          <h1>Your path through<br /><em>calculus.</em></h1>
          <p className="lede">Every topic, the clearest explanations, and the right tools—organized into one focused roadmap.</p>
          <div className="hero-actions"><a className="primary" href="#roadmap">Start learning <span>→</span></a><span className="offline-note"><i /> Guide works offline</span></div>
        </div>
        <div className="hero-art" aria-hidden="true">
          <div className="graph-card"><div className="axis x" /><div className="axis y" /><div className="curve">∿</div><span className="point p1" /><span className="point p2" /><small>f′(x)</small></div>
          <div className="formula-card">lim <span>sin x</span><br /><small>x→0&nbsp;&nbsp;&nbsp; x</small><b>= 1</b></div>
          <div className="mini-card">d/dx&nbsp; xⁿ <b>= nxⁿ⁻¹</b></div>
        </div>
      </section>

      <section className="roadmap-section" id="roadmap">
        <div className="section-heading"><div><p className="eyebrow">THE ROADMAP</p><h2>Ten units. One clear route.</h2></div><p>Follow the official AP sequence, or jump directly to what you need. BC includes all AB material.</p></div>
        <div className="progress-bar" aria-label={`${progress}% complete`}><span style={{ width: `${progress}%` }} /></div>
        <div className="controls">
          <label className="search"><span>⌕</span><input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search 111 topics…" /></label>
          <div className="segmented" aria-label="Course filter">{(["ALL", "AB", "BC"] as const).map((item) => <button key={item} className={course === item ? "selected" : ""} onClick={() => setCourse(item)}>{item === "ALL" ? "All topics" : item}</button>)}</div>
        </div>
        <div className="unit-list">
          {visible.map((unit) => {
            const open = expanded === unit.id;
            const done = unit.topics.filter((topic) => completed.includes(topic.id)).length;
            return <article className={`unit-row ${open ? "open" : ""}`} key={unit.id} style={{"--accent": unit.color} as React.CSSProperties}>
              <button className="unit-summary" onClick={() => setExpanded(open ? null : unit.id)} aria-expanded={open}>
                <span className="unit-number">{String(unit.id).padStart(2, "0")}</span>
                <span className="unit-title"><span className="unit-meta"><i>{unit.course}</i><i>{unit.weight}</i></span><strong>{unit.title}</strong><small>{done}/{unit.topics.length} topics complete</small></span>
                <span className="unit-toggle">{open ? "−" : "+"}</span>
              </button>
              {open && <div className="topic-panel">
                <div className="resource-strip"><div><b>Start here</b><span>Clear video instruction + a reference for deeper reading.</span></div><a className="video-link" href={unit.video} target="_blank" rel="noreferrer">▶ {arrow(unit.video.includes("results?"))}</a><a href={unit.reference} target="_blank" rel="noreferrer">Reference ↗</a></div>
                <div className="topic-list">{unit.topics.map((topic) => <label className={`topic-item ${completed.includes(topic.id) ? "done" : ""}`} key={topic.id}>
                  <input type="checkbox" checked={completed.includes(topic.id)} onChange={() => toggleTopic(topic.id)} /><span className="check">✓</span><b>{topic.id}</b><span>{topic.title}</span><a href={`${unit.video.includes("results?") ? unit.video + "+" + encodeURIComponent(topic.title) : unit.video}`} target="_blank" rel="noreferrer" aria-label={`Video for ${topic.title}`}>▶</a><a href={unit.reference} target="_blank" rel="noreferrer" aria-label={`Reference for ${topic.title}`}>↗</a>
                </label>)}</div>
              </div>}
            </article>;
          })}
          {!visible.length && <div className="empty-state"><b>No topic found.</b><span>Try a broader term such as “limits,” “volume,” or “series.”</span></div>}
        </div>
        <p className="source-note">Curriculum sequence and exam weightings follow the College Board AP Calculus AB and BC Course and Exam Description.</p>
      </section>

      <section className="tools-section" id="tools">
        <div className="section-heading light"><div><p className="eyebrow">FREE · NO ADS</p><h2>The right tool for the job.</h2></div><p>Purpose-built calculators and open-source systems. These external tools require an internet connection.</p></div>
        <div className="tools-grid">{tools.map((tool, index) => <a href={tool.url} target="_blank" rel="noreferrer" className="tool-card" key={tool.name}><span className="tool-index">0{index + 1}</span><span className="tool-category">{tool.category}</span><h3>{tool.name}</h3><p>{tool.description}</p><span className="tool-best">{tool.best}</span><b>Open tool ↗</b></a>)}</div>
      </section>

      <section className="formula-section" id="cheatsheet">
        <div className="section-heading"><div><p className="eyebrow">PRINTABLE REFERENCE</p><h2>The formulas you’ll reach for.</h2></div><button className="print-button" onClick={() => window.print()}>Print formula sheet ↗</button></div>
        <p className="formula-intro">A compact companion for homework and review. Learn what each formula means—then use this page to keep the mechanics close.</p>
        <div className="formula-grid">{formulaGroups.map((group) => <article className="formula-group" key={group.title}><h3>{group.title}</h3>{group.items.map(([name, formula]) => <div className="formula-line" key={name}><span>{name}</span><code>{formula}</code></div>)}</article>)}</div>
        <div className="exam-note"><b>Exam reminder</b><span>Calculator and non-calculator sections test different habits. Practice setting up your work, communicating units, and justifying conclusions—not only getting a decimal.</span></div>
      </section>

      <footer><a className="brand" href="#top"><span className="brand-mark">∫</span><span>CalcPath</span></a><p>Built for focused learning. Not affiliated with College Board.</p><a href="#top">Back to top ↑</a></footer>
      {updateReady && <div className="update-toast" role="status"><span><b>A fresh version is ready.</b><small>Your progress is saved on this device.</small></span><button onClick={() => navigator.serviceWorker.getRegistration().then((registration) => { navigator.serviceWorker.addEventListener("controllerchange", () => location.reload(), { once: true }); registration?.waiting?.postMessage({ type: "SKIP_WAITING" }); })}>Update now</button></div>}
    </main>
  );
}
