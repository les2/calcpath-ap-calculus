import Dexie, { type Table } from 'dexie';
import type { PracticeCatalog, PracticeSource, StoredPracticeQuestion, StudySession } from './practice-catalog.service';

export type PracticeCatalogMeta = Omit<PracticeCatalog, 'sources' | 'questions'> & { key: string; courseId: string };
export type CachedPracticeSource = PracticeSource & { cacheKey: string; courseId: string };
export type CachedPracticeQuestion = StoredPracticeQuestion & { cacheKey: string; courseId: string };

/**
 * Device-local Full Dive AP data. The legacy `calcpath` database name is retained
 * so existing AP Calculus training sessions survive the multi-course migration.
 */
export class FullDiveDatabase extends Dexie {
  readonly catalogMeta!: Table<PracticeCatalogMeta, string>;
  readonly practiceSources!: Table<CachedPracticeSource, string>;
  readonly practiceQuestions!: Table<CachedPracticeQuestion, string>;
  readonly studySessions!: Table<StudySession, string>;

  constructor(databaseName = 'calcpath') {
    super(databaseName);
    this.version(1).stores({
      'catalog-meta': '&key',
      'practice-sources': '&id, author',
      'practice-questions': '&id, topicId, sourceId, type, metadata.difficulty',
      'study-sessions': '&id, status, updatedAt'
    });
    this.version(2).stores({
      'catalog-meta': '&key, courseId',
      'practice-sources': null,
      'practice-questions': null,
      'study-sessions': '&id, courseId, status, updatedAt'
    }).upgrade(async (transaction) => {
      await transaction.table('catalog-meta').clear();
      await transaction.table('study-sessions').toCollection().modify((session: StudySession) => {
        if (!session.courseId) session.courseId = 'ap-calculus';
      });
    });
    this.version(3).stores({
      'catalog-meta': '&key, courseId',
      'practice-sources': '&cacheKey, courseId, id, author',
      'practice-questions': '&cacheKey, courseId, id, topicId, sourceId, type, metadata.difficulty',
      'study-sessions': '&id, courseId, status, updatedAt'
    });
    this.catalogMeta = this.table('catalog-meta');
    this.practiceSources = this.table('practice-sources');
    this.practiceQuestions = this.table('practice-questions');
    this.studySessions = this.table('study-sessions');
  }
}

export const fullDiveDatabase = new FullDiveDatabase();
