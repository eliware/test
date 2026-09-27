import { hasExactTagTrigger } from "../../ghcr-published/has-exact-tag-trigger.mjs";
import {
  isTagRelease,
  tagMatchesPackageVersion,
} from "../../ghcr-published/release-version-tag.mjs";
import { npmPublicationJobs } from "../npm-publication-jobs.mjs";
import { validateNpmPublicationJob } from "./validate-npm-publication-job.mjs";

export function validateNpmPublicationWorkflow(workflow, version, env) {
  const publicationJobs = npmPublicationJobs(workflow);
  return (
    hasExactTagTrigger(workflow) &&
    typeof version === "string" &&
    (!isTagRelease(env) || tagMatchesPackageVersion(env.GITHUB_REF_NAME, version)) &&
    publicationJobs.length > 0 &&
    publicationJobs.every(({ job }) => validateNpmPublicationJob(workflow, job))
  );
}
