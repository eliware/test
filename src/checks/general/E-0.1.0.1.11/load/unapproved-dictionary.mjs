import { readFileSync } from "node:fs";
import { parseUnapprovedCsv } from "./parse-unapproved-csv.mjs";
import { validateUnapprovedDictionaryRecords } from "./validate-unapproved-dictionary-records.mjs";

export function loadUnapprovedDictionary(
  csvText = readFileSync(
    new URL("../../../../../dictionary/unapproved.csv", import.meta.url),
    "utf8",
  ),
) {
  const records = validateUnapprovedDictionaryRecords(parseUnapprovedCsv(csvText));
  const dictionary = {};
  for (const row of records) {
    dictionary[row[0]] = row.slice(1).filter(Boolean).join(", ");
  }
  return dictionary;
}
