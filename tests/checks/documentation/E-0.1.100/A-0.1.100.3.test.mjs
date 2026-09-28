import { beforeEach, expect, jest, test } from "@jest/globals";

const jsonFiles = jest.fn();
const validateStructuredReferences = jest.fn();
const validateAuthoritySurfaces = jest.fn();
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
  "../../../../src/checks/documentation/E-0.1.100/validate-authority-documents.mjs",
  () => ({ validateAuthorityDocuments: validateAuthoritySurfaces }),
);
jest.unstable_mockModule(
  "../../../../src/checks/documentation/E-0.1.100/validate-documentation-links.mjs",
  () => ({ validateDocumentationLinks }),
);

const { run } = await import("../../../../src/checks/documentation/E-0.1.100/A-0.1.100.3.mjs");

beforeEach(() => {
  jest.resetAllMocks();
  jsonFiles.mockResolvedValue(["specs/authority.json"]);
  validateStructuredReferences.mockResolvedValue(null);
  validateAuthoritySurfaces.mockResolvedValue(null);
  validateDocumentationLinks.mockResolvedValue(null);
});

test("runs each documentation-reference phase in order", async () => {
  const order = [];
  jsonFiles.mockImplementation(async () => {
    order.push("discover");
    return ["specs/authority.json"];
  });
  validateStructuredReferences.mockImplementation(async () => {
    order.push("structured");
  });
  validateAuthoritySurfaces.mockImplementation(async () => {
    order.push("authority");
    return null;
  });
  validateDocumentationLinks.mockImplementation(async () => {
    order.push("links");
    return null;
  });
  await expect(run({ root: "/repo" })).resolves.toEqual({
    ruleId: "A-0.1.100.3",
    status: "pass",
    message: "",
  });
  expect(order).toEqual(["discover", "structured", "authority", "links"]);
});

test("reports authority and link findings while continuing independent phases", async () => {
  validateStructuredReferences.mockResolvedValueOnce("structured reference invalid");
  validateAuthoritySurfaces.mockResolvedValueOnce("authority record invalid");
  validateDocumentationLinks.mockResolvedValueOnce("documentation link invalid");
  await expect(run({ root: "/repo" })).resolves.toEqual({
    ruleId: "A-0.1.100.3",
    status: "fail",
    message: "structured reference invalid\nauthority record invalid\ndocumentation link invalid",
  });
  expect(validateDocumentationLinks).toHaveBeenCalled();

  validateAuthoritySurfaces.mockResolvedValueOnce(null);
  validateDocumentationLinks.mockResolvedValueOnce("documentation link invalid");
  await expect(run({ root: "/repo" })).resolves.toEqual({
    ruleId: "A-0.1.100.3",
    status: "fail",
    message: "documentation link invalid",
  });
});

test("normalizes errors from any reference-validation phase", async () => {
  jsonFiles.mockRejectedValueOnce(new Error("discovery failed"));
  await expect(run({ root: "/repo" })).resolves.toMatchObject({
    ruleId: "A-0.1.100.3",
    status: "fail",
    message: "Documentation reference discovery failed: discovery failed",
  });
  validateStructuredReferences.mockRejectedValueOnce(new Error("invalid path"));
  await expect(run({ root: "/repo" })).resolves.toMatchObject({
    status: "fail",
    message: "Structured reference validation failed: invalid path",
  });
  validateAuthoritySurfaces.mockRejectedValueOnce(new Error("invalid authority"));
  validateDocumentationLinks.mockRejectedValueOnce(new Error("invalid link"));
  await expect(run({ root: "/repo" })).resolves.toMatchObject({
    status: "fail",
    message:
      "Authority document validation failed: invalid authority\nDocumentation link validation failed: invalid link",
  });
});
