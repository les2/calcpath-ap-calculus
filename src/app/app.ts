import { Component, signal } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { SwUpdate, VersionReadyEvent } from '@angular/service-worker';
import { filter } from 'rxjs';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, RouterLink, RouterLinkActive, MatButtonModule],
  template: `
    <header class="topbar">
      <a class="brand" routerLink="/roadmap" aria-label="CalcPath home"><span class="brand-mark">∫</span><span>CalcPath</span></a>
      <nav aria-label="Main navigation">
        <a class="nav-link" routerLink="/roadmap" routerLinkActive="active">Roadmap</a>
        <a class="nav-link" routerLink="/tools" routerLinkActive="active">Tools</a>
        <a class="nav-link" routerLink="/reference" routerLinkActive="active">Reference guide</a>
      </nav>
      <button class="icon-button" (click)="toggleTheme()" aria-label="Toggle theme">{{ dark() ? '☀' : '◐' }}</button>
    </header>
    <div class="route-shell"><router-outlet /></div>
    <footer><a class="brand" routerLink="/roadmap"><span class="brand-mark">∫</span><span>CalcPath</span></a><p>Built for focused learning. Not affiliated with College Board.</p><a routerLink="/reference">Reference guide →</a></footer>
    @if (updateReady()) { <div class="update-toast" role="status"><span><b>A fresh version is ready.</b><small>Your progress is saved.</small></span><button (click)="activateUpdate()">Update now</button></div> }
  `
})
export class App {
  readonly dark = signal(localStorage.getItem('calcpath-theme') === 'dark');
  readonly updateReady = signal(false);
  constructor(private readonly updates: SwUpdate) {
    document.documentElement.dataset['theme'] = this.dark() ? 'dark' : 'light';
    updates.versionUpdates.pipe(filter((event): event is VersionReadyEvent => event.type === 'VERSION_READY')).subscribe(() => this.updateReady.set(true));
  }
  toggleTheme() { this.dark.update((value) => !value); const theme = this.dark() ? 'dark' : 'light'; document.documentElement.dataset['theme'] = theme; localStorage.setItem('calcpath-theme', theme); }
  async activateUpdate() { await this.updates.activateUpdate(); location.reload(); }
}
