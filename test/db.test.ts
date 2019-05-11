import Database from '../src/db';
import TEST_ENTRIES, { ALL_ENTRIES } from './test_data';

describe('Database with content', () => {
  let db: Database;

  beforeAll(async () => {
    db = new Database();
    await ALL_ENTRIES.forEach(async doc => db.insertDocument(doc));
    expect(db.getDocumentCount()).resolves.toBe(ALL_ENTRIES.length);
  });

  it('should fetch latest success', async () => {
    expect(db.getLatestSuccess()).resolves.toMatchObject(
      TEST_ENTRIES.SUCCESS_LATE,
    );
  });

  it('should fetch number of skipped medications', async () => {
    expect(db.getSkippedCount()).resolves.toBe(2);
  });
});

describe('Empty database', () => {
  let db: Database;

  beforeAll(async () => {
    db = new Database();
  });

  it('should fail on success request', async () => {
    expect(db.getLatestSuccess()).rejects.toMatchInlineSnapshot();
  });
});
