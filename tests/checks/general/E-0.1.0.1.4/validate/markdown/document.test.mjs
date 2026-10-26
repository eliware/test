import { expect, jest, test } from "@jest/globals";

const readFile = jest.fn();
jest.unstable_mockModule("node:fs/promises", () => ({ readFile }));
const { validateMarkdownDocument } =
  await import("../../../../../../src/checks/general/E-0.1.0.1.4/validate/markdown/document.mjs");

test("reads the document and validates its references", async () => {
  const validateLocal = jest.fn(async () => null);
  await expect(
    validateMarkdownDocument("/repo", "README.md", validateLocal, async () => "No links."),
  ).resolves.toEqual([]);
  expect(validateLocal).not.toHaveBeenCalled();
});

test("reports a document read failure", async () => {
  await expect(
    validateMarkdownDocument(
      "/repo",
      "README.md",
      async () => null,
      async () => {
        throw new Error("denied");
      },
    ),
  ).resolves.toEqual(["README.md could not be read: denied"]);
});

test("uses the mocked file reader by default", async () => {
  readFile.mockResolvedValueOnce("No links.");
  await expect(validateMarkdownDocument("/repo", "README.md", async () => null)).resolves.toEqual(
    [],
  );
  expect(readFile.mock.calls[0][0].replaceAll("\\", "/")).toBe("/repo/README.md");
  expect(readFile.mock.calls[0][1]).toBe("utf8");
});
