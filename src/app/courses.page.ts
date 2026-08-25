import { Component, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { CourseDataService, type CourseCatalog } from './course-data.service';

@Component({
  standalone: true,
  imports: [RouterLink],
  template: `
    <section class="course-catalog-hero">
      <p class="eyebrow">{{ courses.app().catalogPage.eyebrow }}</p>
      <h1>{{ courses.app().catalogPage.heading }}<br><em>{{ courses.app().catalogPage.emphasis }}</em></h1>
      <p>{{ courses.app().catalogPage.description }}</p>
    </section>
    <main class="course-catalog" aria-labelledby="course-list-title">
      <div class="section-heading"><div><p class="eyebrow">{{ courses.app().catalogPage.sectionEyebrow }}</p><h2 id="course-list-title">{{ courses.app().catalogPage.sectionHeading }}</h2></div><p>{{ courses.app().catalogPage.sectionDescription }}</p></div>
      <div class="course-grid">
        @for (course of catalog()?.courses ?? []; track course.id; let index = $index) {
          <article class="course-card" [style.--course-card-accent]="course.accent">
            <span>{{ (index + 1).toString().padStart(2, '0') }}</span>
            <p class="eyebrow">{{ course.eyebrow }}</p>
            <h2>{{ course.title }}</h2>
            <p>{{ course.description }}</p>
            @if (course.status === 'available') { <a [routerLink]="['/courses', course.id, 'roadmap']">{{ courses.app().catalogPage.openLabel }} →</a> }
            @else { <b>{{ courses.app().catalogPage.comingSoonLabel }}</b> }
          </article>
        }
      </div>
    </main>
  `
})
export class CoursesPage {
  readonly catalog = signal<CourseCatalog | null>(null);
  constructor(readonly courses: CourseDataService) {
    void courses.loadCatalog().then((catalog) => this.catalog.set(catalog));
  }
}
