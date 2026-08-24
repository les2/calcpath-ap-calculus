import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { firstValueFrom } from 'rxjs';

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

const DATABASE_NAME = 'calcpath';
const DATABASE_VERSION = 1;
const CATALOG_META_KEY = 'practice-catalog';

function requestResult<T>(request: IDBRequest<T>): Promise<T> {
  return new Promise((resolve, reject) => { request.onsuccess = () => resolve(request.result); request.onerror = () => reject(request.error); });
}

function transactionDone(transaction: IDBTransaction): Promise<void> {
  return new Promise((resolve, reject) => { transaction.oncomplete = () => resolve(); transaction.onerror = () => reject(transaction.error); transaction.onabort = () => reject(transaction.error); });
}

function openDatabase(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DATABASE_NAME, DATABASE_VERSION);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains('catalog-meta')) db.createObjectStore('catalog-meta', { keyPath: 'key' });
      if (!db.objectStoreNames.contains('practice-sources')) db.createObjectStore('practice-sources', { keyPath: 'id' });
      if (!db.objectStoreNames.contains('practice-questions')) {
        const questions = db.createObjectStore('practice-questions', { keyPath: 'id' });
        questions.createIndex('topicId', 'topicId'); questions.createIndex('sourceId', 'sourceId'); questions.createIndex('type', 'type'); questions.createIndex('difficulty', 'metadata.difficulty');
      }
      if (!db.objectStoreNames.contains('study-sessions')) db.createObjectStore('study-sessions', { keyPath: 'id' });
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

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
      const db = await openDatabase();
      const transaction = db.transaction('study-sessions', 'readonly');
      const done = transactionDone(transaction);
      const sessions = await requestResult(transaction.objectStore('study-sessions').getAll()) as StudySession[];
      await done; db.close();
      if (sessions.length) return sessions;
      if (legacy.length) { await this.saveSessions(legacy); localStorage.removeItem('calcpath-study-sessions-v2'); }
      return legacy;
    } catch { return legacy; }
  }

  async saveSessions(sessions: StudySession[]): Promise<void> {
    try {
      const db = await openDatabase();
      const transaction = db.transaction('study-sessions', 'readwrite');
      const done = transactionDone(transaction);
      const store = transaction.objectStore('study-sessions'); store.clear(); for (const session of sessions) store.put(session);
      await done; db.close();
    } catch { localStorage.setItem('calcpath-study-sessions-v2', JSON.stringify(sessions)); }
  }

  private async readCatalog(): Promise<PracticeCatalog | null> {
    const db = await openDatabase();
    const transaction = db.transaction(['catalog-meta', 'practice-sources', 'practice-questions'], 'readonly');
    const done = transactionDone(transaction);
    const [meta, sources, questions] = await Promise.all([
      requestResult(transaction.objectStore('catalog-meta').get(CATALOG_META_KEY)),
      requestResult(transaction.objectStore('practice-sources').getAll()),
      requestResult(transaction.objectStore('practice-questions').getAll())
    ]);
    await done; db.close();
    if (!meta) return null;
    const { key: _key, ...catalog } = meta as PracticeCatalog & { key: string };
    return { ...catalog, sources: sources as PracticeSource[], questions: questions as StoredPracticeQuestion[] };
  }

  private async writeCatalog(catalog: PracticeCatalog): Promise<void> {
    const db = await openDatabase();
    const transaction = db.transaction(['catalog-meta', 'practice-sources', 'practice-questions'], 'readwrite');
    const done = transactionDone(transaction);
    const sources = transaction.objectStore('practice-sources'), questions = transaction.objectStore('practice-questions');
    sources.clear(); questions.clear();
    for (const source of catalog.sources) sources.put(source);
    for (const question of catalog.questions) questions.put(question);
    transaction.objectStore('catalog-meta').put({ key: CATALOG_META_KEY, schemaVersion: catalog.schemaVersion, revision: catalog.revision, generatedAt: catalog.generatedAt, licenseNotice: catalog.licenseNotice, catalogStats: catalog.catalogStats });
    await done; db.close();
  }

  private readLegacySessions(): StudySession[] {
    try { const value = JSON.parse(localStorage.getItem('calcpath-study-sessions-v2') ?? '[]'); return Array.isArray(value) ? value : []; } catch { return []; }
  }
}
