import { expect, test } from "@jest/globals";
import { validateWorkflowFileSet } from "../../../../../src/checks/general/E-0.1/E-0.1.24/validate-workflow-file-set.mjs";

test("requires only ci.yaml without publication profiles", () => {
  expect(validateWorkflowFileSet(["ci.yaml"], { eliware: { apply: ["general"] } })).toBeNull();
  expect(validateWorkflowFileSet(["ci.yaml", "extra.yml"])).toContain(
    "must be exactly .github/workflows/ci.yaml",
  );
  expect(validateWorkflowFileSet(["nodejs.yml"])).toContain("found .github/workflows/nodejs.yml");
  expect(validateWorkflowFileSet(["ci.yml"])).toContain("ci.yaml");
  expect(validateWorkflowFileSet(["ci.yaml", "ci.yml"])).toContain("ci.yml");
  expect(validateWorkflowFileSet([])).toContain("found none");
});

test.each(["npm-published", "ghcr-published"])(
  "requires exactly ci.yaml and publish.yaml for %s",
  (profile) => {
    const packageJson = { eliware: { apply: ["general", profile] } };
    expect(validateWorkflowFileSet(["ci.yaml", "publish.yaml"], packageJson)).toBeNull();
    expect(validateWorkflowFileSet(["ci.yaml"], packageJson)).toContain("publish.yaml");
    expect(
      validateWorkflowFileSet(["ci.yaml", "publish.yaml", "extra.yaml"], packageJson),
    ).toContain("extra.yaml");
  },
);

test("shares one publish.yaml when npm and GHCR profiles both apply", () => {
  expect(
    validateWorkflowFileSet(["publish.yaml", "ci.yaml"], {
      eliware: { apply: ["npm-published", "ghcr-published"] },
    }),
  ).toBeNull();
});
