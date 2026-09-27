import { isApprovedNpmPublishCommand } from "./is-approved-npm-publish-command.mjs";
import { steps } from "../../ghcr-published/workflow-structure.mjs";

export function hasNpmProvenancePublish(job) {
  return steps(job).some(({ run }) => {
    const command = typeof run === "string" ? run.trim() : "";
    return isApprovedNpmPublishCommand(command) && /(?:^|\s)--provenance(?:\s|$)/u.test(command);
  });
}
