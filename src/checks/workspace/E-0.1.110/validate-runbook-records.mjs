import { basename } from "node:path";
import { validRecord } from "./validate-runbook-shape.mjs";

export function validateRunbookRecords(records) {
  const ids = new Set();
  const filesByPath = new Map();
  for (const { file, record } of records) {
    if (!validRecord(record)) {
      return { error: `Runbook ${basename(file)} must match the generic runbook record contract.` };
    }
    if (ids.has(record.id)) return { error: `Runbook IDs must be unique: ${record.id}.` };
    ids.add(record.id);
    filesByPath.set(file, record);
  }
  return { error: null, filesByPath };
}
