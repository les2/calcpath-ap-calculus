import Dexie, { type Table } from 'dexie';
import type { PracticeCatalog, PracticeSource, StoredPracticeQuestion, StudySession } from './practice-catalog.service';

export type PracticeCatalogMeta = Omit<PracticeCatalog, 'sources' | 'questions'> & { key: 'practice-catalog' };

/**
 * Device-local CalcPath data. Dexie opens and upgrades the existing `calcpath`
 * IndexedDB database created by earlier releases, so saved sessions survive the
 * change from the native IndexedDB wrapper.
 */
export class CalcPathDatabase extends Dexie {
  readonly catalogMeta!: Table<PracticeCatalogMeta, string>;
  readonly practiceSources!: Table<PracticeSource, string>;
  readonly practiceQuestions!: Table<StoredPracticeQuestion, string>;
  readonly studySessions!: Table<StudySession, string>;

  constructor(databaseName = 'calcpath') {
    super(databaseName);
    this.version(1).stores({
      'catalog-meta': '&key',
      'practice-sources': '&id, author',
      'practice-questions': '&id, topicId, sourceId, type, metadata.difficulty',
      'study-sessions': '&id, status, updatedAt'
    });
    this.catalogMeta = this.table('catalog-meta');
    this.practiceSources = this.table('practice-sources');
    this.practiceQuestions = this.table('practice-questions');
    this.studySessions = this.table('study-sessions');
  }
}

export const calcPathDatabase = new CalcPathDatabase();
