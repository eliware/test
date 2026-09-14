import { expect, test } from "@jest/globals";
import { validateContractIndex } from "../../../../../../src/checks/general/E-1/E-1.25/A-1.25.0/validate-contract-index.mjs";

test("accepts an index containing contracts.json", () => {
  expect(validateContractIndex("- [contracts.json](contracts.json)")).toBeNull();
});

test("rejects an index without contracts.json", () => {
  expect(validateContractIndex("# specs")).toBe("specs/README.md must link specs/contracts.json.");
});

test("rejects an unlinked contracts filename", () => {
  expect(validateContractIndex("contracts.json is authoritative")).toBe("specs/README.md must link specs/contracts.json.");
});
