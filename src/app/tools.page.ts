import { HttpClient } from '@angular/common/http';
import { Component, signal } from '@angular/core';

type Tool = { name: string; category: string; url: string; description: string; best: string };

@Component({
  standalone: true,
  template: `
    <section class="page-hero"><p class="eyebrow">FREE · NO ADS</p><h1>The right tool<br><em>for the job.</em></h1><p>Purpose-built calculators and open-source systems for graphing, symbolic algebra, solving, and computation. External tools require an internet connection.</p></section>
    <section class="tools-section standalone-tools"><div class="tools-grid">@for (tool of tools(); track tool.name; let index = $index) { <a [href]="tool.url" target="_blank" rel="noreferrer" class="tool-card"><span class="tool-index">0{{index+1}}</span><span class="tool-category">{{tool.category}}</span><h3>{{tool.name}}</h3><p>{{tool.description}}</p><span class="tool-best">{{tool.best}}</span><b>Open tool ↗</b></a> }</div></section>
  `
})
export class ToolsPage {
  readonly tools = signal<Tool[]>([]);
  constructor(http: HttpClient) { http.get<{tools: Tool[]}>(new URL('data/tools.json', document.baseURI).toString()).subscribe((data) => this.tools.set(data.tools)); }
}
