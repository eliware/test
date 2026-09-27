import { expect, test } from "@jest/globals";
import { resolve } from "node:path";
import { resolveWebAssetSettings } from "../../../../src/checks/web/E-0.1.50/resolve-web-asset-settings.mjs";

test("resolves default and configured roots with built-in exclusions", () => {
  expect(resolveWebAssetSettings("/repo", {})).toMatchObject({
    assetRoot: "public", resolvedAssets: resolve("/repo/public"), exclusions: ["dist", "build", "coverage", "node_modules", ".git"],
  });
  expect(resolveWebAssetSettings("/repo", {
    eliware: { webRoot: " assets ", webAssetExcludes: ["tmp"] },
  })).toMatchObject({ assetRoot: "assets", exclusions: expect.arrayContaining(["tmp", "dist"]) });
});

test("rejects invalid exclusions and roots outside the repository", () => {
  expect(resolveWebAssetSettings("/repo", { eliware: { webAssetExcludes: "dist" } }).error)
    .toContain("string array");
  expect(resolveWebAssetSettings("/repo", { eliware: { webAssetExcludes: [""] } }).error)
    .toContain("string array");
  expect(resolveWebAssetSettings("/repo", { eliware: { webRoot: "." } }).error).toContain("non-root");
  expect(resolveWebAssetSettings("/repo", { eliware: { webRoot: "/outside" } }).error)
    .toContain("inside the repository");
  expect(resolveWebAssetSettings("/repo", { eliware: { webRoot: "../outside" } }).error)
    .toContain("inside the repository");
});
