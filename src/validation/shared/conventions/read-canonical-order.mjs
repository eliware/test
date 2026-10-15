import { readFileSync } from "node:fs";
import { parseBoundedYamlValue } from "../yaml/parse-bounded-yaml-documents.mjs";
import { bundledConventionVersion } from "../../check-discovery/read/bundled-profile-catalog.mjs";
import { validateCanonicalOrderDocument } from "./validate/canonical-order-document.mjs";

const cache = new Map();

export function readCanonicalOrder(fileName, read = (url) => readFileSync(url, "utf8")) {
  if (!/^[a-z-]+\.yaml$/u.test(fileName)) throw new Error("Invalid canonical ordering file name.");
  if (!cache.has(fileName)) {
    const url = new URL(`../../../../specs/conventions/ordering/${fileName}`, import.meta.url);
    const document = parseBoundedYamlValue(read(url), url.pathname);
    if (
      document?.version !== bundledConventionVersion ||
      !document.orders ||
      typeof document.orders !== "object"
    )
      throw new Error(`Invalid canonical ordering specification: ${fileName}.`);
    if (validateCanonicalOrderDocument(document, fileName).length)
      throw new Error(`Invalid canonical ordering specification: ${fileName}.`);
    cache.set(fileName, document.orders);
  }
  return cache.get(fileName);
}
