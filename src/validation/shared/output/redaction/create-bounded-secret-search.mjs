import { createBoundedFallbackSearch } from "../../search/create-bounded-fallback-search.mjs";
import { createIncrementalSearch } from "./create-incremental-secret-search.mjs";

export function createBoundedSecretSearch(values, workLimit, findSecretEnds) {
  const createStream = findSecretEnds.createStream;
  if (typeof createStream === "function")
    return createIncrementalSearch(values, workLimit, createStream);
  return createBoundedFallbackSearch(values, workLimit, findSecretEnds);
}
