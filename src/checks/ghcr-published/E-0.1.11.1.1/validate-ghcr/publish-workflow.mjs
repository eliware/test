import { readGhcrPublishWorkflow } from "../../shared/read-ghcr-publish-workflow.mjs";
import { hasDeploymentCommand } from "../has-deployment-command.mjs";
import {
  hasCanonicalReleaseTagFilter,
  hasCanonicalReleaseTagGuard,
} from "../../../shared/publish-workflow/validate-release-tag-guard.mjs";
import {
  hasGhcrPublisherPermissions,
  hasGhcrWorkflowReadPermissions,
} from "./workflow-permissions.mjs";
import { validateGhcrImagePushes } from "./image-pushes.mjs";

export async function validateGhcrPublishWorkflow(inventory, packageJson = {}) {
  const parsed = await readGhcrPublishWorkflow(inventory);
  if (parsed.error) return [parsed.error];
  const errors = [];
  const files = await inventory.files("all");
  if (!files.includes("Dockerfile")) errors.push("Repository root must contain Dockerfile.");
  const jobs = parsed.workflow?.jobs ?? {};
  if (!hasGhcrWorkflowReadPermissions(parsed.workflow?.permissions))
    errors.push("GHCR workflow permissions must contain only contents: read.");
  const publish = jobs.publish;
  const steps = publish?.steps ?? [];
  const packageName = String(packageJson?.name ?? "").replace(/^@eliware\//u, "");
  const image = "${{ env.IMAGE_NAME }}";
  if (publish?.env?.IMAGE_NAME !== "ghcr.io/${{ github.repository }}")
    errors.push("GHCR publish job must derive IMAGE_NAME from github.repository.");
  if (!/^[a-z0-9]+(?:[._-][a-z0-9]+)*$/u.test(packageName))
    errors.push("GHCR image name must use the unscoped package name.");
  if (!publish || publish.environment !== "ghcr-publish")
    errors.push("GHCR publish job must use the ghcr-publish environment.");
  if (!/^ubuntu(?:-|$)/iu.test(String(publish?.["runs-on"] ?? "")))
    errors.push("GHCR publish job must run on Ubuntu.");
  if (publish?.if !== undefined || publish?.["continue-on-error"] !== undefined)
    errors.push("GHCR publish job must run without bypass conditions.");
  if (!hasGhcrPublisherPermissions(publish?.permissions))
    errors.push(
      "GHCR publish job must set the required read, package, and attestation permissions.",
    );
  const checkouts = steps.filter(
    (step) => typeof step?.uses === "string" && step.uses.startsWith("actions/checkout@"),
  );
  if (checkouts.length !== 1 || checkouts[0]?.uses !== "actions/checkout@v7")
    errors.push("GHCR publisher must use checkout v7 once.");
  const pushes = steps.filter(
    (step) => typeof step?.uses === "string" && step.uses.startsWith("docker/build-push-action@"),
  );
  if (
    !hasCanonicalReleaseTagGuard(
      parsed.workflow,
      steps,
      packageJson?.version,
      steps.indexOf(pushes[0]),
    )
  )
    errors.push("GHCR publisher must guard publication with the canonical package version tag.");
  if (!hasCanonicalReleaseTagFilter(parsed.workflow))
    errors.push("GHCR workflow must trigger on version tags.");
  errors.push(...validateGhcrImagePushes(pushes, image));
  if (hasDeploymentCommand(steps))
    errors.push("GHCR publisher must not declare deployment commands.");
  return errors;
}
