import { Component, signal } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { CourseDataService, type CourseManifest } from './course-data.service';

type Tool = { name: string; category: string; url: string; description: string; best: string };
type ToolsData = { schemaVersion: number; tools: Tool[] };

@Component({
  standalone: true,
  template: `
    @if (course(); as activeCourse) { <section class="page-hero"><p class="eyebrow">{{activeCourse.pages.tools.eyebrow}}</p><h1>{{activeCourse.pages.tools.heading}}<br><em>{{activeCourse.pages.tools.emphasis}}</em></h1><p>{{activeCourse.pages.tools.description}}</p></section> }
    <section class="tools-section standalone-tools"><div class="tools-grid">@for (tool of tools(); track tool.name; let index = $index) { <a [href]="tool.url" target="_blank" rel="noreferrer" class="tool-card"><span class="tool-index">0{{index+1}}</span><span class="tool-category">{{tool.category}}</span><h3>{{tool.name}}</h3><p>{{tool.description}}</p><span class="tool-best">{{tool.best}}</span><b>Open tool ↗</b></a> }</div></section>
  `
})
export class ToolsPage {
  readonly tools = signal<Tool[]>([]);
  readonly course = signal<CourseManifest | null>(null);
  constructor(route: ActivatedRoute, courses: CourseDataService) {
    const courseId = route.parent?.snapshot.paramMap.get('courseId') ?? '';
    void Promise.all([courses.loadCourse(courseId), courses.loadDataset<ToolsData>(courseId, 'tools')]).then(([course, data]) => { this.course.set(course); this.tools.set(data.tools); });
  }
}
