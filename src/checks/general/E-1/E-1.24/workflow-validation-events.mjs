import { normalizeWorkflowDocument } from "../../../ghcr-published/normalize-workflow-document.mjs";

export function workflowHasValidationEvents(document) {
  document = normalizeWorkflowDocument(document);
  const raw = document?.on ?? document?.true ?? {};
  const events = Array.isArray(raw) ? Object.fromEntries(raw.map((event) => [event, {}]))
    : typeof raw === "string" ? { [raw]: {} } : raw;
  const push = events.push;
  const mainPush = pushAllowsMain(push);
  const pullRequest = Object.hasOwn(events, "pull_request");
  const jobs = Object.values(document?.jobs ?? {});
  const ubuntu = jobs.some(
    (job) =>
      job &&
      (job["runs-on"] === "ubuntu-latest" ||
        (Array.isArray(job["runs-on"]) && job["runs-on"].includes("ubuntu-latest"))),
  );
  return Boolean(mainPush && pullRequest && ubuntu);
}

function patternMatchesMain(pattern) {
  if (typeof pattern !== "string") return false;
  const positive = pattern.startsWith("!") ? pattern.slice(1) : pattern;
  const expression = positive
    .replace(/[.+^${}()|[\]\\]/gu, "\\$&")
    .replaceAll("*", ".*")
    .replaceAll("?", ".");
  return new RegExp(`^${expression}$`, "u").test("main");
}

function branchPatternsAllowMain(patterns, defaultValue) {
  if (!Array.isArray(patterns) || patterns.length === 0) return defaultValue;
  let included = false;
  for (const pattern of patterns) {
    if (typeof pattern !== "string") continue;
    const isNegative = pattern.startsWith("!");
    if (patternMatchesMain(pattern) || (isNegative && patternMatchesMain(pattern))) included = !isNegative;
  }
  return included;
}

function pushAllowsMain(push) {
  if (Array.isArray(push)) return push.includes("main");
  if (push === null || push === false) return false;
  if (push === undefined) return false;
  if (typeof push !== "object") return true;
  const branches = push.branches;
  if (Array.isArray(push["branches-ignore"]) && push["branches-ignore"].some(patternMatchesMain)) return false;
  return branchPatternsAllowMain(branches, true);
}
