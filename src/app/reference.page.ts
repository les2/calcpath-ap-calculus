import { HttpClient } from '@angular/common/http';
import { Component, signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';

type FormulaGroup = { title: string; items: [string, string][] };

@Component({
  standalone: true,
  imports: [MatButtonModule],
  template: `
    <section class="page-hero reference-hero"><p class="eyebrow">PRINTABLE REFERENCE</p><h1>The formulas<br><em>you’ll reach for.</em></h1><p>A compact companion for homework and review. Learn what each formula means—then use this guide to keep the mechanics close.</p><button mat-flat-button class="print-button" (click)="print()">Print reference guide ↗</button></section>
    <section class="formula-section reference-page"><div class="formula-grid">@for (group of groups(); track group.title) { <article class="formula-group"><h2>{{group.title}}</h2>@for (item of group.items; track item[0]) { <div class="formula-line"><span>{{item[0]}}</span><code>{{item[1]}}</code></div> }</article> }</div><div class="exam-note"><b>Exam reminder</b><span>Calculator and non-calculator sections test different habits. Practice setting up your work, communicating units, and justifying conclusions—not only getting a decimal.</span></div></section>
  `
})
export class ReferencePage {
  readonly groups = signal<FormulaGroup[]>([]);
  constructor(http: HttpClient) { http.get<{groups: FormulaGroup[]}>('/data/formulas.json').subscribe((data) => this.groups.set(data.groups)); }
  print() { window.print(); }
}
