import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { calcPathDatabase, type PracticeCatalogMeta } from './practice-catalog.database';

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
export type PracticeCatalog = { schemaVersion: number; revision: string; generatedAt: string; licenseNotice: string; catalogStats: Record<string, unknown>; sources: PracticeSource[]; questions: StoredPracticeQuestion[] };
export type StudySession = {
  id: string; name: string; topicIds: string[]; questionIds: string[]; currentIndex: number; totalSeconds: number;
  results: Record<string, PracticeGrade>; revealed: string[]; status: 'open' | 'dismissed'; createdAt: string; updatedAt: string; questionLimitPerTopic?: number; selectionSeed?: number;
};

const CATALOG_META_KEY = 'practice-catalog';

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

  async load(url: string): Promise<PracticeQuestion[]> {
    const cached = await this.readCatalog().catch(() => null);
    try {
      const server = await firstValueFrom(this.http.get<PracticeCatalog>(url));
      if (!cached || cached.revision !== server.revision) await this.writeCatalog(server).catch(() => undefined);
      return hydrateCatalog(server);
    } catch (error) {
      if (cached) return hydrateCatalog(cached);
      throw error;
    }
  }

  async loadSessions(): Promise<StudySession[]> {
    const legacy = this.readLegacySessions();
    try {
      const sessions = await calcPathDatabase.studySessions.toArray();
      if (sessions.length) return sessions;
      if (legacy.length) { await this.saveSessions(legacy); localStorage.removeItem('calcpath-study-sessions-v2'); }
      return legacy;
    } catch { return legacy; }
  }

  async saveSessions(sessions: StudySession[]): Promise<void> {
    try {
      await calcPathDatabase.transaction('rw', calcPathDatabase.studySessions, async () => {
        await calcPathDatabase.studySessions.clear();
        await calcPathDatabase.studySessions.bulkPut(sessions);
      });
    } catch { localStorage.setItem('calcpath-study-sessions-v2', JSON.stringify(sessions)); }
  }

  private async readCatalog(): Promise<PracticeCatalog | null> {
    const [meta, sources, questions] = await calcPathDatabase.transaction(
      'r',
      [calcPathDatabase.catalogMeta, calcPathDatabase.practiceSources, calcPathDatabase.practiceQuestions],
      () => Promise.all([
        calcPathDatabase.catalogMeta.get(CATALOG_META_KEY),
        calcPathDatabase.practiceSources.toArray(),
        calcPathDatabase.practiceQuestions.toArray()
      ])
    );
    if (!meta) return null;
    const { key: _key, ...catalog } = meta;
    return { ...catalog, sources, questions };
  }

  private async writeCatalog(catalog: PracticeCatalog): Promise<void> {
    const meta: PracticeCatalogMeta = {
      key: CATALOG_META_KEY,
      schemaVersion: catalog.schemaVersion,
      revision: catalog.revision,
      generatedAt: catalog.generatedAt,
      licenseNotice: catalog.licenseNotice,
      catalogStats: catalog.catalogStats
    };
    await calcPathDatabase.transaction(
      'rw',
      [calcPathDatabase.catalogMeta, calcPathDatabase.practiceSources, calcPathDatabase.practiceQuestions],
      async () => {
        await Promise.all([
          calcPathDatabase.catalogMeta.clear(),
          calcPathDatabase.practiceSources.clear(),
          calcPathDatabase.practiceQuestions.clear()
        ]);
        await Promise.all([
          calcPathDatabase.catalogMeta.put(meta),
          calcPathDatabase.practiceSources.bulkPut(catalog.sources),
          calcPathDatabase.practiceQuestions.bulkPut(catalog.questions)
        ]);
      }
    );
  }

  private readLegacySessions(): StudySession[] {
    try { const value = JSON.parse(localStorage.getItem('calcpath-study-sessions-v2') ?? '[]'); return Array.isArray(value) ? value : []; } catch { return []; }
  }
}
