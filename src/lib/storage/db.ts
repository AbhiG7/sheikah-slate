import type { SQLiteDatabase } from "expo-sqlite";

export const DATABASE_NAME = "sheikah-slate.db";

export async function migrateDbIfNeeded(db: SQLiteDatabase): Promise<void> {
  await db.execAsync(`
    PRAGMA journal_mode = WAL;
    CREATE TABLE IF NOT EXISTS pins (
      id TEXT PRIMARY KEY NOT NULL,
      label TEXT NOT NULL,
      latitude REAL NOT NULL,
      longitude REAL NOT NULL,
      altitude REAL,
      notes TEXT,
      color TEXT,
      sourceMode TEXT NOT NULL,
      createdAt INTEGER NOT NULL,
      updatedAt INTEGER NOT NULL
    );
  `);
}
