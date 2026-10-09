import { readGhcrPublishWorkflow } from "../shared/read-ghcr-publish-workflow.mjs";
import { hasDeploymentCommand } from "./has-deployment-command.mjs";

export async function validateGhcrPublishWorkflow(inventory, packageJson = {}) {
  const parsed = await readGhcrPublishWorkflow(inventory);
  if (parsed.error) return [parsed.error];
  const errors = [];
  const files = await inventory.files("all");
  if (!files.includes("Dockerfile")) errors.push("Repository root must contain Dockerfile.");
  const jobs = parsed.workflow?.jobs ?? {};
  if (!hasReadPermissions(parsed.workflow?.permissions))
    errors.push("GHCR workflow permissions must contain only contents: read.");
  const publish = jobs.publish;
  const steps = publish?.steps ?? [];
  const packageName = String(packageJson?.name ?? "").replace(/^@eliware\//u, "");
  const image = `ghcr.io/eliware/${packageName}`;
  if (!/^[a-z0-9]+(?:[._-][a-z0-9]+)*$/u.test(packageName))
    errors.push("GHCR image name must use the unscoped package name.");
  if (!publish || publish.environment !== "ghcr-publish")
    errors.push("GHCR publish job must use the ghcr-publish environment.");
  if (!/^ubuntu(?:-|$)/iu.test(String(publish?.["runs-on"] ?? "")))
    errors.push("GHCR publish job must run on Ubuntu.");
  if (publish?.if !== undefined || publish?.["continue-on-error"] !== undefined)
    errors.push("GHCR publish job must run without bypass conditions.");
  if (!hasPermissions(publish?.permissions))
    errors.push(
      "GHCR publish job must set the required read, package, and attestation permissions.",
    );
  const checkouts = steps.filter(
    (step) => typeof step?.uses === "string" && step.uses.startsWith("actions/checkout@"),
  );
  if (checkouts.length !== 1 || checkouts[0]?.uses !== "actions/checkout@v6")
    errors.push("GHCR publisher must use checkout v6 once.");
  const pushes = steps.filter(
    (step) => typeof step?.uses === "string" && step.uses.startsWith("docker/build-push-action@"),
  );
  if (!pushes.length) errors.push("GHCR publisher must build and push an image.");
  for (const push of pushes) {
    if (push.uses !== "docker/build-push-action@v6")
      errors.push("GHCR image builds must use docker/build-push-action v6.");
    if (
      push.with?.context !== "." ||
      push.with?.file !== "./Dockerfile" ||
      push.with?.push !== true
    )
      errors.push("GHCR image push must use the root context and root Dockerfile.");
    if (!validImageTags(push.with?.tags, image, packageJson?.version))
      errors.push(
        "GHCR image tags must use one package-derived name and the exact v-prefixed version.",
      );
    if (!unconditional(push)) errors.push("GHCR image push steps must run unconditionally.");
  }
  if (hasWrongTagTrigger(parsed.workflow))
    errors.push("GHCR workflow must trigger on version tags.");
  if (hasDeploymentCommand(steps))
    errors.push("GHCR publisher must not declare deployment commands.");
  return errors;
}

function hasPermissions(value) {
  const required = {
    contents: "read",
    packages: "write",
    "id-token": "write",
    attestations: "write",
    "artifact-metadata": "write",
  };
  return (
    value &&
    Object.keys(value).length === Object.keys(required).length &&
    Object.entries(required).every(([key, permission]) => value[key] === permission)
  );
}

function hasReadPermissions(value) {
  return value && Object.keys(value).length === 1 && value.contents === "read";
}

function validImageTags(value, image, version) {
  const tags = (Array.isArray(value) ? value : String(value ?? "").split(/\r?\n/u))
    .map((tag) => String(tag).trim())
    .filter(Boolean);
  return (
    tags.length > 0 &&
    tags.every((tag) => tag.startsWith(`${image}:`)) &&
    tags.includes(`${image}:v${version}`)
  );
}

function hasWrongTagTrigger(workflow) {
  const tags = workflow?.on?.push?.tags ?? workflow?.true?.push?.tags;
  return !Array.isArray(tags) || tags.length !== 1 || tags[0] !== "v[0-9]*.[0-9]*.[0-9]*";
}

function unconditional(step) {
  return step?.if === undefined && step?.["continue-on-error"] === undefined;
}
