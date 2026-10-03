import { expect, test } from "@jest/globals";
import { resolve } from "node:path";
import { packageJson } from "../../../../test-fixtures/npm-consumers/smoke-test-support.mjs";
import { validateNpmConsumerSmokeRequest } from "../../../../src/checks/npm-published/E-0.1.140/validate-npm-consumer-smoke-request.mjs";

const root = process.cwd();
const target = resolve(root, "..", "smoke-consumer");
const request = (overrides = {}) =>
  validateNpmConsumerSmokeRequest({
    root,
    target,
    packageJson,
    ...overrides,
  });

test("resolves a valid consumer path after validating package metadata", () => {
  expect(request()).toEqual({ targetRoot: target });
});

test("rejects missing targets and source checkout targets", () => {
  expect(request({ target: " " })).toEqual({
    error: "Supply one existing consumer with --target <path>.",
  });
  expect(request({ target: root })).toEqual({
    error: "Smoke target must be a separate consumer repository.",
  });
});

test("rejects invalid package publication metadata before smoke setup", () => {
  expect(request({ packageJson: { ...packageJson, publishConfig: {} } })).toEqual({
    error: "Public npm packages must enable npm provenance.",
  });
  expect(
    request({
      packageJson: {
        ...packageJson,
        name: undefined,
        files: packageJson.files.filter((path) => path !== "specs/"),
        eliware: { apply: ["application", "cli", "npm-published"] },
        scripts: { pack: "eliware-test --pack" },
      },
    }),
  ).toEqual({
    error: "Source package name and version are required for tarball smoke.",
  });
});
