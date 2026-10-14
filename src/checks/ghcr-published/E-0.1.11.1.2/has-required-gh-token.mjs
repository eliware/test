const githubToken = "${{ github.token }}";

export function hasRequiredGhToken(step, job) {
  const stepEnvironment = step?.env ?? {};
  const token = Object.hasOwn(stepEnvironment, "GH_TOKEN")
    ? stepEnvironment.GH_TOKEN
    : job?.env?.GH_TOKEN;
  return token === githubToken;
}
