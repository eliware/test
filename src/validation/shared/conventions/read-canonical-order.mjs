import { readFileSync } from "node:fs";
import { parse } from "yaml";

const cache = new Map();

export function readCanonicalOrder(fileName, read = (url) => readFileSync(url, "utf8")) {
  if (!/^[a-z-]+\.yaml$/u.test(fileName)) throw new Error("Invalid canonical ordering file name.");
  if (!cache.has(fileName)) {
    const url = new URL(`../../../../specs/conventions/ordering/${fileName}`, import.meta.url);
    const document = parse(read(url));
    if (document?.version !== "12.0" || !document.orders || typeof document.orders !== "object")
      throw new Error(`Invalid canonical ordering specification: ${fileName}.`);
    cache.set(fileName, document.orders);
  }
  return cache.get(fileName);
}
