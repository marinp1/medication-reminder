import Database from '../src/db';
import TEST_ENTRIES, { ALL_ENTRIES } from './test_data';

describe('Database', () => {
  let db: Database;

  beforeAll(async () => {
    db = new Database();
    await ALL_ENTRIES.forEach(async doc => db.insertDocument(doc));
    expect(db.getDocumentCount()).resolves.toBe(ALL_ENTRIES.length);
  });

  it('should fetch latest success correctly', async () => {
    expect(db.getLatestSuccess()).resolves.toMatchObject(
      TEST_ENTRIES.SUCCESS_LATE,
    );
  });
});
