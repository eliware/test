import { expect, jest, test } from "@jest/globals";
import { mkdir, mkdtemp, readFile, rm, stat, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { validateMarkdownLinks } from "../../../../src/checks/documentation/E-0.1.100/validate-markdown-links.mjs";
import { createRepositoryInventory } from "../../../../src/checks/create-repository-inventory.mjs";

test("coordinates local, fragment, non-Markdown, and external link validation", async () => {
  const root = await mkdtemp(join(tmpdir(), "eliware-markdown-links-"));
  try {
    await mkdir(join(root, "docs"));
    await writeFile(join(root, "docs", "index.md"), "# Heading");
    await writeFile(join(root, "terms.txt"), "Terms");
    await writeFile(
      join(root, "README.md"),
      "[Docs](docs/index.md#heading) [Folder](docs/) [Terms](terms.txt) [Web](https://example.test) [Other repository](https://github.com/other/project/blob/main/README.md#section)",
    );
    await expect(validateMarkdownLinks(root, ["README.md", "docs/index.md"])).resolves.toBeNull();
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

test("resolves links with query strings and fragments as separate URL components", async () => {
  const root = await mkdtemp(join(tmpdir(), "eliware-markdown-query-links-"));
  try {
    await mkdir(join(root, "docs"));
    await writeFile(join(root, "docs", "guide.md"), "# Section");
    await writeFile(
      join(root, "README.md"),
      "[Query and fragment](docs/guide.md?raw#section) [Query only](?raw)",
    );

    await expect(validateMarkdownLinks(root, ["README.md", "docs/guide.md"])).resolves.toBeNull();
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

test("checks local Markdown fragments and does not fetch remote fragments", async () => {
  const root = await mkdtemp(join(tmpdir(), "eliware-markdown-fragment-boundary-"));
  try {
    await writeFile(join(root, "target.md"), "# Local heading");
    await writeFile(
      join(root, "README.md"),
      "[Local](target.md#local-heading) [Remote](https://github.com/owner/project#not-fetched)",
    );
    await expect(validateMarkdownLinks(root, ["README.md"])).resolves.toBeNull();
    await writeFile(join(root, "README.md"), "[Local](target.md#missing)");
    await expect(validateMarkdownLinks(root, ["README.md"])).resolves.toContain("fragment");
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

test.each([
  ["missing target", "[Missing][guide]\n[guide]: docs/nope.md", "does not resolve"],
  ["undefined reference", "[Undefined][missing]", "reference is undefined"],
  ["malformed external URL", "[Bad](https://)", "invalid"],
  ["protocol-relative URL", "[Protocol relative](//host/path)", "is invalid"],
  ["repository escape", "[Outside](../outside.md)", "escapes the repository"],
  ["missing heading", "[Missing heading](docs/index.md#missing)", "fragment"],
])("maps invalid %s links to a validation message", async (_label, markdown, message) => {
  const root = await mkdtemp(join(tmpdir(), "eliware-markdown-links-invalid-"));
  try {
    await mkdir(join(root, "docs"));
    await writeFile(join(root, "docs", "index.md"), "# Heading");
    await writeFile(join(root, "README.md"), markdown);
    await expect(validateMarkdownLinks(root, ["README.md"])).resolves.toContain(message);
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

test("reuses inventory reads for repeated non-Markdown link targets", async () => {
  const root = await mkdtemp(join(tmpdir(), "eliware-markdown-links-inventory-"));
  try {
    await writeFile(join(root, "README.md"), "[Terms](terms.txt) [Again](terms.txt)");
    await writeFile(join(root, "terms.txt"), "Terms");
    const read = jest.fn((...args) => readFile(...args));
    const repositoryInventory = createRepositoryInventory(root, { read });
    await expect(
      validateMarkdownLinks(root, ["README.md"], { repositoryInventory }),
    ).resolves.toBeNull();
    expect(read).toHaveBeenCalledTimes(2);
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

test("caches repeated Markdown target stats, content, and fragment checks", async () => {
  const root = await mkdtemp(join(tmpdir(), "eliware-markdown-links-repeat-md-"));
  try {
    await writeFile(join(root, "README.md"), "[First](target.md#guide) [Again](target.md#guide)");
    await writeFile(join(root, "target.md"), "# Guide");
    const read = jest.fn((...args) => readFile(...args));
    const inspectTarget = jest.fn((...args) => stat(...args));
    const repositoryInventory = createRepositoryInventory(root, { read });
    await expect(
      validateMarkdownLinks(root, ["README.md"], { repositoryInventory }, inspectTarget),
    ).resolves.toBeNull();
    expect(inspectTarget).toHaveBeenCalledTimes(1);
    expect(read).toHaveBeenCalledTimes(2);
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

test("reports all invalid links in one Markdown file", async () => {
  const root = await mkdtemp(join(tmpdir(), "eliware-markdown-links-multiple-"));
  try {
    await writeFile(join(root, "README.md"), "[One](missing-one.md) [Two](missing-two.md)");
    const result = await validateMarkdownLinks(root, ["README.md"]);
    expect(result).toContain("missing-one.md");
    expect(result).toContain("missing-two.md");
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

test("reports an unreadable documentation file", async () => {
  const root = await mkdtemp(join(tmpdir(), "eliware-markdown-links-unreadable-"));
  try {
    await expect(validateMarkdownLinks(root, ["missing.md"])).resolves.toContain("missing.md:");
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});
