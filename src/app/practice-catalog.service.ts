import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { fullDiveDatabase, type CachedPracticeQuestion, type CachedPracticeSource, type PracticeCatalogMeta } from './practice-catalog.database';

export type PracticeGrade = 'cooked' | 'close' | 'reps';
export type PracticeDifficulty = 'easy' | 'medium' | 'hard' | 'ridiculous';
export type PracticeDisplay = 'embedded' | 'external';
export type QuestionLicense = { code: string; name: string; url: string; usage: 'embedded' | 'link-only' };
export type PracticeSource = { id: string; title: string; author: string; url: string; attribution: string; license: QuestionLicense };
export type QuestionLocator = { exerciseId: string; promptUrl: string; answerUrl: string; transcription: 'format-only' | 'link-only'; verifiedAt: string };
export type QuestionMetadata = { sourceQuestionId: string; collection: string; course: string; format: string; difficulty: PracticeDifficulty; estimatedMinutes: number; calculator: string; answerKind: string; publishedYear?: number; tags: string[] };
export type StoredPracticeQuestion = {
  id: string; type: PracticeDisplay; topicId: string; topic: string; unit: string; title: string; sourceId: string; locator: QuestionLocator;
  promptText?: string; promptTex?: string; promptHtml?: string; answerText?: string; answerTex?: string; answerHtml?: string; problemUrl?: string; solutionUrl?: string;
  videoUrl: string; referenceUrl: string; metadata: QuestionMetadata;
};
export type QuestionSource = PracticeSource & QuestionLocator & { attribution: string };
export type PracticeQuestion = Omit<StoredPracticeQuestion, 'sourceId' | 'sourceAttribution' | 'locator'> & { sourceId: string; source: QuestionSource };
export type PracticeCatalog = { $schema: string; schemaVersion: number; revision: string; generatedAt: string; licenseNotice: string; catalogStats: Record<string, unknown>; sources: PracticeSource[]; questions: StoredPracticeQuestion[] };
export type StudySession = {
  id: string; courseId: string; name: string; topicIds: string[]; questionIds: string[]; currentIndex: number; totalSeconds: number;
  results: Record<string, PracticeGrade>; revealed: string[]; status: 'open' | 'dismissed'; createdAt: string; updatedAt: string; questionLimitPerTopic?: number; selectionSeed?: number;
};

const catalogMetaKey = (courseId: string) => `practice-catalog:${courseId}`;

export function hydrateCatalog(catalog: PracticeCatalog): PracticeQuestion[] {
  const sources = new Map(catalog.sources.map((source) => [source.id, source]));
  return catalog.questions.map((question) => {
    const source = sources.get(question.sourceId);
    if (!source) throw new Error(`Missing practice source ${question.sourceId}`);
    const { locator, ...stored } = question;
    return { ...stored, source: { ...source, ...locator } };
  });
}

@Injectable({ providedIn: 'root' })
export class PracticeCatalogService {
  constructor(private readonly http: HttpClient) {}

  async load(courseId: string, url: string): Promise<PracticeQuestion[]> {
    const cached = await this.readCatalog(courseId).catch(() => null);
    try {
      const server = await firstValueFrom(this.http.get<PracticeCatalog>(url));
      if (!cached || cached.revision !== server.revision) await this.writeCatalog(courseId, server).catch(() => undefined);
      return hydrateCatalog(server);
    } catch (error) {
      if (cached) return hydrateCatalog(cached);
      throw error;
    }
  }

  async loadSessions(courseId: string): Promise<StudySession[]> {
    const legacy = this.readLegacySessions(courseId);
    try {
      const sessions = await fullDiveDatabase.studySessions.where('courseId').equals(courseId).toArray();
      if (sessions.length) return sessions;
      if (legacy.length) { await this.saveSessions(courseId, legacy); }
      return legacy;
    } catch { return legacy; }
  }

  async saveSessions(courseId: string, sessions: StudySession[]): Promise<void> {
    try {
      await fullDiveDatabase.transaction('rw', fullDiveDatabase.studySessions, async () => {
        await fullDiveDatabase.studySessions.where('courseId').equals(courseId).delete();
        await fullDiveDatabase.studySessions.bulkPut(sessions.map((session) => ({ ...session, courseId })));
      });
    } catch { localStorage.setItem(this.sessionStorageKey(courseId), JSON.stringify(sessions)); }
  }

  private async readCatalog(courseId: string): Promise<PracticeCatalog | null> {
    const [meta, cachedSources, cachedQuestions] = await fullDiveDatabase.transaction(
      'r',
      [fullDiveDatabase.catalogMeta, fullDiveDatabase.practiceSources, fullDiveDatabase.practiceQuestions],
      () => Promise.all([
        fullDiveDatabase.catalogMeta.get(catalogMetaKey(courseId)),
        fullDiveDatabase.practiceSources.where('courseId').equals(courseId).toArray(),
        fullDiveDatabase.practiceQuestions.where('courseId').equals(courseId).toArray()
      ])
    );
    if (!meta) return null;
    const { key: _key, courseId: _courseId, ...catalog } = meta;
    const sources = cachedSources.map(({ cacheKey: _cacheKey, courseId: _sourceCourseId, ...source }) => source);
    const questions = cachedQuestions.map(({ cacheKey: _cacheKey, courseId: _questionCourseId, ...question }) => question);
    return { ...catalog, sources, questions };
  }

  private async writeCatalog(courseId: string, catalog: PracticeCatalog): Promise<void> {
    const meta: PracticeCatalogMeta = {
      key: catalogMetaKey(courseId),
      courseId,
      $schema: catalog.$schema,
      schemaVersion: catalog.schemaVersion,
      revision: catalog.revision,
      generatedAt: catalog.generatedAt,
      licenseNotice: catalog.licenseNotice,
      catalogStats: catalog.catalogStats
    };
    const sources: CachedPracticeSource[] = catalog.sources.map((source) => ({ ...source, courseId, cacheKey: `${courseId}:${source.id}` }));
    const questions: CachedPracticeQuestion[] = catalog.questions.map((question) => ({ ...question, courseId, cacheKey: `${courseId}:${question.id}` }));
    await fullDiveDatabase.transaction(
      'rw',
      [fullDiveDatabase.catalogMeta, fullDiveDatabase.practiceSources, fullDiveDatabase.practiceQuestions],
      async () => {
        await Promise.all([
          fullDiveDatabase.catalogMeta.put(meta),
          fullDiveDatabase.practiceSources.where('courseId').equals(courseId).delete(),
          fullDiveDatabase.practiceQuestions.where('courseId').equals(courseId).delete()
        ]);
        await Promise.all([fullDiveDatabase.practiceSources.bulkPut(sources), fullDiveDatabase.practiceQuestions.bulkPut(questions)]);
      }
    );
  }

  private sessionStorageKey(courseId: string) { return `full-dive-ap:${courseId}:study-sessions`; }

  private readLegacySessions(courseId: string): StudySession[] {
    try {
      const current = localStorage.getItem(this.sessionStorageKey(courseId));
      const priorBrand = localStorage.getItem(`studypath:${courseId}:study-sessions`);
      const legacy = courseId === 'ap-calculus' ? localStorage.getItem('calcpath-study-sessions-v2') : null;
      const value = JSON.parse(current ?? priorBrand ?? legacy ?? '[]');
      return Array.isArray(value) ? value.map((session) => ({ ...session, courseId })) : [];
    } catch { return []; }
  }
}
