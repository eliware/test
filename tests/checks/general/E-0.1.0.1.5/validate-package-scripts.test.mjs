import { expect, test } from "@jest/globals";
import { validatePackageScripts } from "../../../../src/checks/general/E-0.1.0.1.5/validate-package-scripts.mjs";

test("accepts canonical self-hosted scripts and nonempty extra scripts", () => {
  expect(
    validatePackageScripts({
      name: "@eliware/test",
      scripts: {
        test: "node bin/eliware-test.mjs",
        lint: "node bin/eliware-test.mjs --lint",
        audit: "node bin/eliware-test.mjs --audit",
        format: "node bin/eliware-test.mjs --format",
        "format:check": "node bin/eliware-test.mjs --format-check",
        smoke: "node smoke.mjs",
      },
    }),
  ).toEqual([]);
});

test("requires the shared consumer script commands", () => {
  expect(validatePackageScripts({ scripts: { test: "jest" } })).toHaveLength(5);
});

test("rejects invalid script maps, empty scripts, and publish commands", () => {
  expect(validatePackageScripts({ scripts: null })).toEqual([
    "package.json.scripts must be an object.",
  ]);
  expect(validatePackageScripts({ scripts: { test: "", other: "  " } })).toContain(
    "package.json.scripts.other must be a nonempty command.",
  );
  expect(validatePackageScripts({ scripts: { test: "", other: "npm publish" } })).toContain(
    "package.json.scripts.other must not publish packages or images.",
  );
  for (const command of [
    "pnpm publish",
    "yarn npm publish",
    "bun publish",
    "npm --workspace app publish",
    "docker build --push image",
  ])
    expect(validatePackageScripts({ scripts: { other: command } })).toContain(
      "package.json.scripts.other must not publish packages or images.",
    );
});
