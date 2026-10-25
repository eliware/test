import { expect, test } from "@jest/globals";
import { resolveSmokeTargetPaths } from "../../../../../src/validation/stages/smoke/resolve-smoke-target/paths.mjs";

test("resolves separate source and target roots", async () => {
  await expect(
    resolveSmokeTargetPaths("source-link", "target-link", async (path) => `/${path}`),
  ).resolves.toEqual({ targetRoot: "/target-link" });
});

test.each([
  ["/source", "/source", "matching"],
  ["/source", "/source/nested", "source contains target"],
  ["/source/nested", "/source", "target contains source"],
])("rejects %s and %s because their paths are %s", async (root, target, _reason) => {
  await expect(resolveSmokeTargetPaths(root, target, async (path) => path)).resolves.toEqual({
    error: "Smoke target must resolve outside the source checkout.",
  });
});

test("allows sibling paths with a shared name prefix", async () => {
  await expect(
    resolveSmokeTargetPaths("/source", "/source-copy", async (path) => path),
  ).resolves.toEqual({ targetRoot: "/source-copy" });
});

test("allows roots on separate drives", async () => {
  await expect(
    resolveSmokeTargetPaths("C:/source", "D:/consumer", async (path) => path),
  ).resolves.toEqual({ targetRoot: "D:/consumer" });
});

test("reports path resolution failures", async () => {
  await expect(
    resolveSmokeTargetPaths("source", "target", async () => {
      throw new Error("missing");
    }),
  ).resolves.toEqual({
    error: "Smoke source and target must both resolve to existing directories.",
  });
});
