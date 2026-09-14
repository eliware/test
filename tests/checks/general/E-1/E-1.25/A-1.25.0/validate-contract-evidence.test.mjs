import { expect, test } from "@jest/globals";
import { validateContractEvidence } from "../../../../../../src/checks/general/E-1/E-1.25/A-1.25.0/validate-contract-evidence.mjs";

const contract = (overrides = {}) => ({
  id: "C-1.1",
  implementation: { source: ["src"] },
  verification: { tests: ["tests"] },
  ...overrides,
});

test("rejects malformed and incomplete evidence", () => {
  expect(validateContractEvidence(contract({ implementation: null }))).toContain("implementation evidence");
  expect(validateContractEvidence(contract({ implementation: { source: [] } }))).toContain("nonempty string array");
  expect(validateContractEvidence(contract({ implementation: { source: "src/index.mjs" } }))).toContain("nonempty string array");
  expect(validateContractEvidence(contract({ implementation: {} }))).toContain("implementation source");
});
