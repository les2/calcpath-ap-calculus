import { Component, signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MathFormulaComponent } from './math-formula.component';
import { ActivatedRoute } from '@angular/router';
import { CourseDataService, type CourseManifest } from './course-data.service';

type FormulaGroup = { title: string; items: [string, string][] };
type ReferenceData = { schemaVersion: number; groups: FormulaGroup[] };

@Component({
  standalone: true,
  imports: [MatButtonModule, MathFormulaComponent],
  template: `
    @if (course(); as activeCourse) { <section class="page-hero reference-hero"><p class="eyebrow">{{activeCourse.pages.reference.eyebrow}}</p><h1>{{activeCourse.pages.reference.heading}}<br><em>{{activeCourse.pages.reference.emphasis}}</em></h1><p>{{activeCourse.pages.reference.description}}</p><button mat-flat-button class="print-button" (click)="print()">{{activeCourse.pages.reference.printLabel}}</button></section>
    <section class="formula-section reference-page"><div class="formula-grid">@for (group of groups(); track group.title; let index = $index) { <article class="formula-group"><header><span>{{(index + 1).toString().padStart(2, '0')}}</span><h2>{{group.title}}</h2></header>@for (item of group.items; track item[0]) { <div class="formula-line"><span>{{item[0]}}</span><calc-math [tex]="item[1]" /></div> }</article> }</div><div class="exam-note"><b>{{activeCourse.pages.reference.noteTitle}}</b><span>{{activeCourse.pages.reference.noteText}}</span></div></section> }
  `
})
export class ReferencePage {
  readonly groups = signal<FormulaGroup[]>([]);
  readonly course = signal<CourseManifest | null>(null);
  constructor(route: ActivatedRoute, courses: CourseDataService) {
    const courseId = route.parent?.snapshot.paramMap.get('courseId') ?? '';
    void Promise.all([courses.loadCourse(courseId), courses.loadDataset<ReferenceData>(courseId, 'reference')]).then(([course, data]) => { this.course.set(course); this.groups.set(data.groups); });
  }
  print() { window.print(); }
}
