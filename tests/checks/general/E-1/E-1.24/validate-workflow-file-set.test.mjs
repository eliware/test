import { expect, test } from "@jest/globals";
import { validateWorkflowFileSet } from "../../../../../src/checks/general/E-1/E-1.24/validate-workflow-file-set.mjs";

test("requires only ci.yml without publication profiles", () => {
  expect(validateWorkflowFileSet(["ci.yml"], { eliware: { apply: ["general"] } })).toBeNull();
  expect(validateWorkflowFileSet(["ci.yml", "extra.yml"])).toContain("must be exactly .github/workflows/ci.yml");
  expect(validateWorkflowFileSet(["nodejs.yml"])).toContain("found .github/workflows/nodejs.yml");
  expect(validateWorkflowFileSet([])).toContain("found none");
});

test.each(["npm-published", "ghcr-published"])(
  "requires exactly ci.yml and publish.yml for %s",
  (profile) => {
    const packageJson = { eliware: { apply: ["general", profile] } };
    expect(validateWorkflowFileSet(["ci.yml", "publish.yml"], packageJson)).toBeNull();
    expect(validateWorkflowFileSet(["ci.yml"], packageJson)).toContain("publish.yml");
    expect(validateWorkflowFileSet(["ci.yml", "publish.yml", "extra.yaml"], packageJson)).toContain("extra.yaml");
    expect(validateWorkflowFileSet(["ci.yml", "publish.yaml"], packageJson)).toContain("publish.yml");
  },
);

test("shares one publish.yml when npm and GHCR profiles both apply", () => {
  expect(
    validateWorkflowFileSet(["publish.yml", "ci.yml"], {
      eliware: { apply: ["npm-published", "ghcr-published"] },
    }),
  ).toBeNull();
});
