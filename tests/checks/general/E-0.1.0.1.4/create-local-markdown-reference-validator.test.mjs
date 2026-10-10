import { expect, test } from "@jest/globals";
import { resolve } from "node:path";
import { createLocalMarkdownReferenceValidator } from "../../../../src/checks/general/E-0.1.0.1.4/create-local-markdown-reference-validator.mjs";

const root = resolve("repo");
const info = { isFile: () => true, isDirectory: () => false };

function validator(overrides = {}) {
  return createLocalMarkdownReferenceValidator(root, {
    realpath: async (path) => path,
    stat: async () => info,
    read: async () => "# Target\n",
    ...overrides,
  });
}

test("accepts local files and directories", async () => {
  const validate = validator({
    stat: async () => ({ isFile: () => false, isDirectory: () => true }),
  });
  await expect(validate("docs/index.md", "folder")).resolves.toBeNull();
});

test("rejects local paths that escape the repository", async () => {
  await expect(validator()("docs/index.md", "../../../outside.md")).resolves.toContain(
    "escapes the repository",
  );
});

test("rejects targets that resolve through a symlink outside the repository", async () => {
  const validate = validator({
    realpath: async (path) => (path === root ? root : resolve(root, "../outside.md")),
  });
  await expect(validate("docs/index.md", "target.md")).resolves.toContain("escapes the repository");
});

test("checks Markdown fragments and ignores query strings", async () => {
  await expect(validator()("docs/index.md", "target.md?view=full#target")).resolves.toBeNull();
  await expect(
    validator({ read: async () => "# Other\n" })("docs/index.md", "target.md#missing"),
  ).resolves.toContain("fragment does not resolve");
});

test("requires non-Markdown targets to be files or directories", async () => {
  await expect(
    validator({ stat: async () => ({ isFile: () => false, isDirectory: () => false }) })(
      "docs/index.md",
      "target.txt#part",
    ),
  ).resolves.toContain("link does not resolve");
});

test("reports unresolved paths and root inspection failures", async () => {
  await expect(
    validator({ stat: async () => Promise.reject(new Error("missing")) })("docs/a.md", "b.md"),
  ).resolves.toContain("link does not resolve");
  await expect(
    validator({ realpath: async () => Promise.reject(new Error("blocked")) })("docs/a.md", "b.md"),
  ).resolves.toContain("link does not resolve");
});

test("uses the default filesystem operations", async () => {
  const validate = createLocalMarkdownReferenceValidator(process.cwd());
  await expect(validate("README.md", "README.md")).resolves.toBeNull();
});
