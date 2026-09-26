import { expect, test } from "@jest/globals";
import { hasOrderedImageVerificationChain } from "../../../src/checks/ghcr-published/has-ordered-image-verification-chain.mjs";

const image = "ghcr.io/eliware/example";
const digest = "${{ steps.push.outputs.digest }}";
const push = {
  id: "push",
  uses: "docker/build-push-action@v6",
  with: { push: true, tags: `${image}:v1.2.3` },
};
const verification = [
  { uses: "actions/attest@v4", with: { pushToRegistry: true, subjectName: image, subjectDigest: digest } },
  { run: `test "$(docker buildx imagetools inspect ${image}:v1.2.3 --format '{{.Manifest.Digest}}')" = "${digest}"` },
  { run: `docker buildx imagetools inspect ${image}@${digest}` },
  { run: `gh attestation verify oci://${image}@${digest} --repo \${{ github.repository }}` },
  { run: `echo verified ${digest} >> "$GITHUB_STEP_SUMMARY"` },
];

test("accepts a complete ordered verification chain", () => {
  expect(hasOrderedImageVerificationChain({ steps: [push, ...verification] })).toBe(true);
});

test("rejects missing or out-of-order verification evidence", () => {
  expect(hasOrderedImageVerificationChain({ steps: [push, ...verification.slice(0, 3)] })).toBe(false);
  expect(hasOrderedImageVerificationChain({ steps: [push, verification[1], verification[0], ...verification.slice(2)] })).toBe(false);
  expect(hasOrderedImageVerificationChain({ steps: [] })).toBe(false);
});

test("rejects pushes without a usable digest reference", () => {
  expect(hasOrderedImageVerificationChain({ steps: [{ ...push, id: "bad id" }, ...verification] })).toBe(false);
});

test("requires every pushed image to have its own verification chain", () => {
  const secondPush = {
    id: "second",
    uses: "docker/build-push-action@v6",
    with: { push: true, tags: "ghcr.io/eliware/other:v1.2.3" },
  };
  const secondDigest = "${{ steps.second.outputs.digest }}";
  const secondVerification = [
    { uses: "actions/attest@v4", with: { pushToRegistry: true, subjectName: "ghcr.io/eliware/other", subjectDigest: secondDigest } },
    { run: `test "$(docker buildx imagetools inspect ghcr.io/eliware/other:v1.2.3 --format '{{.Manifest.Digest}}')" = "${secondDigest}"` },
    { run: `docker buildx imagetools inspect ghcr.io/eliware/other@${secondDigest}` },
    { run: `gh attestation verify oci://ghcr.io/eliware/other@${secondDigest} --repo \${{ github.repository }}` },
    { run: `echo verified ${secondDigest} >> "$GITHUB_STEP_SUMMARY"` },
  ];
  expect(hasOrderedImageVerificationChain({ steps: [push, ...verification, secondPush, ...secondVerification] })).toBe(true);
  expect(hasOrderedImageVerificationChain({ steps: [push, ...verification, secondPush] })).toBe(false);
});
