import { readFile } from "node:fs/promises";
import { resolve } from "node:path";

const readsByContext = new WeakMap();

export function readRepositoryText(context, filePath) {
  if (!context || typeof context !== "object") return readFile(filePath, "utf8");

  let reads = readsByContext.get(context);
  if (!reads) {
    reads = new Map();
    readsByContext.set(context, reads);
  }

  const key = resolve(filePath);
  let pending = reads.get(key);
  if (!pending) {
    pending = readFile(filePath, "utf8");
    reads.set(key, pending);
  }
  return pending;
}
