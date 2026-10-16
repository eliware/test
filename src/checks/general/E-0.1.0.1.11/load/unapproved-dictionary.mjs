import { readFileSync } from "node:fs";

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

export function parseUnapprovedCsv(text) {
  const rows = [];
  let row = [];
  let field = "";
  let quoted = false;
  for (let index = 0; index < text.length; index += 1) {
    const character = text[index];
    if (quoted && character === '"' && text[index + 1] === '"') {
      field += '"';
      index += 1;
    } else if (character === '"') {
      quoted = !quoted;
    } else if (character === "," && !quoted) {
      row.push(field);
      field = "";
    } else if ((character === "\n" || character === "\r") && !quoted) {
      if (character === "\r" && text[index + 1] === "\n") index += 1;
      row.push(field);
      rows.push(row);
      row = [];
      field = "";
    } else {
      field += character;
    }
  }
  if (quoted) throw new Error("Dictionary CSV contains an unclosed quoted field.");
  if (field || row.length) {
    row.push(field);
    rows.push(row);
  }
  return rows;
}
