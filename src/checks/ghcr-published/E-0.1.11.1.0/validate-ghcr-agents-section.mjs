import { readGhcrPublishWorkflow } from "../shared/read-ghcr-publish-workflow.mjs";

export async function validateGhcrAgentsSection(inventory, packageJson = {}) {
  if (!inventory?.readText) return ["AGENTS.md could not be inspected."];
  const parsed = await readGhcrPublishWorkflow(inventory);
  if (parsed.error) return [parsed.error];
  try {
    const lines = (await inventory.readText("AGENTS.md")).split(/\r?\n/u);
    const heading = lines.indexOf("## GHCR publication");
    if (heading < 0) return ["AGENTS.md must include: ## GHCR publication"];
    const nextHeading = lines.findIndex((line, index) => index > heading && /^##\s/u.test(line));
    const section = lines.slice(heading, nextHeading < 0 ? undefined : nextHeading);
    const name = String(packageJson?.name ?? "").replace(/^@eliware\//u, "");
    const image = `ghcr.io/eliware/${name}`;
    const latest = hasLatestTag(parsed.workflow);
    const required = [
      `Image: ${image}`,
      `Pull command: docker pull ${image}:v${packageJson?.version}`,
      latest ? "Supported tags: vMAJOR.MINOR.PATCH, latest" : "Supported tags: vMAJOR.MINOR.PATCH",
      "Deployment boundary: publication does not deploy; deploy by immutable version tag and recorded sha256 digest.",
    ];
    if (latest)
      required.push(
        "latest is a mutable convenience alias and is never the release or deployment identity.",
      );
    return required
      .filter((line) => !section.includes(line))
      .map((line) => `AGENTS.md must include: ${line}`);
  } catch (error) {
    return [`AGENTS.md could not be inspected: ${error.message}`];
  }
}

function hasLatestTag(workflow) {
  const steps = workflow?.jobs?.publish?.steps ?? [];
  return steps.some((step) => {
    const tags = step?.with?.tags;
    return (Array.isArray(tags) ? tags : String(tags ?? "").split(/\r?\n/u)).some((tag) =>
      /:latest\s*$/u.test(String(tag).trim()),
    );
  });
}
