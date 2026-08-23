import { HttpClient } from '@angular/common/http';
import { Component, computed, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';

type Topic = { id: string; title: string };
type Unit = { id: number; title: string; course: 'AB + BC' | 'BC only'; weight: string; color: string; reference: string; video: string; topics: Topic[] };

@Component({
  standalone: true,
  imports: [FormsModule, MatButtonModule],
  template: `
    <section class="hero" id="top"><div class="hero-copy"><p class="eyebrow"><span>AP</span> CALCULUS · AB + BC</p><h1>Your path through<br><em>calculus.</em></h1><p class="lede">Every topic, the clearest explanations, and the right tools—organized into one focused roadmap.</p></div><div class="hero-art" aria-hidden="true"><div class="graph-card"><div class="axis x"></div><div class="axis y"></div><div class="curve">∿</div><span class="point p1"></span><span class="point p2"></span><small>f′(x)</small></div><div class="formula-card">lim <span>sin x</span><br><small>x→0&nbsp;&nbsp;&nbsp; x</small><b>= 1</b></div><div class="mini-card">d/dx&nbsp; xⁿ <b>= nxⁿ⁻¹</b></div></div></section>
    <section class="roadmap-section"><div class="section-heading"><div><p class="eyebrow">THE ROADMAP</p><h2>Ten units. One clear route.</h2></div><p>Search and course state stay in the URL, so a focused view can be bookmarked or shared.</p></div>
      <div class="progress-bar" [attr.aria-label]="progress()+'% complete'"><span [style.width.%]="progress()"></span></div>
      <div class="controls"><label class="search"><span>⌕</span><input [ngModel]="query()" (ngModelChange)="setQuery($event)" placeholder="Search 111 topics…"></label><div class="segmented">@for (item of ['ALL','AB','BC']; track item) { <button [class.selected]="course() === item" (click)="setCourse(item)">{{ item === 'ALL' ? 'All topics' : item }}</button> }</div></div>
      <div class="unit-list">@for (unit of visibleUnits(); track unit.id) { <article class="unit-row" [class.open]="expanded() === unit.id" [style.--accent]="unit.color"><button class="unit-summary" (click)="setUnit(unit.id)" [attr.aria-expanded]="expanded() === unit.id"><span class="unit-number">{{ unit.id.toString().padStart(2,'0') }}</span><span class="unit-title"><span class="unit-meta"><i>{{unit.course}}</i><i>{{unit.weight}}</i></span><strong>{{unit.title}}</strong><small>{{unit.topics.length}} topics</small></span><span class="unit-toggle">{{ expanded() === unit.id ? '−' : '+' }}</span></button>
      @if (expanded() === unit.id) { <div class="topic-panel"><div class="resource-strip"><div><b>Start here</b><span>Video instruction plus deeper reference.</span></div><a class="video-link" [href]="unit.video" target="_blank">▶ Watch lesson ↗</a><a [href]="unit.reference" target="_blank">Reference ↗</a></div><div class="topic-list">@for (topic of unit.topics; track topic.id) { <label class="topic-item" [class.done]="completed().includes(topic.id)"><input type="checkbox" [checked]="completed().includes(topic.id)" (change)="toggleTopic(topic.id)"><span class="check">✓</span><b>{{topic.id}}</b><span>{{topic.title}}</span><a [href]="unit.video" target="_blank" [attr.aria-label]="'Video for '+topic.title">▶</a><a [href]="unit.reference" target="_blank" [attr.aria-label]="'Reference for '+topic.title">↗</a></label> }</div></div> }
      </article> }</div>
    </section>
  `
})
export class RoadmapPage {
  readonly units = signal<Unit[]>([]); readonly query = signal(''); readonly course = signal('ALL'); readonly expanded = signal<number | null>(1); readonly completed = signal<string[]>(this.readProgress());
  readonly progress = computed(() => { const total = this.units().reduce((sum, unit) => sum + unit.topics.length, 0); return total ? Math.round(this.completed().length / total * 100) : 0; });
  readonly visibleUnits = computed(() => this.units().map((unit) => ({...unit, topics: unit.topics.filter((topic) => `${unit.title} ${topic.title}`.toLowerCase().includes(this.query().toLowerCase()))})).filter((unit) => (this.course() === 'ALL' || this.course() === 'BC' || unit.course === 'AB + BC') && unit.topics.length));
  constructor(http: HttpClient, private readonly route: ActivatedRoute, private readonly router: Router) {
    http.get<{units: Unit[]}>('/data/topics.json').subscribe((data) => this.units.set(data.units));
    route.queryParamMap.subscribe((params) => { this.query.set(params.get('q') ?? ''); this.course.set(params.get('course') ?? 'ALL'); const unit = Number(params.get('unit')); this.expanded.set(unit || null); });
  }
  setQuery(query: string) { this.navigate({ q: query || null }); }
  setCourse(course: string) { this.navigate({ course: course === 'ALL' ? null : course }); }
  setUnit(unit: number) { this.navigate({ unit: this.expanded() === unit ? null : unit }); }
  toggleTopic(id: string) { this.completed.update((items) => items.includes(id) ? items.filter((item) => item !== id) : [...items, id]); localStorage.setItem('calcpath-progress', JSON.stringify(this.completed())); }
  private readProgress(): string[] { try { return JSON.parse(localStorage.getItem('calcpath-progress') ?? '[]') as string[]; } catch { return []; } }
  private navigate(queryParams: Record<string, string | number | null>) { this.router.navigate([], { relativeTo: this.route, queryParams, queryParamsHandling: 'merge', replaceUrl: true }); }
}
