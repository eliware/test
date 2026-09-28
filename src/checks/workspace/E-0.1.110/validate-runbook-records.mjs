import { basename } from "node:path";
import { validRecord } from "./validate-runbook-shape.mjs";

export function validateRunbookRecords(records) {
  const ids = new Set();
  const filesByPath = new Map();
  const failures = [];
  for (const { file, record, error } of records) {
    if (error) {
      failures.push(`Runbook ${basename(file)} must be valid JSON: ${error.message}`);
      continue;
    }
    if (!validRecord(record)) {
      failures.push(`Runbook ${basename(file)} must match the generic runbook record contract.`);
      continue;
    }
    if (ids.has(record.id)) failures.push(`Runbook IDs must be unique: ${record.id}.`);
    ids.add(record.id);
    filesByPath.set(file, record);
  }
  return { error: failures.length ? failures.join("\n") : null, filesByPath };
}
