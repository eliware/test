import { expect, test } from "@jest/globals";
import { validatePrivatePackageScripts } from "../../../../src/checks/private/E-0.1.12.1.0/validate-private-package-scripts.mjs";

test.each(["npm publish", "pnpm publish --access public", "yarn npm publish"])(
  "rejects npm publication command %s",
  (command) => {
    expect(validatePrivatePackageScripts({ scripts: { release: command } })).toEqual([
      "package.json.scripts.release must not run an npm publication command.",
    ]);
  },
);

test.each(["NPM_TOKEN=value node publish.mjs", "export NODE_AUTH_TOKEN=value", "echo $NPM_TOKEN"])(
  "rejects npm token setting %s",
  (command) => {
    expect(validatePrivatePackageScripts({ scripts: { release: command } })).toEqual([
      "package.json.scripts.release must not set or reference npm publication tokens.",
    ]);
  },
);

test("allows ordinary scripts and GHCR publication commands", () => {
  expect(
    validatePrivatePackageScripts({
      scripts: { test: "npm test", image: "docker push ghcr.io/x" },
    }),
  ).toEqual([]);
});

test("ignores invalid script containers and non-string entries", () => {
  expect(validatePrivatePackageScripts({ scripts: [] })).toEqual([]);
  expect(validatePrivatePackageScripts({ scripts: { release: null } })).toEqual([]);
});
