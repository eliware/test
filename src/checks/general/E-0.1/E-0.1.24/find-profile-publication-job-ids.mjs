import { ghcrPublicationJobs } from "../../../ghcr-published/workflow-publication.mjs";
import { npmPublicationJobs } from "../../../npm-published/npm-publication-jobs.mjs";

export function findProfilePublicationJobIds(workflow, profiles = []) {
  const ids = new Set();
  if (profiles.includes("npm-published")) {
    for (const { id } of npmPublicationJobs(workflow)) ids.add(id);
  }
  if (profiles.includes("ghcr-published")) {
    for (const { id } of ghcrPublicationJobs(workflow)) ids.add(id);
  }
  return ids;
}
