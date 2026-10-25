export function validateUnapprovedDictionaryRecords(rows) {
  const [header, ...records] = rows;
  if (header?.[0] !== "word" || header.length < 2)
    throw new Error("Dictionary CSV has an invalid header.");
  for (const [index, row] of records.entries()) {
    if (row.length > header.length || !row[0])
      throw new Error(`Dictionary CSV row ${index + 2} is invalid.`);
  }
  return records;
}
