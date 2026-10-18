import { expect, test } from "@jest/globals";
import { validateCanonicalPublisherWorkflow } from "../../../../src/checks/shared/publish-workflow/validate-canonical-publisher-workflow.mjs";

const workflowPath = ".github/workflows/npm.yaml";
const canonicalPath = new URL("../../../../specs/workflows/npm.yaml", import.meta.url);

function inventory({ files = [workflowPath], text = "workflow\n" } = {}) {
  return { files: async () => files, readText: async () => text };
}

test("accepts exact canonical workflow bytes", async () => {
  await expect(
    validateCanonicalPublisherWorkflow(inventory(), "npm-published", () => "workflow\n"),
  ).resolves.toEqual([]);
});

test.each(["workflow\r\n", "workflow", "Workflow\n"])(
  "rejects a byte difference in the canonical workflow: %p",
  async (text) => {
    await expect(
      validateCanonicalPublisherWorkflow(inventory({ text }), "npm-published", () => "workflow\n"),
    ).resolves.toEqual([
      ".github/workflows/npm.yaml must match the bundled Eliware Test file specs/workflows/npm.yaml byte for byte.",
    ]);
  },
);

test("resolves each canonical file from the workflow ordering document", async () => {
  const read = (url) => {
    expect(url.href).toBe(canonicalPath.href);
    return "workflow\n";
  };
  await expect(
    validateCanonicalPublisherWorkflow(inventory(), "npm-published", read),
  ).resolves.toEqual([]);
  await expect(
    validateCanonicalPublisherWorkflow(
      inventory({ files: [".github/workflows/ghcr.yaml"] }),
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
