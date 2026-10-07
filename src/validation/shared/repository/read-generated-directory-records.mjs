const recordsByDirectoryEntries = new WeakMap();

export async function readGeneratedDirectoryRecords(directory, readDirectory) {
  const entries = await readDirectory(directory);
  let recordsByDirectory = recordsByDirectoryEntries.get(entries);
  if (!recordsByDirectory) {
    recordsByDirectory = new Map();
    recordsByDirectoryEntries.set(entries, recordsByDirectory);
  }
  if (recordsByDirectory.has(directory)) return recordsByDirectory.get(directory);
  const records = entries.flatMap((entry) => {
    const isDirectory = entry.isDirectory();
    if (!isDirectory && !entry.isFile()) return [];
    return [{ path: `${directory}/${entry.name}`, type: isDirectory ? "directory" : "file" }];
  });
  recordsByDirectory.set(directory, records);
  return records;
}
