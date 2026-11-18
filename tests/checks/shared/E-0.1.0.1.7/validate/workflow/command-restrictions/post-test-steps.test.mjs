import { expect, test } from "@jest/globals";
import validatePostTestSteps from "../../../../../../../src/checks/shared/E-0.1.0.1.7/validate/workflow/command-restrictions/post-test-steps.mjs";

test("checks commands after npm test", () => {
  const errors = validatePostTestSteps(
    [
      { run: "npm test" },
      { run: "npm run lint" },
      { run: "npm run missing" },
      { run: "echo summary" },
      { run: "npm run report" },
      { uses: "actions/upload-artifact@v7" },
    ],
    0,
    { scripts: { report: "node report.mjs" } },
  );
  expect(errors).toContain("ci.yaml must not repeat an aggregate validation stage after npm test.");
  expect(errors).toContain(
    "ci.yaml validation step after npm test must name a script declared in package.json.scripts.",
  );
  expect(errors).toContain(
    "ci.yaml validation step after npm test must call a declared package script with npm run <name>.",
  );
  expect(validatePostTestSteps([], -1, {})).toEqual([]);
});
