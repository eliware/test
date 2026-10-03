import { expect, test } from "@jest/globals";
import { validateKnitWorkflowFileSet } from "../../../../../src/checks/general/E-0.1/E-0.1.10/validate-knit-workflow-file-set.mjs";

test("requires only the canonical deploy.yaml workflow", () => {
  expect(validateKnitWorkflowFileSet([".knit/deploy.yaml"])).toBeNull();
  expect(validateKnitWorkflowFileSet([])).toContain("found none");
  expect(validateKnitWorkflowFileSet([".knit/deploy.yml"])).toContain("deploy.yaml");
  expect(validateKnitWorkflowFileSet([".knit/deploy.yaml", ".knit/extra.yaml"])).toContain(
    ".knit/extra.yaml",
  );
  expect(validateKnitWorkflowFileSet([".knit/deploy.yaml", ".knit/deploy.yaml"])).toContain(
    "found .knit/deploy.yaml, .knit/deploy.yaml",
  );
});
