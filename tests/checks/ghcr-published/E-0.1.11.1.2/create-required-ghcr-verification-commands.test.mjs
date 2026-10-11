import { expect, test } from "@jest/globals";
import { createRequiredGhcrVerificationCommands } from "../../../../src/checks/ghcr-published/E-0.1.11.1.2/create-required-ghcr-verification-commands.mjs";

test("matches each required digest verification command exactly", () => {
  const expression = "${{ steps.push.outputs.digest }}";
  const checks = createRequiredGhcrVerificationCommands(
    "ghcr.io/eliware/example",
    "12.0.0",
    expression,
  );
  const commands = [
    `test "$(docker buildx imagetools inspect ghcr.io/eliware/example:v12.0.0 --format '{{.Manifest.Digest}}')" = "${expression}"`,
    `docker buildx imagetools inspect ghcr.io/eliware/example@${expression}`,
    `gh attestation verify oci://ghcr.io/eliware/example@${expression} --repo \${{ github.repository }}`,
    `echo "${expression}" >> "$GITHUB_STEP_SUMMARY"`,
  ];
  expect(commands.every((command, index) => checks[index](command))).toBe(true);
  expect(checks[0]("echo docker buildx imagetools inspect")).toBe(false);
});
