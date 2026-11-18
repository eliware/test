import { expect, test } from "@jest/globals";
import validatePackageScriptPolicy from "../../../../../../src/checks/general/E-0.1.0.1.5/validate/package/script-policy.mjs";

test("combines script and local validator file policies", () => {
  expect(validatePackageScriptPolicy({})).toContain("package.json.scripts must be an object.");
  expect(
    validatePackageScriptPolicy({
      scripts: {
        test: "eliware-test",
        lint: "eliware-test --lint",
        audit: "eliware-test --audit",
        format: "eliware-test --format",
        "format:check": "eliware-test --format-check",
        validate: "node validators/check.mjs",
      },
    }),
  ).toContain("package.json.scripts.validate must keep local validator files under scripts/.");
});
