import { expect, jest, test } from "@jest/globals";

const readFile = jest.fn();
jest.unstable_mockModule("node:fs/promises", () => ({ readFile }));
const { validateMarkdownDocument } =
  await import("../../../../../../src/checks/general/E-0.1.0.1.4/validate/markdown/document.mjs");

test("validates links and assets in one document", async () => {
  const validateLocal = jest.fn(async () => null);
  await expect(
    validateMarkdownDocument(
      "/repo",
      "README.md",
      validateLocal,
      async () => "[page](page.md) ![image](image.png) <https://example.com>",
    ),
  ).resolves.toEqual([]);
  expect(validateLocal).toHaveBeenCalledTimes(2);
});

test("reports unresolved and invalid references", async () => {
  const errors = await validateMarkdownDocument(
    "/repo",
    "README.md",
    async (_file, reference) => `missing ${reference}`,
    async () => "[missing][shortcut] <http://github.com/owner/repo>",
  );
  expect(errors).toContain("Markdown reference link has no definition in README.md.");
  expect(errors).toContain(
    "Documentation link is invalid: http://github.com/owner/repo. in README.md.",
  );
});

test("returns local reference errors", async () => {
  await expect(
    validateMarkdownDocument(
      "/repo",
      "README.md",
      async (_file, reference) => `invalid ${reference}`,
      async () => "[missing](missing.md)",
    ),
  ).resolves.toEqual(["invalid missing.md"]);
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
