import { expect, test } from "@jest/globals";
import { validateContractRecordShape } from "../../../../../../src/checks/general/E-1/E-1.25/A-1.25.0/validate-contract-record-shape.mjs";

const sections = Object.fromEntries(
  ["purpose", "inputs", "outputs", "errors", "ordering", "invariants"].map((key) => [key, []]),
);
sections.boundaries = {};
const contract = (overrides = {}) => ({
  id: "C-1.1",
  title: "fixture",
  scope: "test",
  directiveIds: ["E-1.25"],
  dos: [],
  donts: [],
  contract: sections,
  implementation: { source: ["src"] },
  verification: { tests: ["tests"] },
  ...overrides,
});

test("validates identity, directives, sections, and evidence", () => {
  const ids = new Set();
  expect(validateContractRecordShape(contract(), ids)).toBeNull();
  expect(validateContractRecordShape(contract(), ids)).toContain("duplicated");
  expect(validateContractRecordShape(contract({ id: "bad" }), new Set())).toContain("invalid");
  expect(validateContractRecordShape(contract({ directiveIds: ["invalid"] }), new Set())).toContain("directive references");
  expect(validateContractRecordShape({}, new Set())).toContain("required fields");
  expect(validateContractRecordShape(contract({ contract: { purpose: [] } }), new Set())).toContain("behavior section");
});
