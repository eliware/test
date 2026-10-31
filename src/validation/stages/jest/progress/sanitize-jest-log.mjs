import { readFile, writeFile } from "node:fs/promises";
import { stripJestProgressLines } from "./create/jest/console/strip-progress-lines.mjs";

export async function sanitizeJestLog(path, fs = {}) {
  const read = fs.read ?? readFile;
  const write = fs.write ?? writeFile;
  const output = await read(path, "utf8");
  const naturalOutput = stripJestProgressLines(output);
  if (naturalOutput !== output) await write(path, naturalOutput, "utf8");
}
