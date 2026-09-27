import { expect, test } from "@jest/globals";
import { releaseTagGuard } from "../../../src/checks/ghcr-published/release-version-tag.mjs";
import { hasVersionedImagePushAfterGuard } from "../../../src/checks/ghcr-published/has-versioned-image-push-after-guard.mjs";

const guard = { run: releaseTagGuard };
const push = (tags) => ({
  uses: "docker/build-push-action@v6",
  with: { push: true, tags },
});

test("requires one package-version push after the release tag guard", () => {
  expect(hasVersionedImagePushAfterGuard({ steps: [guard, push("ghcr.io/example/app:v1.2.3")] }, "1.2.3"))
    .toBe(true);
  expect(hasVersionedImagePushAfterGuard({ steps: [push("ghcr.io/example/app:v1.2.3"), guard] }, "1.2.3"))
    .toBe(false);
});

test("rejects absent guards, multiple pushes, aliases, and mismatched versions", () => {
  const versionPush = push("ghcr.io/example/app:v1.2.3");
  expect(hasVersionedImagePushAfterGuard({ steps: [versionPush] }, "1.2.3")).toBe(false);
  expect(hasVersionedImagePushAfterGuard({ steps: [guard] }, "1.2.3")).toBe(false);
  expect(hasVersionedImagePushAfterGuard({ steps: [guard, versionPush, versionPush] }, "1.2.3")).toBe(false);
  expect(hasVersionedImagePushAfterGuard({
    steps: [guard, push("ghcr.io/example/app:v1.2.3\nghcr.io/example/app:latest")],
  }, "1.2.3")).toBe(false);
  expect(hasVersionedImagePushAfterGuard({ steps: [guard, push("ghcr.io/example/app:v1.2.4")] }, "1.2.3"))
    .toBe(false);
  expect(hasVersionedImagePushAfterGuard({ steps: [guard, null] }, "1.2.3")).toBe(false);
});
