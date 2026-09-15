import { expect, test } from "@jest/globals";
import { validateContractDocumentShape } from "../../../../../../src/checks/general/E-1/E-1.25/A-1.25.0/validate-contract-document-shape.mjs";

const envelope = {
  schemaVersion: "1.0",
  contractVersion: "8.0",
  kind: "contract-reference",
  description: "fixture",
  authority: {},
  format: {},
  contracts: [],
};

test("rejects an invalid envelope and an empty contract list", () => {
  expect(validateContractDocumentShape({ kind: "wrong" })).toContain("top-level format");
  expect(validateContractDocumentShape(envelope)).toContain("at least one contract");
});

test("accepts a complete envelope", () => {
  expect(validateContractDocumentShape({ ...envelope, contracts: [{}] })).toBeNull();
});

test("requires the published schema and contract versions", () => {
  expect(validateContractDocumentShape({ ...envelope, schemaVersion: "2.0", contracts: [{}] })).toContain("schemaVersion 1.0");
  expect(validateContractDocumentShape({ ...envelope, contractVersion: "7.0", contracts: [{}] })).toContain("contractVersion 8.0");
  expect(validateContractDocumentShape({ ...envelope, description: "", contracts: [{}] })).toContain("nonempty description");
});
