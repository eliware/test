import { expect, jest, test } from "@jest/globals";
import { validateMarkdownReferences } from "../../../../../../src/checks/general/E-0.1.0.1.4/validate/markdown/references.mjs";

test("validates local links, assets, and external links", async () => {
  const validateLocal = jest.fn(async () => null);
  await expect(
    validateMarkdownReferences(
      "README.md",
      "[page](page.md) ![image](image.png) <https://example.com>",
      validateLocal,
    ),
  ).resolves.toEqual([]);
  expect(validateLocal).toHaveBeenCalledTimes(2);
});

test("reports unresolved and invalid references", async () => {
  const errors = await validateMarkdownReferences(
    "README.md",
    "[missing][shortcut] <http://github.com/owner/repo>",
    async (_file, reference) => `missing ${reference}`,
  );
  expect(errors).toContain("Markdown reference link has no definition in README.md.");
  expect(errors).toContain(
    "Documentation link is invalid: http://github.com/owner/repo. in README.md.",
  );
});

test("returns local reference errors", async () => {
  await expect(
    validateMarkdownReferences(
      "README.md",
      "[missing](missing.md)",
      async (_file, reference) => `invalid ${reference}`,
    ),
  ).resolves.toEqual(["invalid missing.md"]);
});
