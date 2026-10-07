import { expect, test } from "@jest/globals";
import packageMetadata from "../../../package.json" with { type: "json" };
import { createBundledCheckManifest } from "../../../src/validation/check-discovery/create-bundled-check-manifest.mjs";

const conventionVersion = packageMetadata.version.split(".").slice(0, 2).join(".");

test("records each implementation with its identity, path, and enforcement mode", () => {
  expect(
    createBundledCheckManifest([
      {
        ruleId: "E-0.1",
        parentRuleId: null,
        enforcementMode: "deterministic",
        modulePath: "general/E-0.1.mjs",
      },
    ]),
  ).toEqual({
    version: conventionVersion,
    checks: [
      {
        ruleId: "E-0.1",
        parentRuleId: null,
        enforcementMode: "deterministic",
        modulePath: "general/E-0.1.mjs",
      },
    ],
  });
});

test("rejects missing module paths and duplicate identities or paths", () => {
  expect(() => createBundledCheckManifest([{ ruleId: "E-0.1" }])).toThrow("module path");
  expect(() =>
    createBundledCheckManifest([
      { ruleId: "E-0.1", modulePath: "general/E-0.1.mjs" },
      { ruleId: "E-0.1", modulePath: "general/other.mjs" },
    ]),
  ).toThrow("ID");
  expect(() =>
    createBundledCheckManifest([
      { ruleId: "E-0.1", modulePath: "general/E-0.1.mjs" },
      { ruleId: "A-0.1", modulePath: "general/E-0.1.mjs" },
    ]),
  ).toThrow("path");
});

test("rejects non-deterministic checks that are not advisory-only", () => {
  expect(() =>
    createBundledCheckManifest([
      {
        ruleId: "E-0.1",
        enforcementMode: "non-deterministic",
        applicability: "required",
        modulePath: "general/E-0.1.mjs",
      },
    ]),
  ).toThrow("Non-deterministic checks must be advisory-only.");
});

test("accepts non-deterministic advisory checks and rejects invalid enforcement modes", () => {
  expect(() =>
    createBundledCheckManifest([
      {
        ruleId: "E-0.1",
        enforcementMode: "non-deterministic",
        applicability: "advisory-only",
        modulePath: "general/E-0.1.mjs",
      },
    ]),
  ).not.toThrow();
  expect(() =>
    createBundledCheckManifest([
      {
        ruleId: "E-0.1",
        enforcementMode: "unsupported",
        modulePath: "general/E-0.1.mjs",
      },
    ]),
  ).toThrow("Every bundled check must declare a valid enforcement mode.");
});
