import { expect, test } from "@jest/globals";
import { validateLibraryExamplesLink } from "../../../../src/checks/library/E-0.1.3.1.0/validate-library-examples-link.mjs";

test("requires a root README link to the examples index", async () => {
  const context = {
    root: "/repo",
    repositoryInventory: {
      readText: async () => "## Links\n\n- [Examples](./examples/README.md)",
    },
  };
  await expect(validateLibraryExamplesLink(context)).resolves.toEqual([]);
  await expect(
    validateLibraryExamplesLink({
      ...context,
      repositoryInventory: { readText: async () => "## Examples" },
    }),
  ).resolves.toEqual(["README.md must link examples/README.md."]);
});

test("reports unreadable README files", async () => {
  await expect(
    validateLibraryExamplesLink({
      repositoryInventory: {
        readText: async () => {
          throw new Error("unreadable");
        },
      },
    }),
  ).resolves.toEqual(["README.md must link examples/README.md."]);
});

test("uses the default context and root", async () => {
  await expect(validateLibraryExamplesLink()).resolves.toContain(
    "README.md must link examples/README.md.",
  );
});
