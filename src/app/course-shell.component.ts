import { Component, DestroyRef } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ActivatedRoute, Router, RouterOutlet } from '@angular/router';
import { CourseDataService } from './course-data.service';

@Component({
  standalone: true,
  imports: [RouterOutlet],
  template: '<router-outlet />'
})
export class CourseShellComponent {
  constructor(route: ActivatedRoute, router: Router, courses: CourseDataService, destroyRef: DestroyRef) {
    route.paramMap.pipe(takeUntilDestroyed(destroyRef)).subscribe((params) => {
      const courseId = params.get('courseId');
      if (!courseId) return;
      void courses.loadCourse(courseId).catch(() => router.navigate(['/realms']));
    });
  }
}
