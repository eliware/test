import { beforeEach, expect, jest, test } from "@jest/globals";

const jsonFiles = jest.fn();
const validateStructuredReferences = jest.fn();
const validateAuthoritySurfaces = jest.fn();
const validateDocumentationLinks = jest.fn();
jest.unstable_mockModule("../../../../src/checks/documentation/E-1.100/documentation-surface.mjs", () => ({ jsonFiles }));
jest.unstable_mockModule("../../../../src/checks/documentation/E-1.100/validate-structured-references.mjs", () => ({ validateStructuredReferences }));
jest.unstable_mockModule("../../../../src/checks/documentation/E-1.100/validate-authority-surfaces.mjs", () => ({ validateAuthoritySurfaces }));
jest.unstable_mockModule("../../../../src/checks/documentation/E-1.100/validate-documentation-links.mjs", () => ({ validateDocumentationLinks }));

const { run } = await import("../../../../src/checks/documentation/E-1.100/A-1.100.3.mjs");

beforeEach(() => {
  jest.resetAllMocks();
  jsonFiles.mockResolvedValue(["specs/authority.json"]);
  validateStructuredReferences.mockResolvedValue(null);
  validateAuthoritySurfaces.mockResolvedValue(null);
  validateDocumentationLinks.mockResolvedValue(null);
});

test("runs each documentation-reference phase in order", async () => {
  const order = [];
  jsonFiles.mockImplementation(async () => { order.push("discover"); return ["specs/authority.json"]; });
  validateStructuredReferences.mockImplementation(async () => { order.push("structured"); });
  validateAuthoritySurfaces.mockImplementation(async () => { order.push("authority"); return null; });
  validateDocumentationLinks.mockImplementation(async () => { order.push("links"); return null; });
  await expect(run({ root: "/repo" })).resolves.toEqual({ ruleId: "A-1.100.3", status: "pass", message: "" });
  expect(order).toEqual(["discover", "structured", "authority", "links"]);
});

test("returns authority and link findings without running later phases", async () => {
  validateAuthoritySurfaces.mockResolvedValueOnce("authority record invalid");
  await expect(run({ root: "/repo" })).resolves.toEqual({
    ruleId: "A-1.100.3", status: "fail", message: "authority record invalid",
  });
  expect(validateDocumentationLinks).not.toHaveBeenCalled();

  validateAuthoritySurfaces.mockResolvedValueOnce(null);
  validateDocumentationLinks.mockResolvedValueOnce("documentation link invalid");
  await expect(run({ root: "/repo" })).resolves.toEqual({
    ruleId: "A-1.100.3", status: "fail", message: "documentation link invalid",
  });
});

test("normalizes errors from any reference-validation phase", async () => {
  jsonFiles.mockRejectedValueOnce(new Error("discovery failed"));
  await expect(run({ root: "/repo" })).resolves.toMatchObject({
    ruleId: "A-1.100.3",
    status: "fail",
    message: "Documentation reference validation failed: discovery failed",
  });
  validateStructuredReferences.mockRejectedValueOnce(new Error("invalid path"));
  await expect(run({ root: "/repo" })).resolves.toMatchObject({
    status: "fail",
    message: "Documentation reference validation failed: invalid path",
  });
});
