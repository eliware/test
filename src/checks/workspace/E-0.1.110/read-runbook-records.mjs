import { readFile } from "node:fs/promises";

async function readRunbook(file) {
  return JSON.parse(await readFile(file, "utf8"));
}

export async function readRunbookRecords(files, inventory) {
  const records = [];
  for (const file of files) {
    const record = inventory
      ? await inventory.readParsed(file, "json", JSON.parse)
      : await readRunbook(file);
    records.push({ file, record });
  }
  return records;
}
