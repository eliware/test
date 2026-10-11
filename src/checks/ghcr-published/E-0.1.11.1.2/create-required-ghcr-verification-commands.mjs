export function createRequiredGhcrVerificationCommands(image, version, expression) {
  const inspect = `docker buildx imagetools inspect ${image}:v${version} --format '{{.Manifest.Digest}}'`;
  return [
    (run) => run === `test "$(${inspect})" = "${expression}"`,
    (run) => run === `docker buildx imagetools inspect ${image}@${expression}`,
    (run) =>
      run === `gh attestation verify oci://${image}@${expression} --repo \${{ github.repository }}`,
    (run) =>
      new RegExp(
        `^echo\\s+["']?${escapePattern(expression)}["']?\\s+>>\\s+["']?\\$GITHUB_STEP_SUMMARY["']?$`,
        "u",
      ).test(run),
  ];
}

function escapePattern(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/gu, "\\$&");
}
