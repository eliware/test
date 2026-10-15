const releaseTagGuard = `node -e "const version=require('./package.json').version;if(!/^(0|[1-9][0-9]*)[.](0|[1-9][0-9]*)[.](0|[1-9][0-9]*)$/.test(version)||process.env.GITHUB_REF_NAME!=='v'+version)process.exit(1)"`;
const workflowReleaseTagGuard = `node -e "const version=require('./package.json').version;if(process.env.GITHUB_REF_NAME!=='v'+version)process.exit(1)"`;

export function hasCanonicalReleaseTagGuard(workflow, steps, version, finalStepIndex) {
  const guardIndex = steps.findIndex(
    (step) =>
      normalizeCommand(step?.run) === normalizeCommand(releaseTagGuard) ||
      normalizeCommand(step?.run) === normalizeCommand(workflowReleaseTagGuard),
  );
  const checkoutIndex = steps.findIndex((step) => step?.uses === "actions/checkout@v6");
  return (
    /^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)$/u.test(String(version)) &&
    hasCanonicalReleaseTagFilter(workflow) &&
    checkoutIndex >= 0 &&
    guardIndex > checkoutIndex &&
    guardIndex < finalStepIndex &&
    steps[guardIndex]?.if === undefined &&
    steps[guardIndex]?.["continue-on-error"] === undefined
  );
}

function normalizeCommand(command) {
  return typeof command === "string" ? command.replace(/\s+/gu, "") : "";
}

export function hasCanonicalReleaseTagFilter(workflow) {
  const triggers = workflow?.on ?? workflow?.true;
  const tags = triggers?.push?.tags;
  return Array.isArray(tags) && tags.length === 1 && tags[0] === "v[0-9]*.[0-9]*.[0-9]*";
}
