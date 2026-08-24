import 'fake-indexeddb/auto';
import { afterEach, describe, expect, it } from 'vitest';
import { CalcPathDatabase } from './practice-catalog.database';
import type { StudySession } from './practice-catalog.service';

const databases: CalcPathDatabase[] = [];

function createLegacyDatabase(name: string, session: StudySession): Promise<void> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(name, 1);
    request.onupgradeneeded = () => {
      const database = request.result;
      database.createObjectStore('catalog-meta', { keyPath: 'key' });
      database.createObjectStore('practice-sources', { keyPath: 'id' });
      const questions = database.createObjectStore('practice-questions', { keyPath: 'id' });
      questions.createIndex('topicId', 'topicId');
      questions.createIndex('sourceId', 'sourceId');
      questions.createIndex('type', 'type');
      questions.createIndex('difficulty', 'metadata.difficulty');
      database.createObjectStore('study-sessions', { keyPath: 'id' }).put(session);
    };
    request.onsuccess = () => { request.result.close(); resolve(); };
    request.onerror = () => reject(request.error);
  });
}

afterEach(async () => {
  await Promise.all(databases.splice(0).map(async (database) => { database.close(); await database.delete(); }));
});

describe('CalcPath Dexie database', () => {
  it('opens the existing native IndexedDB schema without losing a study session', async () => {
    const name = `calcpath-test-${crypto.randomUUID()}`;
    const session: StudySession = {
      id: 'session-1', name: 'Unit 1 test', topicIds: ['1.1'], questionIds: ['q1'], currentIndex: 0,
      totalSeconds: 90, results: {}, revealed: [], status: 'open', createdAt: '2026-08-23T00:00:00Z', updatedAt: '2026-08-23T00:01:30Z'
    };
    await createLegacyDatabase(name, session);

    const database = new CalcPathDatabase(name);
    databases.push(database);
    expect(await database.studySessions.get(session.id)).toEqual(session);
    expect(database.practiceQuestions.schema.indexes.map((index) => index.keyPath)).toEqual(
      expect.arrayContaining(['topicId', 'sourceId', 'type', 'metadata.difficulty'])
    );
  });
});
