import { Location } from '@angular/common';
import { Component, computed, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { CourseDataService, type CourseManifest, type RoadmapFilter } from './course-data.service';

export type Topic = { id: string; title: string };
export type Unit = { id: number; title: string; shortTitle?: string; course: string; weight: string; color: string; reference: string; video: string; topics: Topic[] };
export type RoadmapData = { schemaVersion: number; source: string; sourceUrl: string; units: Unit[] };

export function calculateProgress(units: Unit[], completed: string[]): number {
  const total = units.reduce((sum, unit) => sum + unit.topics.length, 0);
  return total ? Math.round(completed.length / total * 100) : 0;
}

const DEFAULT_FILTERS: RoadmapFilter[] = [{ id: 'ALL', label: 'All topics', unitCourses: [] }];

export function filterUnits(units: Unit[], query: string, filterId: string, filters: RoadmapFilter[] = DEFAULT_FILTERS): Unit[] {
  const normalizedQuery = query.toLowerCase();
  const selectedFilter = filters.find((filter) => filter.id === filterId) ?? filters[0];
  return units
    .map((unit) => ({ ...unit, topics: unit.topics.filter((topic) => `${unit.title} ${topic.title}`.toLowerCase().includes(normalizedQuery)) }))
    .filter((unit) => (!selectedFilter?.unitCourses.length || selectedFilter.unitCourses.includes(unit.course)) && unit.topics.length);
}

export function toggleCompleted(items: string[], id: string): string[] {
  return items.includes(id) ? items.filter((item) => item !== id) : [...items, id];
}

@Component({
  standalone: true,
  imports: [FormsModule, MatButtonModule],
  template: `
    @if (course(); as activeCourse) {
    <section class="hero" id="top"><div class="hero-copy"><p class="eyebrow"><span>{{activeCourse.shortTitle}}</span> {{activeCourse.pages.roadmap.heroEyebrow}}</p><h1>{{activeCourse.pages.roadmap.heading}}<br><em>{{activeCourse.pages.roadmap.emphasis}}</em></h1><p class="lede">{{activeCourse.pages.roadmap.description}}</p></div><div class="hero-art" aria-hidden="true"><div class="graph-card"><div class="axis x"></div><div class="axis y"></div><div class="curve">∿</div><span class="point p1"></span><span class="point p2"></span><small>{{activeCourse.pages.roadmap.visuals.graphLabel}}</small></div><div class="formula-card">{{activeCourse.pages.roadmap.visuals.formula}}<b>{{activeCourse.pages.roadmap.visuals.result}}</b></div><div class="mini-card">{{activeCourse.pages.roadmap.visuals.miniFormula}}</div></div></section>
    <section class="roadmap-section"><div class="section-heading"><div><p class="eyebrow">{{activeCourse.pages.roadmap.sectionEyebrow}}</p><h2>{{activeCourse.pages.roadmap.sectionHeading}}</h2></div><p>{{activeCourse.pages.roadmap.sectionDescription}}</p></div>
      <div class="progress-bar" [attr.aria-label]="progress()+'% complete'"><span [style.width.%]="progress()"></span></div>
      <div class="controls"><label class="search"><span>⌕</span><input [ngModel]="query()" (ngModelChange)="setQuery($event)" [placeholder]="activeCourse.pages.roadmap.searchPlaceholder"></label><div class="segmented">@for (item of activeCourse.pages.roadmap.filters; track item.id) { <button [class.selected]="filterId() === item.id" (click)="setFilter(item.id)">{{ item.label }}</button> }</div></div>
      <div class="unit-list">@for (unit of visibleUnits(); track unit.id) { <article class="unit-row" [class.open]="expanded() === unit.id" [style.--accent]="unit.color"><button class="unit-summary" (click)="setUnit(unit.id)" [attr.aria-expanded]="expanded() === unit.id"><span class="unit-number">{{ unit.id.toString().padStart(2,'0') }}</span><span class="unit-title"><span class="unit-meta"><i>{{unit.course}}</i><i>{{unit.weight}}</i></span><strong>{{unit.title}}</strong><small>{{unit.topics.length}} topics</small></span><span class="unit-toggle">{{ expanded() === unit.id ? '−' : '+' }}</span></button>
      @if (expanded() === unit.id) { <div class="topic-panel"><div class="resource-strip"><div><b>Start here</b><span>Video instruction plus deeper reference.</span></div><a class="video-link" [href]="unit.video" target="_blank">▶ Watch lesson ↗</a><a [href]="unit.reference" target="_blank">Reference ↗</a></div><div class="topic-list">@for (topic of unit.topics; track topic.id) { <label class="topic-item" [class.done]="completed().includes(topic.id)"><input type="checkbox" [checked]="completed().includes(topic.id)" (change)="toggleTopic(topic.id)"><span class="check">✓</span><b>{{topic.id}}</b><span>{{topic.title}}</span><a [href]="unit.video" target="_blank" [attr.aria-label]="'Video for '+topic.title">▶</a><a [href]="unit.reference" target="_blank" [attr.aria-label]="'Reference for '+topic.title">↗</a></label> }</div></div> }
      </article> }</div>
    </section>
    }
  `
})
export class RoadmapPage {
  readonly units = signal<Unit[]>([]); readonly course = signal<CourseManifest | null>(null); readonly query = signal(''); readonly filterId = signal('ALL'); readonly expanded = signal<number | null>(1); readonly completed = signal<string[]>([]);
  readonly progress = computed(() => calculateProgress(this.units(), this.completed()));
  readonly visibleUnits = computed(() => filterUnits(this.units(), this.query(), this.filterId(), this.course()?.pages.roadmap.filters));
  private readonly courseId: string;
  constructor(private readonly route: ActivatedRoute, private readonly router: Router, private readonly location: Location, courses: CourseDataService) {
    this.courseId = route.parent?.snapshot.paramMap.get('courseId') ?? '';
    this.completed.set(this.readProgress());
    void Promise.all([courses.loadCourse(this.courseId), courses.loadDataset<RoadmapData>(this.courseId, 'roadmap')]).then(([course, data]) => { this.course.set(course); this.units.set(data.units); });
    route.queryParamMap.subscribe((params) => { this.query.set(params.get('q') ?? ''); this.filterId.set(params.get('filter') ?? 'ALL'); const unit = Number(params.get('unit')); this.expanded.set(unit || null); });
  }
  setQuery(query: string) { this.navigate({ q: query || null }); }
  setFilter(filterId: string) { this.navigate({ filter: filterId === 'ALL' ? null : filterId }); }
  setUnit(unit: number) { this.navigate({ unit: this.expanded() === unit ? null : unit }); }
  toggleTopic(id: string) { this.completed.update((items) => toggleCompleted(items, id)); localStorage.setItem(this.progressKey(), JSON.stringify(this.completed())); }
  private progressKey() { return `full-dive-ap:${this.courseId}:progress`; }
  private readProgress(): string[] { try { const current = localStorage.getItem(this.progressKey()); const priorBrand = localStorage.getItem(`studypath:${this.courseId}:progress`); const legacy = this.courseId === 'ap-calculus' ? localStorage.getItem('calcpath-progress') : null; return JSON.parse(current ?? priorBrand ?? legacy ?? '[]') as string[]; } catch { return []; } }
  private navigate(queryParams: Record<string, string | number | null>) {
    const urlTree = this.router.createUrlTree([], { relativeTo: this.route, queryParams, queryParamsHandling: 'merge' });
    this.location.replaceState(this.router.serializeUrl(urlTree));

    if ('q' in queryParams) this.query.set(String(queryParams['q'] ?? ''));
    if ('filter' in queryParams) this.filterId.set(String(queryParams['filter'] ?? 'ALL'));
    if ('unit' in queryParams) this.expanded.set(queryParams['unit'] === null ? null : Number(queryParams['unit']));
  }
}
