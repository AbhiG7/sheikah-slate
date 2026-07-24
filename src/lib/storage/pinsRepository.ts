import * as Crypto from "expo-crypto";
import type { SQLiteDatabase } from "expo-sqlite";

import type { CreatePinInput, Pin, UpdatePinInput } from "@/types/pin";

import type { PinRow } from "./types";

function rowToPin(row: PinRow): Pin {
  return {
    id: row.id,
    label: row.label,
    latitude: row.latitude,
    longitude: row.longitude,
    altitude: row.altitude,
    notes: row.notes,
    color: row.color,
    sourceMode: row.sourceMode as Pin["sourceMode"],
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

export async function getAllPins(db: SQLiteDatabase): Promise<Pin[]> {
  const rows = await db.getAllAsync<PinRow>(
    "SELECT * FROM pins ORDER BY createdAt DESC"
  );
  return rows.map(rowToPin);
}

export async function getPinById(
  db: SQLiteDatabase,
  id: string
): Promise<Pin | null> {
  const row = await db.getFirstAsync<PinRow>(
    "SELECT * FROM pins WHERE id = ?",
    id
  );
  return row ? rowToPin(row) : null;
}

export async function createPin(
  db: SQLiteDatabase,
  input: CreatePinInput
): Promise<Pin> {
  const id = Crypto.randomUUID();
  const now = Date.now();

  await db.runAsync(
    `INSERT INTO pins (id, label, latitude, longitude, altitude, notes, color, sourceMode, createdAt, updatedAt)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    id,
    input.label,
    input.latitude,
    input.longitude,
    input.altitude ?? null,
    input.notes ?? null,
    input.color ?? null,
    input.sourceMode,
    now,
    now
  );

  return {
    id,
    label: input.label,
    latitude: input.latitude,
    longitude: input.longitude,
    altitude: input.altitude ?? null,
    notes: input.notes ?? null,
    color: input.color ?? null,
    sourceMode: input.sourceMode,
    createdAt: now,
    updatedAt: now,
  };
}

export async function updatePin(
  db: SQLiteDatabase,
  id: string,
  patch: UpdatePinInput
): Promise<void> {
  const existing = await getPinById(db, id);
  if (!existing) {
    throw new Error(`Pin not found: ${id}`);
  }

  const merged: Pin = {
    ...existing,
    ...patch,
    altitude: patch.altitude !== undefined ? patch.altitude : existing.altitude,
    notes: patch.notes !== undefined ? patch.notes : existing.notes,
    color: patch.color !== undefined ? patch.color : existing.color,
    updatedAt: Date.now(),
  };

  await db.runAsync(
    `UPDATE pins SET label = ?, latitude = ?, longitude = ?, altitude = ?, notes = ?, color = ?, updatedAt = ?
     WHERE id = ?`,
    merged.label,
    merged.latitude,
    merged.longitude,
    merged.altitude,
    merged.notes,
    merged.color,
    merged.updatedAt,
    id
  );
}

export async function deletePin(db: SQLiteDatabase, id: string): Promise<void> {
  await db.runAsync("DELETE FROM pins WHERE id = ?", id);
}
