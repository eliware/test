export function hasExactTagTrigger(workflow) {
  const trigger = workflow.document?.on ?? workflow.document?.true;
  const tags = trigger?.push?.tags;
  return Boolean(
    trigger &&
    Object.keys(trigger).every((event) => event === "push") &&
    trigger.push &&
    typeof trigger.push === "object" &&
    !Array.isArray(trigger.push) &&
    Object.keys(trigger.push).length === 1 &&
    Array.isArray(tags) &&
    tags.length === 1 &&
    tags[0] === releaseTagFilter,
  );
}
import { releaseTagFilter } from "./release-version-tag.mjs";
