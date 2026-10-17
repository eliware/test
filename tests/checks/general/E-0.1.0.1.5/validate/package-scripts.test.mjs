import { expect, test } from "@jest/globals";
import { validatePackageScripts } from "../../../../../src/checks/general/E-0.1.0.1.5/validate/package-scripts.mjs";

test("accepts canonical self-hosted scripts and nonempty extra scripts", () => {
  expect(
    validatePackageScripts({
      name: "@eliware/test",
      repository: { url: "git+https://github.com/eliware/test.git" },
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

test("does not grant self-hosted scripts to a package that copies the package name", () => {
  expect(
    validatePackageScripts({ name: "@eliware/test", repository: { url: "other" }, scripts: {} }),
  ).toHaveLength(5);
});

test("requires the shared consumer script commands", () => {
  expect(validatePackageScripts({ scripts: { test: "jest" } })).toHaveLength(5);
});

test("allows inert GHCR image references in package scripts", () => {
  for (const command of [
    'echo "ghcr.io/eliware/example:latest"',
    'node scripts/validate-image.mjs "ghcr.io/eliware/example:latest"',
  ]) {
    const errors = validatePackageScripts({ scripts: { other: command } });
    expect(errors).not.toContain("package.json.scripts.other must not publish packages or images.");
  }
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
    "docker push ghcr.io/eliware/example:latest",
    "podman push ghcr.io/eliware/example:latest",
    "buildah build --push ghcr.io/eliware/example:latest",
    "oras push ghcr.io/eliware/example:latest",
    "crane push image.tar ghcr.io/eliware/example:latest",
    "skopeo copy containers-storage:image docker://ghcr.io/eliware/example:latest",
    "npx semantic-release",
    "npm exec -- release-it",
    "gh release create v1.0.0",
    "gh release upload v1.0.0 app.zip",
  ])
    expect(validatePackageScripts({ scripts: { other: command } })).toContain(
      "package.json.scripts.other must not publish packages or images.",
    );
});
