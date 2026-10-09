import { parseAllDocuments } from "yaml";
import { validateWorkflowSteps } from "./validate-workflow-steps.mjs";

const workflowPath = ".github/workflows/ci.yaml";

export async function validateCiWorkflow(inventory, packageJson = {}) {
  if (!inventory?.files || !inventory.readText)
    return ["GitHub workflow files could not be inspected."];
  try {
    const files = (await inventory.files("all")).filter((path) =>
      path.startsWith(".github/workflows/"),
    );
    const publishAllowed = ["npm-published", "ghcr-published"].some((profile) =>
      packageJson?.eliware?.apply?.includes(profile),
    );
    const allowed = publishAllowed
      ? new Set([workflowPath, ".github/workflows/publish.yaml"])
      : new Set([workflowPath]);
    const errors = files
      .filter((file) => !allowed.has(file))
      .map((file) => `Unexpected workflow file: ${file}.`);
    if (!files.includes(workflowPath)) return [...errors, `${workflowPath} is required.`];
    const documents = parseAllDocuments(await inventory.readText(workflowPath));
    const parseError = documents.flatMap((document) => document.errors)[0];
    if (parseError)
      return [...errors, `${workflowPath} could not be parsed: ${parseError.message}`];
    if (documents.length !== 1)
      return [...errors, `${workflowPath} must contain exactly one document.`];
    return [...errors, ...validateDocument(documents[0].toJS())];
  } catch (error) {
    return [`GitHub workflow files could not be inspected: ${error.message}`];
  }
}

function validateDocument(document) {
  const errors = [];
  rejectUnknownKeys(
    document,
    ["name", "on", "true", "concurrency", "permissions", "jobs"],
    "workflow",
    errors,
  );
  const events = document.on ?? document.true;
  if (events && Object.keys(events).some((event) => !["push", "pull_request"].includes(event)))
    errors.push("ci.yaml must define only push and pull_request events.");
  for (const event of ["push", "pull_request"]) {
    if (!events?.[event]?.branches?.includes("main"))
      errors.push(`ci.yaml must enable ${event} for main.`);
    if (
      Object.keys(events?.[event] ?? {}).some((key) => key !== "branches") ||
      JSON.stringify(events?.[event]?.branches) !== '["main"]'
    )
      errors.push(`ci.yaml ${event} must define only the main branch.`);
  }
  if (
    document.concurrency?.group !== "${{ github.repository }}-${{ github.ref }}" ||
    document.concurrency?.["cancel-in-progress"] !== true
  )
    errors.push("ci.yaml must set repository-and-ref concurrency with cancellation enabled.");
  rejectUnknownKeys(document.concurrency, ["group", "cancel-in-progress"], "concurrency", errors);
  if (!onlyReadPermissions(document.permissions))
    errors.push("ci.yaml workflow permissions must contain only contents: read.");
  if (Object.hasOwn(document, "env"))
    errors.push("ci.yaml must not define inherited workflow environment values.");
  const jobNames = Object.keys(document.jobs ?? {});
  if (jobNames.some((name) => name !== "test"))
    errors.push("ci.yaml must use test as the only validation job key.");
  const jobs = Object.values(document.jobs ?? {});
  if (jobs.length !== 1) errors.push("ci.yaml must define one validation job.");
  const job = jobs.find((item) => Array.isArray(item?.steps));
  if (!job) return [...errors, "ci.yaml must define a validation job with steps."];
  rejectUnknownKeys(job, ["runs-on", "permissions", "steps"], "validation job", errors);
  if (!/^ubuntu(?:-|$)/iu.test(String(job["runs-on"] ?? "")))
    errors.push("ci.yaml validation job must run on Ubuntu.");
  if (job.if !== undefined || job["continue-on-error"] !== undefined)
    errors.push("ci.yaml validation job must run unconditionally without continue-on-error.");
  if (!onlyReadPermissions(job.permissions))
    errors.push("ci.yaml validation job permissions must contain only contents: read.");
  if (Object.hasOwn(job, "env"))
    errors.push("ci.yaml validation job must not define inherited environment values.");
  if (hasRunOverrides(document.defaults) || hasRunOverrides(job.defaults))
    errors.push("ci.yaml must not set inherited shell or working-directory overrides.");
  return [...errors, ...validateWorkflowSteps(job.steps)];
}

function rejectUnknownKeys(value, allowed, label, errors) {
  const unknown = Object.keys(value ?? {}).filter((key) => !allowed.includes(key));
  if (unknown.length) errors.push(`ci.yaml ${label} has unsupported keys: ${unknown.join(", ")}.`);
}

function hasRunOverrides(defaults) {
  return ["shell", "working-directory"].some((key) => Object.hasOwn(defaults?.run ?? {}, key));
}

function onlyReadPermissions(permissions) {
  return Boolean(
    permissions && Object.keys(permissions).length === 1 && permissions.contents === "read",
  );
}
