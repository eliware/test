import { readFile } from "node:fs/promises";
import { resolve } from "node:path";

const readsByContext = new WeakMap();
const parsedByContext = new WeakMap();

export function readRepositoryText(context, filePath) {
  if (context?.repositoryInventory?.readText) return context.repositoryInventory.readText(filePath);
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

export async function readRepositoryParsed(context, filePath, cacheKey, parse) {
  if (context?.repositoryInventory?.readParsed)
    return context.repositoryInventory.readParsed(filePath, cacheKey, parse);
  const text = await readRepositoryText(context, filePath);
  if (!context || typeof context !== "object") return parse(text);

  let parsed = parsedByContext.get(context);
  if (!parsed) {
    parsed = new Map();
    parsedByContext.set(context, parsed);
  }

  const key = `${resolve(filePath)}\0${cacheKey}`;
  if (!parsed.has(key)) parsed.set(key, parse(text));
  return parsed.get(key);
}
