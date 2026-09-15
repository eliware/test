import { expect, test } from "@jest/globals";
import { createBundledCheckManifest } from "../../src/orchestrators/create-bundled-check-manifest.mjs";

test("records each implementation with its identity, path, and enforcement mode", () => {
  expect(createBundledCheckManifest([{
    ruleId: "E-1",
    parentRuleId: null,
    enforcementMode: "deterministic",
    modulePath: "general/E-1.mjs",
  }])).toEqual({
    version: "8.0",
    checks: [{ ruleId: "E-1", parentRuleId: null, enforcementMode: "deterministic", modulePath: "general/E-1.mjs" }],
  });
});

test("rejects missing module paths and duplicate identities or paths", () => {
  expect(() => createBundledCheckManifest([{ ruleId: "E-1" }])).toThrow("module path");
  expect(() => createBundledCheckManifest([
    { ruleId: "E-1", modulePath: "general/E-1.mjs" },
    { ruleId: "E-1", modulePath: "general/other.mjs" },
  ])).toThrow("ID");
  expect(() => createBundledCheckManifest([
    { ruleId: "E-1", modulePath: "general/E-1.mjs" },
    { ruleId: "A-1", modulePath: "general/E-1.mjs" },
  ])).toThrow("path");
});
