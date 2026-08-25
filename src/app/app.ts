import { HttpClient } from '@angular/common/http';
import { ApplicationRef, Component, DestroyRef, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { SwUpdate } from '@angular/service-worker';
import { filter, first, fromEvent, interval, merge } from 'rxjs';
import { SupportLinkComponent } from './support-link.component';
import { CourseDataService } from './course-data.service';

interface BuildInfo {
  $schema: string;
  version: string;
  buildId: string;
  builtAt: string;
}

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, RouterLink, RouterLinkActive, MatButtonModule, SupportLinkComponent],
  template: `
    <header class="topbar">
      <a class="brand" routerLink="/realms" [attr.aria-label]="courses.app().brand.name + ' home'"><span class="brand-mark">{{ courses.app().brand.mark }}</span><span>{{ courses.app().brand.name }}</span></a>
      @if (courses.activeCourse(); as course) { <a class="course-chip" [routerLink]="['/realms', course.id, 'world-map']">{{ course.shortTitle }}</a> }
      <nav aria-label="Main navigation">
        @if (courses.activeCourse(); as course) {
          @for (item of course.navigation; track item.id) { <a class="nav-link" [routerLink]="['/realms', course.id, item.path]" routerLinkActive="active">{{ item.label }}</a> }
        }
        <a class="nav-link courses-link" routerLink="/realms" routerLinkActive="active" [routerLinkActiveOptions]="{ exact: true }">{{ courses.app().catalogPage.navigationLabel }}</a>
        <a class="github-link" [href]="courses.app().repository.url" target="_blank" rel="noopener noreferrer" [attr.aria-label]="'View ' + courses.app().brand.name + ' on GitHub (opens in a new tab)'">{{ courses.app().repository.label }} ↗</a>
      </nav>
      <div class="header-actions">
        @if (courses.app().support.enabled) { <full-dive-support-link [href]="courses.app().support.url" [label]="courses.app().support.label" [icon]="courses.app().support.icon" [brandName]="courses.app().brand.name" /> }
        <button class="icon-button" (click)="toggleTheme()" aria-label="Toggle theme">{{ dark() ? '☀' : '◐' }}</button>
      </div>
    </header>
    <div class="route-shell"><router-outlet /></div>
    <footer>
      <a class="brand" routerLink="/realms"><span class="brand-mark">{{ courses.app().brand.mark }}</span><span>{{ courses.app().brand.name }}</span></a>
      <p>
        <span>{{ courses.app().footer.message }}</span>
        @if (courses.activeCourse(); as course) { <span> {{ course.disclaimer }}</span> }
      </p>
      <div class="footer-links"><a routerLink="/realms">{{ courses.app().catalogPage.allLabel }} →</a><a [href]="courses.app().repository.url" target="_blank" rel="noopener noreferrer">Fork or extend on GitHub ↗</a></div>
      <div class="version-panel">
        @if (buildInfo(); as build) {
          <span>Updated {{ formattedBuildTime() }}</span>
          <small>Build {{ build.buildId }} · v{{ build.version }}</small>
        } @else {
          <span>Loading build information…</span>
        }
        <button type="button" (click)="checkForUpdates(true)" [disabled]="checkingUpdate()">{{ checkingUpdate() ? 'Checking…' : 'Check for updates' }}</button>
        @if (updateStatus()) { <small class="update-status" role="status">{{ updateStatus() }}</small> }
      </div>
    </footer>
    @if (updateReady()) { <div class="update-toast" role="status"><span><b>{{ updateTitle() }}</b><small>Your saved progress will stay on this device.</small></span><button (click)="reloadForUpdate()">Reload now</button></div> }
  `
})
export class App {
  readonly dark = signal(localStorage.getItem('full-dive-ap-theme') === 'dark');
  readonly updateReady = signal(false);
  readonly updateTitle = signal('A fresh version is ready.');
  readonly buildInfo = signal<BuildInfo | null>(null);
  readonly checkingUpdate = signal(false);
  readonly updateStatus = signal('');

  constructor(
    private readonly updates: SwUpdate,
    private readonly http: HttpClient,
    readonly courses: CourseDataService,
    appRef: ApplicationRef,
    destroyRef: DestroyRef
  ) {
    document.documentElement.dataset['theme'] = this.dark() ? 'dark' : 'light';
    this.loadBuildInfo();

    if (!updates.isEnabled) return;

    updates.versionUpdates.pipe(takeUntilDestroyed(destroyRef)).subscribe((event) => {
      if (event.type === 'VERSION_READY') {
        this.updateReady.set(true);
        this.updateStatus.set('An update is ready to install.');
      } else if (event.type === 'VERSION_INSTALLATION_FAILED') {
        this.updateStatus.set('The update could not be downloaded. Try again when you are online.');
      }
    });

    updates.unrecoverable.pipe(takeUntilDestroyed(destroyRef)).subscribe(() => {
      this.updateTitle.set('Reload to repair the offline copy.');
      this.updateReady.set(true);
    });

    appRef.isStable.pipe(first((stable) => stable), takeUntilDestroyed(destroyRef)).subscribe(() => {
      void this.checkForUpdates(false);
      interval(30 * 60 * 1000).pipe(takeUntilDestroyed(destroyRef)).subscribe(() => void this.checkForUpdates(false));
    });

    merge(
      fromEvent(window, 'focus'),
      fromEvent(window, 'online'),
      fromEvent(document, 'visibilitychange').pipe(filter(() => document.visibilityState === 'visible'))
    ).pipe(takeUntilDestroyed(destroyRef)).subscribe(() => void this.checkForUpdates(false));
  }

  toggleTheme() { this.dark.update((value) => !value); const theme = this.dark() ? 'dark' : 'light'; document.documentElement.dataset['theme'] = theme; localStorage.setItem('full-dive-ap-theme', theme); }

  formattedBuildTime() {
    const info = this.buildInfo();
    if (!info) return '';
    return new Intl.DateTimeFormat(undefined, { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(info.builtAt));
  }

  async checkForUpdates(manual: boolean) {
    if (!this.updates.isEnabled) {
      if (manual) this.updateStatus.set('Update checks are available in the installed or production app.');
      return;
    }
    if (this.checkingUpdate()) return;

    this.checkingUpdate.set(true);
    if (manual) this.updateStatus.set('Checking for a newer build…');
    try {
      const updateFound = await this.updates.checkForUpdate();
      if (manual && !updateFound) this.updateStatus.set('You are already on the latest build.');
    } catch {
      if (manual) this.updateStatus.set(navigator.onLine ? 'Could not check right now. Please try again.' : 'Connect to the internet to check for updates.');
    } finally {
      this.checkingUpdate.set(false);
    }
  }

  reloadForUpdate() { location.reload(); }

  private loadBuildInfo() {
    const buildInfoUrl = new URL('build-info.json', document.baseURI).toString();
    this.http.get<BuildInfo>(buildInfoUrl).subscribe({ next: (info) => this.buildInfo.set(info) });
  }
}
