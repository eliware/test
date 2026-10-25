import { expect, test } from "@jest/globals";
import { resolveSmokeTargetPaths } from "../../../../../src/validation/stages/smoke/resolve-smoke-target/paths.mjs";

test("resolves separate source and target roots", async () => {
  await expect(
    resolveSmokeTargetPaths("source-link", "target-link", async (path) => `/${path}`),
  ).resolves.toEqual({ targetRoot: "/target-link" });
});

test("rejects a target nested inside the source checkout", async () => {
  await expect(
    resolveSmokeTargetPaths("/source", "/source/nested", async (path) => path),
  ).resolves.toEqual({ error: "Smoke target must resolve outside the source checkout." });
});

test("rejects a source nested inside the target checkout", async () => {
  await expect(
    resolveSmokeTargetPaths("/source/nested", "/source", async (path) => path),
  ).resolves.toEqual({ error: "Smoke target must resolve outside the source checkout." });
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
