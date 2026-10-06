import { expect, test } from "@jest/globals";
import { validateApplicationDocumentation } from "../../../../src/checks/application/E-0.1.4.1.0/validate-application-documentation.mjs";

test("combines documentation and example index errors", async () => {
  const context = {
    repositoryInventory: {
      documentationFiles: async ({ directory, predicate }) => {
        if (directory.endsWith("docs")) throw new Error("missing docs");
        return ["demo.js"].filter(predicate);
      },
      files: async () => ["examples/demo.js"],
      readText: async () => "[Other](other.js)",
    },
  };
  await expect(validateApplicationDocumentation(context)).resolves.toEqual([
    "docs/README.md and its Markdown index are required.",
    "examples/README.md must link demo.js.",
    "examples/README.md links to unexpected target other.js.",
  ]);
});

test("reports errors from the default context", async () => {
  await expect(validateApplicationDocumentation()).resolves.toEqual([
    "docs/README.md and its Markdown index are required.",
    "examples/ could not be inspected for JavaScript examples.",
  ]);
});
