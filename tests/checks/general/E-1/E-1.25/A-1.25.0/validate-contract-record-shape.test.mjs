import { expect, test } from "@jest/globals";
import { validateContractRecordShape } from "../../../../../../src/checks/general/E-1/E-1.25/A-1.25.0/validate-contract-record-shape.mjs";

const sections = Object.fromEntries(
  ["purpose", "inputs", "outputs", "errors", "ordering", "invariants"].map((key) => [key, [key]]),
);
sections.boundaries = { owns: ["fixture"] };
const contract = (overrides = {}) => ({
  id: "C-1.1",
  title: "fixture",
  scope: "test",
  directiveIds: ["E-1.25"],
  dos: ["do"],
  donts: ["do not"],
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

test.each([
  ["title", "Contract C-1.1 must have nonempty title and scope."],
  ["scope", "Contract C-1.1 must have nonempty title and scope."],
  ["dos", "Contract C-1.1 dos must be a nonempty string array."],
  ["donts", "Contract C-1.1 donts must be a nonempty string array."],
])("rejects empty normative field: %s", (field, message) => {
  expect(validateContractRecordShape(contract({ [field]: field === "title" || field === "scope" ? "" : [] }), new Set())).toBe(message);
});

test("rejects empty behavior sections", () => {
  expect(validateContractRecordShape(contract({ contract: { ...sections, purpose: [] } }), new Set())).toContain("contract.purpose");
  expect(validateContractRecordShape(contract({ contract: { ...sections, boundaries: {} } }), new Set())).toContain("contract.boundaries");
  expect(validateContractRecordShape(contract({ contract: { ...sections, purpose: "" } }), new Set())).toContain("contract.purpose");
});

test("reports an unknown contract identity when the id is absent", () => {
  expect(validateContractRecordShape(contract({ id: undefined }), new Set())).toContain("unknown");
});
