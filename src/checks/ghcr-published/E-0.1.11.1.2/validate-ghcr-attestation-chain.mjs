import { readGhcrPublishWorkflow } from "../shared/read-ghcr-publish-workflow.mjs";

export async function validateGhcrAttestationChain(inventory, packageJson = {}) {
  const parsed = await readGhcrPublishWorkflow(inventory);
  if (parsed.error) return [parsed.error];
  const steps = parsed.workflow?.jobs?.publish?.steps ?? [];
  const pushes = steps
    .map((step, index) => ({ step, index }))
    .filter(
      ({ step }) =>
        typeof step?.uses === "string" &&
        step.uses.startsWith("docker/build-push-action@") &&
        step.with?.push === true,
    );
  if (!pushes.length) return ["GHCR publisher must contain an image push before attestation."];
  const errors = [];
  const ids = pushes.map(({ step }) => step.id);
  if (ids.some((id) => typeof id !== "string" || !/^[A-Za-z_][A-Za-z0-9_-]*$/u.test(id)))
    errors.push("Each GHCR image push must have a valid step ID.");
  if (new Set(ids).size !== ids.length) errors.push("GHCR image push step IDs must be unique.");
  const attests = steps.filter(
    (step) => typeof step?.uses === "string" && step.uses.startsWith("actions/attest@"),
  );
  if (attests.length !== pushes.length)
    errors.push("Each GHCR image push must have one matching attestation.");
  const image = `ghcr.io/eliware/${String(packageJson?.name ?? "").replace(/^@eliware\//u, "")}`;
  pushes.forEach(({ step, index }, position) => {
    const end = pushes[position + 1]?.index ?? steps.length;
    const expression = "${{ steps." + step.id + ".outputs.digest }}";
    const chain = steps
      .slice(index + 1, end)
      .map((item, offset) => ({ item, index: index + offset + 1 }));
    const attestation = chain.find(
      ({ item }) => typeof item?.uses === "string" && item.uses.startsWith("actions/attest@"),
    );
    if (!attestation || !validAttestation(attestation.item, image, expression)) {
      errors.push(
        `GHCR image push ${step.id ?? "(missing ID)"} must have a matching actions/attest v4 step.`,
      );
      return;
    }
    const required = [
      (run) =>
        run.includes(`docker buildx imagetools inspect ${image}:v${packageJson?.version}`) &&
        run.includes(expression) &&
        run.includes("="),
      (run) => run.includes(`docker buildx imagetools inspect ${image}@${expression}`),
      (run) => run.includes(`gh attestation verify oci://${image}@${expression}`),
      (run) => validSummaryCommand(run, expression),
    ];
    let prior = attestation.index;
    for (const [ruleIndex, matches] of required.entries()) {
      const found = chain.find(
        ({ item, index: stepIndex }) =>
          stepIndex > prior && typeof item?.run === "string" && matches(item.run),
      );
      if (!found || !unconditional(found.item)) {
        errors.push(
          "GHCR push verification, inspection, attestation, and digest summary steps must run in order and unconditionally.",
        );
        break;
      }
      prior = found.index;
      if (
        position === pushes.length - 1 &&
        ruleIndex === required.length - 1 &&
        prior !== steps.length - 1
      )
        errors.push("The final GHCR verification chain must end at the last publish job step.");
    }
  });
  return errors;
}

function validAttestation(step, image, expression) {
  return (
    step?.uses === "actions/attest@v4" &&
    step.with?.["subject-name"] === image &&
    step.with?.["subject-digest"] === expression &&
    step.with?.["push-to-registry"] === true &&
    unconditional(step)
  );
}

function validSummaryCommand(command, expression) {
  return new RegExp(
    `^echo\\s+["']?${escapePattern(expression)}["']?\\s+>>\\s+["']?\\$GITHUB_STEP_SUMMARY["']?$`,
    "u",
  ).test(command);
}

function escapePattern(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/gu, "\\$&");
}

function unconditional(step) {
  return step?.if === undefined && step?.["continue-on-error"] === undefined;
}
