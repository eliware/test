import { discoverChecks } from "./discover-checks.mjs";

export async function selectConventionChecks(conventions) {
  return discoverChecks(conventions.apply);
}
