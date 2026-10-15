import { writeFileSync } from "node:fs";

export function createJestConsoleReport(path, writeFile = writeFileSync) {
  const output = [];
  return {
    capture(testFilePath, entries = []) {
      for (const entry of entries)
        output.push({
          testFilePath,
          type: entry.type,
          message: entry.message,
          origin: entry.origin,
        });
    },
    persist() {
      if (path) writeFile(path, JSON.stringify(output), "utf8");
    },
  };
}
