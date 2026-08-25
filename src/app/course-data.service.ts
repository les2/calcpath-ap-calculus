import { HttpClient } from '@angular/common/http';
import { Injectable, signal } from '@angular/core';
import { firstValueFrom } from 'rxjs';

export type AppConfig = {
  $schema: string;
  schemaVersion: 1;
  brand: { name: string; shortName: string; mark: string; tagline: string };
  repository: { label: string; url: string };
  support: { enabled: boolean; label: string; icon: string; url: string };
  catalogPage: { navigationLabel: string; allLabel: string; eyebrow: string; heading: string; emphasis: string; description: string; sectionEyebrow: string; sectionHeading: string; sectionDescription: string; openLabel: string; comingSoonLabel: string };
  footer: { message: string };
};

export type CourseSummary = {
  id: string;
  title: string;
  shortTitle: string;
  eyebrow: string;
  description: string;
  manifest: string;
  accent: string;
  status: 'available' | 'coming-soon';
};

export type CourseCatalog = { $schema: string; schemaVersion: 1; defaultCourseId: string; courses: CourseSummary[] };
export type CourseNavigationItem = { id: string; label: string; path: string };
export type RoadmapFilter = { id: string; label: string; unitCourses: string[] };
export type BasicPageCopy = { eyebrow: string; heading: string; emphasis: string; description: string };
export type CourseManifest = {
  $schema: string;
  schemaVersion: 1;
  id: string;
  title: string;
  shortTitle: string;
  description: string;
  accent: string;
  disclaimer: string;
  quality: { expectedUnitCount: number; expectedTopicCount: number; minimumEmbeddedQuestionsPerTopic: number };
  datasets: { roadmap: string; tools: string; reference: string; practice: string };
  navigation: CourseNavigationItem[];
  pages: {
    roadmap: {
      heroEyebrow: string;
      heading: string;
      emphasis: string;
      description: string;
      sectionEyebrow: string;
      sectionHeading: string;
      sectionDescription: string;
      searchPlaceholder: string;
      filters: RoadmapFilter[];
      visuals: { graphLabel: string; formula: string; result: string; miniFormula: string };
    };
    tools: BasicPageCopy;
    reference: BasicPageCopy & { printLabel: string; noteTitle: string; noteText: string };
    practice: BasicPageCopy & { modeLabel: string; sessionLabel: string; sessionPlural: string; loadoutLabel: string; filterTags: string[]; unitAccents: string[]; sourceLabels: Record<string, string> };
  };
};

export type CourseDataset = keyof CourseManifest['datasets'];

const DEFAULT_APP: AppConfig = {
  $schema: '../schemas/app.schema.json',
  schemaVersion: 1,
  brand: { name: 'Full Dive AP', shortName: 'Full Dive', mark: 'FD', tagline: 'Farm XP. Max the course.' },
  repository: { label: 'GitHub', url: 'https://github.com/les2/full-dive-ap' },
  support: { enabled: true, label: 'Leave a tip', icon: '☕', url: 'https://ko-fi.com/5reason' },
  catalogPage: { navigationLabel: 'Realms', allLabel: 'All realms', eyebrow: 'REALM SELECT', heading: 'Choose your realm.', emphasis: 'Start farming XP.', description: 'World maps, trusted resources, reference guides, and focused training sessions.', sectionEyebrow: 'AVAILABLE REALMS', sectionHeading: 'Ready to enter', sectionDescription: 'Enter a realm, lock in, and keep leveling.', openLabel: 'Enter realm', comingSoonLabel: 'Next realm' },
  footer: { message: 'Built for course maxxing. Your progress stays on your device.' }
};

@Injectable({ providedIn: 'root' })
export class CourseDataService {
  readonly app = signal<AppConfig>(DEFAULT_APP);
  readonly catalog = signal<CourseCatalog | null>(null);
  readonly activeCourse = signal<CourseManifest | null>(null);

  private readonly dataRoot = new URL('data/', document.baseURI);
  private readonly manifestUrls = new Map<string, URL>();
  private readonly manifestPromises = new Map<string, Promise<CourseManifest>>();
  private appPromise?: Promise<AppConfig>;
  private catalogPromise?: Promise<CourseCatalog>;

  constructor(private readonly http: HttpClient) {
    void this.loadApp();
    void this.loadCatalog();
  }

  loadApp(): Promise<AppConfig> {
    this.appPromise ??= firstValueFrom(this.http.get<AppConfig>(new URL('app.json', this.dataRoot).toString()))
      .then((config) => { this.app.set(config); return config; });
    return this.appPromise;
  }

  loadCatalog(): Promise<CourseCatalog> {
    this.catalogPromise ??= firstValueFrom(this.http.get<CourseCatalog>(new URL('courses.json', this.dataRoot).toString()))
      .then((catalog) => { this.catalog.set(catalog); return catalog; });
    return this.catalogPromise;
  }

  async loadCourse(courseId: string): Promise<CourseManifest> {
    let pending = this.manifestPromises.get(courseId);
    if (!pending) {
      pending = this.loadCatalog().then(async (catalog) => {
        const summary = catalog.courses.find((course) => course.id === courseId && course.status === 'available');
        if (!summary) throw new Error(`Unknown course ${courseId}`);
        const manifestUrl = new URL(summary.manifest, this.dataRoot);
        const manifest = await firstValueFrom(this.http.get<CourseManifest>(manifestUrl.toString()));
        if (manifest.id !== courseId) throw new Error(`Course manifest ID ${manifest.id} does not match ${courseId}`);
        this.manifestUrls.set(courseId, manifestUrl);
        return manifest;
      });
      this.manifestPromises.set(courseId, pending);
    }
    const course = await pending;
    this.activeCourse.set(course);
    document.documentElement.style.setProperty('--course-accent', course.accent);
    return course;
  }

  async loadDataset<T>(courseId: string, dataset: CourseDataset): Promise<T> {
    const course = await this.loadCourse(courseId);
    const manifestUrl = this.manifestUrls.get(courseId);
    if (!manifestUrl) throw new Error(`Missing manifest URL for ${courseId}`);
    return firstValueFrom(this.http.get<T>(new URL(course.datasets[dataset], manifestUrl).toString()));
  }

  async datasetUrl(courseId: string, dataset: CourseDataset): Promise<string> {
    const course = await this.loadCourse(courseId);
    const manifestUrl = this.manifestUrls.get(courseId);
    if (!manifestUrl) throw new Error(`Missing manifest URL for ${courseId}`);
    return new URL(course.datasets[dataset], manifestUrl).toString();
  }
}
