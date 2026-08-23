import { Routes } from '@angular/router';
import { RoadmapPage } from './roadmap.page';
import { ToolsPage } from './tools.page';
import { ReferencePage } from './reference.page';
import { GradeMaxxingPage } from './grade-maxxing.page';

export const routes: Routes = [
  { path: 'roadmap', component: RoadmapPage, title: 'Roadmap — CalcPath' },
  { path: 'tools', component: ToolsPage, title: 'Free Calculus Tools — CalcPath' },
  { path: 'reference', component: ReferencePage, title: 'Calculus Reference Guide — CalcPath' },
  { path: 'grade-maxxing', component: GradeMaxxingPage, title: 'Grade Maxxing — CalcPath' },
  { path: '', pathMatch: 'full', redirectTo: 'roadmap' },
  { path: '**', redirectTo: 'roadmap' }
];
