import { expect, test } from "@jest/globals";
import { validateCanonicalPublisherWorkflow } from "../../../../../src/checks/shared/publish-workflow/validate/canonical-publisher-workflow.mjs";

const workflowPath = ".github/workflows/npm.yaml";
const canonicalPath = new URL("../../../../../specs/workflows/npm.yaml", import.meta.url);
const npmWorkflow = `jobs:\n  validate:\n    permissions:\n      contents: read\n  publish:\n    permissions:\n      contents: read\n      id-token: write\n`;

function inventory({ files = [workflowPath], text = npmWorkflow } = {}) {
  return { files: async () => files, readText: async () => text };
}

test("accepts exact canonical workflow bytes", async () => {
  await expect(
    validateCanonicalPublisherWorkflow(inventory(), "npm-published", () => npmWorkflow),
  ).resolves.toEqual([]);
});

test("validates OIDC permission in the bundled npm workflow", async () => {
  const withoutPublisherPermission = npmWorkflow.replace("      id-token: write\n", "");
  await expect(
    validateCanonicalPublisherWorkflow(
      inventory(),
      "npm-published",
      () => withoutPublisherPermission,
    ),
  ).resolves.toEqual(["specs/workflows/npm.yaml publish job must grant id-token: write."]);
});

test.each([`${npmWorkflow}\r`, npmWorkflow.trimEnd(), `${npmWorkflow} `])(
  "rejects a byte difference in the canonical workflow: %p",
  async (text) => {
    await expect(
      validateCanonicalPublisherWorkflow(inventory({ text }), "npm-published", () => npmWorkflow),
    ).resolves.toEqual([
      ".github/workflows/npm.yaml must match the bundled Eliware Test file specs/workflows/npm.yaml byte for byte.",
    ]);
  },
);

test("resolves each canonical file from the workflow ordering document", async () => {
  const read = (url) => {
    expect(url.href).toBe(canonicalPath.href);
    return npmWorkflow;
  };
  await expect(
    validateCanonicalPublisherWorkflow(inventory(), "npm-published", read),
  ).resolves.toEqual([]);
  await expect(
    validateCanonicalPublisherWorkflow(
      inventory({ files: [".github/workflows/ghcr.yaml"], text: "workflow\n" }),
      "ghcr-published",
      (url) => {
        expect(url.pathname).toMatch(/specs\/workflows\/ghcr\.yaml$/u);
        return "workflow\n";
      },
    ),
  ).resolves.toEqual([]);
});

test("reports missing files, unavailable inventories, and read errors", async () => {
  await expect(
    validateCanonicalPublisherWorkflow(inventory({ files: [] }), "npm-published", () => ""),
  ).resolves.toEqual([".github/workflows/npm.yaml is required."]);
  await expect(validateCanonicalPublisherWorkflow({}, "npm-published")).resolves.toEqual([
    ".github/workflows/npm.yaml could not be inspected.",
  ]);
  await expect(
    validateCanonicalPublisherWorkflow(
      { files: async () => [workflowPath], readText: async () => "" },
      "npm-published",
      () => {
        throw new Error("denied");
      },
    ),
  ).resolves.toEqual([".github/workflows/npm.yaml could not be inspected: denied"]);
  await expect(validateCanonicalPublisherWorkflow(inventory(), "unknown")).resolves.toEqual([
    "Unsupported publisher profile: unknown.",
  ]);
});
