export function createRequiredGhcrVerificationCommands(expression) {
  return [
    (run) =>
      run ===
      `test "$(docker buildx imagetools inspect "$IMAGE_NAME:$GITHUB_REF_NAME" --format '{{.Manifest.Digest}}')" = "${expression}"`,
    (run) => run === `docker buildx imagetools inspect "$IMAGE_NAME@${expression}"`,
    (run) =>
      run ===
      `gh attestation verify "oci://$IMAGE_NAME@${expression}" --repo "\${{ github.repository }}"`,
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
