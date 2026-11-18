import { basename } from "node:path";
export default function projectRepositoryDirectoryRecords(records) {
  return records.map((record) => ({
    name: basename(record.path),
    path: record.path,
    isFile: () => record.type === "file",
    isDirectory: () => record.type === "directory",
  }));
}
