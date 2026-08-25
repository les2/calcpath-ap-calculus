import { Routes } from '@angular/router';
import { RoadmapPage } from './roadmap.page';
import { ToolsPage } from './tools.page';
import { ReferencePage } from './reference.page';
import { CourseShellComponent } from './course-shell.component';
import { CoursesPage } from './courses.page';

export const routes: Routes = [
  { path: 'realms', component: CoursesPage, title: 'Realms — Full Dive AP' },
  {
    path: 'realms/:courseId',
    component: CourseShellComponent,
    children: [
      { path: 'world-map', component: RoadmapPage, title: 'World Map — Full Dive AP' },
      { path: 'tools', component: ToolsPage, title: 'Tools — Full Dive AP' },
      { path: 'reference', component: ReferencePage, title: 'Reference Guide — Full Dive AP' },
      { path: 'training', loadComponent: () => import('./training.page').then((page) => page.TrainingPage), title: 'Training Mode — Full Dive AP' },
      { path: '', pathMatch: 'full', redirectTo: 'world-map' }
    ]
  },
  { path: '', pathMatch: 'full', redirectTo: 'realms' },
  { path: '**', redirectTo: 'realms' }
];
