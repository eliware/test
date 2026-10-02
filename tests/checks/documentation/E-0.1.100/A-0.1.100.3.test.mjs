import { beforeEach, expect, jest, test } from "@jest/globals";

const jsonFiles = jest.fn();
const validateStructuredReferences = jest.fn();
const validateDocumentationLinks = jest.fn();
jest.unstable_mockModule(
  "../../../../src/checks/documentation/E-0.1.100/collect-documentation-files.mjs",
  () => ({ jsonFiles }),
);
jest.unstable_mockModule(
  "../../../../src/checks/documentation/E-0.1.100/validate-structured-references.mjs",
  () => ({ validateStructuredReferences }),
);
jest.unstable_mockModule(
  "../../../../src/checks/documentation/E-0.1.100/validate-documentation-links.mjs",
  () => ({ validateDocumentationLinks }),
);

const { run } = await import("../../../../src/checks/documentation/E-0.1.100/A-0.1.100.3.mjs");

beforeEach(() => {
  jest.resetAllMocks();
  jsonFiles.mockResolvedValue(["specs/directives.yaml"]);
  validateStructuredReferences.mockResolvedValue(null);
  validateDocumentationLinks.mockResolvedValue(null);
});

test("validates embedded structured references and documentation links", async () => {
  const order = [];
  validateStructuredReferences.mockImplementation(async () => {
    order.push("structured");
    return null;
  });
  validateDocumentationLinks.mockImplementation(async () => {
    order.push("links");
    return null;
  });
  await expect(run({ root: "/repo" })).resolves.toMatchObject({ status: "pass" });
  expect(order).toEqual(["structured", "links"]);
});

test("reports independent reference and link findings", async () => {
  validateStructuredReferences.mockResolvedValue("structured reference invalid");
  validateDocumentationLinks.mockResolvedValue("documentation link invalid");
  await expect(run({ root: "/repo" })).resolves.toMatchObject({
    status: "fail",
    message: "structured reference invalid\ndocumentation link invalid",
  });
});

test("normalizes errors from discovery and validation", async () => {
  jsonFiles.mockRejectedValueOnce(new Error("discovery failed"));
  await expect(run({ root: "/repo" })).resolves.toMatchObject({
    status: "fail",
    message: "Documentation reference discovery failed: discovery failed",
  });
  validateStructuredReferences.mockRejectedValueOnce(new Error("invalid path"));
  await expect(run({ root: "/repo" })).resolves.toMatchObject({
    status: "fail",
    message: "Structured reference validation failed: invalid path",
  });
  validateDocumentationLinks.mockRejectedValueOnce(new Error("invalid link"));
  await expect(run({ root: "/repo" })).resolves.toMatchObject({
    status: "fail",
    message: "Documentation link validation failed: invalid link",
  });
});
