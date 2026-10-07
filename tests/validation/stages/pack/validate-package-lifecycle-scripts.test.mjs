import { expect, test } from "@jest/globals";
import { validatePackageLifecycleScripts } from "../../../../src/validation/stages/pack/validate-package-lifecycle-scripts.mjs";

test("allows packages without packaging lifecycle hooks", () => {
  expect(validatePackageLifecycleScripts({ scripts: { test: "eliware-test" } })).toBeNull();
  expect(validatePackageLifecycleScripts({})).toBeNull();
});

test.each(["prepublish", "prepare", "prepack", "postpack", "prepublishOnly"])(
  "rejects the %s packaging lifecycle hook",
  (hook) => {
    expect(validatePackageLifecycleScripts({ scripts: { [hook]: "node build.mjs" } })).toContain(
      hook,
    );
  },
);
