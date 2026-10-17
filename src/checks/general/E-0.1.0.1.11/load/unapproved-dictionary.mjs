import { readFileSync } from "node:fs";
import { parseUnapprovedCsv } from "./parse-unapproved-csv.mjs";

export function loadUnapprovedDictionary(
  csvText = readFileSync(
    new URL("../../../../../dictionary/unapproved.csv", import.meta.url),
    "utf8",
  ),
) {
  const rows = parseUnapprovedCsv(csvText);
  const [header, ...records] = rows;
  if (header?.[0] !== "word" || header.length < 2)
    throw new Error("Dictionary CSV has an invalid header.");
  const dictionary = {};
  for (const [index, row] of records.entries()) {
    if (row.length > header.length || !row[0])
      throw new Error(`Dictionary CSV row ${index + 2} is invalid.`);
    dictionary[row[0]] = row.slice(1).filter(Boolean).join(", ");
  }
  return dictionary;
}
