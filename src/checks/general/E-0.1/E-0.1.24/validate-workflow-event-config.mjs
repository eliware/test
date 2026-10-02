import { isValidEventDetails } from "./validate-workflow-event-details.mjs";

const branchFilters = new Set([
  "branches",
  "branches-ignore",
  "paths",
  "paths-ignore",
  "tags",
  "tags-ignore",
]);
const eventFields = new Map([
  ["push", branchFilters],
  [
    "pull_request",
    new Set([...branchFilters].filter((field) => !field.startsWith("tags")).concat("types")),
  ],
  [
    "pull_request_target",
    new Set([...branchFilters].filter((field) => !field.startsWith("tags")).concat("types")),
  ],
  ["workflow_dispatch", new Set(["inputs"])],
  ["workflow_call", new Set(["inputs", "outputs", "secrets"])],
  ["workflow_run", new Set(["workflows", "types", "branches", "branches-ignore"])],
  ["repository_dispatch", new Set(["types"])],
]);
const typedActivityEvents = new Set([
  "branch_protection_rule",
  "check_run",
  "check_suite",
  "discussion",
  "discussion_comment",
  "fork",
  "issues",
  "issue_comment",
  "label",
  "merge_group",
  "milestone",
  "page_build",
  "pull_request_review",
  "pull_request_review_comment",
  "registry_package",
  "release",
  "watch",
  "workflow_job",
]);
const stringArrayFields = new Set([
  "branches",
  "branches-ignore",
  "paths",
  "paths-ignore",
  "tags",
  "tags-ignore",
  "types",
  "workflows",
]);

export function validateWorkflowEventConfigs(events) {
  return Object.entries(events).every(([event, config]) => isValidEventConfig(event, config));
}

function isValidEventConfig(event, config) {
  if (config === null) return true;
  if (event === "schedule")
    return (
      Array.isArray(config) &&
      config.length > 0 &&
      config.every(
        (entry) =>
          isRecord(entry) &&
          Object.keys(entry).every((key) => key === "cron") &&
          isText(entry.cron),
      )
    );
  if (!isRecord(config)) return false;
  // codescope ignore: deterministic validation intentionally accepts only event-specific fields represented by this convention's supported schema
  const allowedFields =
    eventFields.get(event) ?? (typedActivityEvents.has(event) ? new Set(["types"]) : new Set());
  return Object.entries(config).every(([field, value]) => {
    if (!allowedFields.has(field)) return false;
    if (stringArrayFields.has(field)) return isStringList(value);
    return isValidEventDetails(event, field, value);
  });
}

function isStringList(value) {
  return Array.isArray(value) && value.length > 0 && value.every(isText);
}

function isText(value) {
  return typeof value === "string" && value.length > 0;
}

function isRecord(value) {
  return Boolean(value && typeof value === "object" && !Array.isArray(value));
}
