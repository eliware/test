import { minimatch } from "minimatch";
import { normalizeWorkflowDocument } from "../../../ghcr-published/normalize-workflow-document.mjs";
import { containsCompliantValidationJob } from "./contains-compliant-validation-job.mjs";

export function workflowHasValidationEvents(document) {
  document = normalizeWorkflowDocument(document);
  const raw = document?.on ?? document?.true ?? {};
  const events = Array.isArray(raw)
    ? Object.fromEntries(raw.map((event) => [event, {}]))
    : typeof raw === "string"
      ? { [raw]: {} }
      : raw;
  const push = events.push;
  const mainPush = pushAllowsMain(push);
  const pullRequest = pullRequestAllowsMain(events.pull_request);
  const compliantValidation = containsCompliantValidationJob("workflow.yml", document);
  return Boolean(mainPush && pullRequest && compliantValidation);
}

function pullRequestAllowsMain(event) {
  if (event === undefined || event === null || event === false) return false;
  if (typeof event !== "object" || Array.isArray(event)) return true;
  if (Array.isArray(event["branches-ignore"]) && event["branches-ignore"].some(patternMatchesMain)) {
    return false;
  }
  return branchPatternsAllowMain(event.branches, true);
}

function patternMatchesMain(pattern) {
  if (typeof pattern !== "string") return false;
  const positive = pattern.startsWith("!") ? pattern.slice(1) : pattern;
  return minimatch("main", positive, { dot: true, nonegate: true, nocomment: true });
}

function branchPatternsAllowMain(patterns, defaultValue) {
  if (!Array.isArray(patterns) || patterns.length === 0) return defaultValue;
  let included = false;
  for (const pattern of patterns) {
    if (typeof pattern !== "string") continue;
    const isNegative = pattern.startsWith("!");
    if (patternMatchesMain(pattern)) included = !isNegative;
  }
  return included;
}

function pushAllowsMain(push) {
  if (Array.isArray(push)) return push.includes("main");
  if (push === null || push === false) return false;
  if (push === undefined) return false;
  if (typeof push !== "object") return true;
  const branches = push.branches;
  if (Array.isArray(push["branches-ignore"]) && push["branches-ignore"].some(patternMatchesMain))
    return false;
  return branchPatternsAllowMain(branches, true);
}
