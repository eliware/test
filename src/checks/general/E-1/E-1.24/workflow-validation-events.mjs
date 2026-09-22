import { normalizeWorkflowDocument } from "../../../ghcr-published/normalize-workflow-document.mjs";

export function workflowHasValidationEvents(document) {
  document = normalizeWorkflowDocument(document);
  const raw = document?.on ?? document?.true ?? {};
  const events = Array.isArray(raw) ? Object.fromEntries(raw.map((event) => [event, {}]))
    : typeof raw === "string" ? { [raw]: {} } : raw;
  const push = events.push;
  const mainPush =
    (Array.isArray(push) && push.includes("main")) ||
    (push && typeof push === "object" && Array.isArray(push.branches) && push.branches.includes("main"));
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
