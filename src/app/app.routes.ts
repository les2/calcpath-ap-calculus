import { Routes } from '@angular/router';
import { RoadmapPage } from './roadmap.page';
import { ToolsPage } from './tools.page';
import { ReferencePage } from './reference.page';
import { CourseShellComponent } from './course-shell.component';
import { CoursesPage } from './courses.page';

export const routes: Routes = [
  { path: 'courses', component: CoursesPage, title: 'Courses — Full Dive AP' },
  {
    path: 'courses/:courseId',
    component: CourseShellComponent,
    children: [
      { path: 'roadmap', component: RoadmapPage, title: 'Roadmap — Full Dive AP' },
      { path: 'tools', component: ToolsPage, title: 'Tools — Full Dive AP' },
      { path: 'reference', component: ReferencePage, title: 'Reference Guide — Full Dive AP' },
      { path: 'training', loadComponent: () => import('./training.page').then((page) => page.TrainingPage), title: 'Training Mode — Full Dive AP' },
      { path: '', pathMatch: 'full', redirectTo: 'roadmap' }
    ]
  },
  { path: '', pathMatch: 'full', redirectTo: 'courses' },
  { path: '**', redirectTo: 'courses' }
];
