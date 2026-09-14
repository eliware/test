import { readFile } from "node:fs/promises";

async function readRunbook(file) {
  return JSON.parse(await readFile(file, "utf8"));
}

export async function readRunbookRecords(files) {
  const records = [];
  for (const file of files) records.push({ file, record: await readRunbook(file) });
  return records;
}
