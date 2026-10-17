export async function validateGhcrAgentsSection(inventory, packageJson = {}) {
  if (!inventory?.readText) return ["AGENTS.md could not be inspected."];
  try {
    const lines = (await inventory.readText("AGENTS.md")).split(/\r?\n/u);
    const heading = lines.indexOf("## GHCR publication");
    if (heading < 0) return ["AGENTS.md must include: ## GHCR publication"];
    const nextHeading = lines.findIndex((line, index) => index > heading && /^##\s/u.test(line));
    const section = lines.slice(heading, nextHeading < 0 ? undefined : nextHeading);
    const name = String(packageJson?.name ?? "").replace(/^@eliware\//u, "");
    const image = `ghcr.io/eliware/${name}`;
    const required = [
      `Image: ${image}`,
      `Pull command: docker pull ${image}:v${packageJson?.version}`,
      "Supported tags: vMAJOR.MINOR.PATCH",
      "Deployment boundary: Publication does not deploy. Use an immutable version tag and record its SHA-256 digest.",
    ];
    const errors = required
      .filter((line) => !section.includes(line))
      .map((line) => `AGENTS.md must include: ${line}`);
    if (section.some((line) => /^Supported tags:.*\blatest\b/u.test(line)))
      errors.push(
        "AGENTS.md must not list latest because the canonical workflow does not publish it.",
      );
    if (section.some((line) => line.startsWith("latest is a mutable convenience alias")))
      errors.push("AGENTS.md must not describe latest as a published tag.");
    return errors;
  } catch (error) {
    return [`AGENTS.md could not be inspected: ${error.message}`];
  }
}
