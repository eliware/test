import { expect, test } from "@jest/globals";
import { mkdtemp, mkdir, rm, symlink, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { validateMarkdownLinks } from "../../../../src/checks/general/E-0.1.0.1.4/validate-markdown-links.mjs";

test("accepts local files, folders, fragments, and valid external links", async () => {
  const root = await mkdtemp(join(tmpdir(), "eliware-links-"));
  try {
    await mkdir(join(root, "folder"));
    await writeFile(join(root, "target.md"), "## Link target\n<div id='anchor'></div>");
    await writeFile(
      join(root, "README.md"),
      "[file](target.md#link-target) [id](target.md#anchor) [folder](folder/) https://github.com/eliware/test <mailto:eli@eliware.org>",
    );
    await expect(validateMarkdownLinks(root)).resolves.toEqual([]);
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

test("reports invalid external, escaping, missing, and fragment links", async () => {
  const root = await mkdtemp(join(tmpdir(), "eliware-links-"));
  try {
    await writeFile(
      join(root, "README.md"),
      "[escape](../outside.md) [missing](missing.md) [fragment](README.md#bad%ZZ) [network](//host/path) <http://> <https://u:p@example.org> <mailto:nope>",
    );
    const errors = await validateMarkdownLinks(root);
    expect(errors.join("\n")).toContain("escapes the repository");
    expect(errors.join("\n")).toContain("does not resolve");
    expect(errors.join("\n")).toContain("invalid");
    expect(errors.join("\n")).toContain("fragment does not resolve");
    expect(errors.join("\n")).toContain("link is invalid: //host/path");
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

test("rejects Markdown links that escape through a directory symlink", async () => {
  const root = await mkdtemp(join(tmpdir(), "eliware-links-"));
  const outside = await mkdtemp(join(tmpdir(), "eliware-outside-"));
  try {
    await writeFile(join(outside, "target.md"), "## Outside heading\n");
    await symlink(outside, join(root, "linked"), process.platform === "win32" ? "junction" : "dir");
    await writeFile(join(root, "README.md"), "[outside](linked/target.md#outside-heading)");
    await expect(validateMarkdownLinks(root)).resolves.toContain(
      "Documentation link escapes the repository: linked/target.md#outside-heading in README.md.",
    );
  } finally {
    await rm(root, { recursive: true, force: true });
    await rm(outside, { recursive: true, force: true });
  }
});

test("does not resolve fragments against code headings", async () => {
  const root = await mkdtemp(join(tmpdir(), "eliware-links-"));
  try {
    await writeFile(join(root, "target.md"), "```md\n## Fake heading\n```\n");
    await writeFile(join(root, "README.md"), "[target](target.md#fake-heading)");
    await expect(validateMarkdownLinks(root)).resolves.toContain(
      "Documentation fragment does not resolve: target.md#fake-heading in README.md.",
    );
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

test("matches explicit HTML IDs with case sensitivity", async () => {
  const root = await mkdtemp(join(tmpdir(), "eliware-links-"));
  try {
    await writeFile(join(root, "target.md"), '<div id="Exact"></div>');
    await writeFile(join(root, "README.md"), "[valid](target.md#Exact) [invalid](target.md#exact)");
    await expect(validateMarkdownLinks(root)).resolves.toContain(
      "Documentation fragment does not resolve: target.md#exact in README.md.",
    );
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

test("resolves repeated, formatted, and setext heading anchors", async () => {
  const root = await mkdtemp(join(tmpdir(), "eliware-links-"));
  try {
    await writeFile(
      join(root, "target.md"),
      "# Repeat\n\n# Repeat\n\n## A [linked](page.md) heading\n\nSetext title\n---\n<div id=bare-anchor></div>",
    );
    await writeFile(join(root, "page.md"), "");
    await writeFile(
      join(root, "README.md"),
      "[duplicate](target.md#repeat-1) [formatted](target.md#a-linked-heading) [setext](target.md#setext-title) [HTML](target.md#bare-anchor)",
    );
    await expect(validateMarkdownLinks(root)).resolves.toEqual([]);
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

test("uses inventory and reports unreadable markdown", async () => {
  const errors = await validateMarkdownLinks(
    "/repo",
    {
      repositoryInventory: {
        documentationFiles: async ({ predicate }) => {
          expect(predicate("README.md")).toBe(true);
          return ["README.md"];
        },
      },
    },
    {
      read: async () => {
        throw new Error("blocked");
      },
    },
  );
  expect(errors[0]).toContain("could not be read");
});

test("reports reference links without a definition", async () => {
  const root = await mkdtemp(join(tmpdir(), "eliware-links-"));
  try {
    await writeFile(join(root, "README.md"), "[label][missing]");
    await expect(validateMarkdownLinks(root)).resolves.toContain(
      "Markdown reference link has no definition in README.md.",
    );
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

test("validates shortcut reference destinations", async () => {
  const root = await mkdtemp(join(tmpdir(), "eliware-links-"));
  try {
    await writeFile(join(root, "README.md"), "[missing]\n\n[missing]: absent.md");
    await expect(validateMarkdownLinks(root)).resolves.toContain(
      "Documentation link does not resolve: absent.md in README.md.",
    );
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

test("rejects targets that are neither files nor directories", async () => {
  const root = await mkdtemp(join(tmpdir(), "eliware-links-"));
  try {
    await writeFile(join(root, "README.md"), "[target](target.bin)");
    const errors = await validateMarkdownLinks(
      root,
      {},
      {
        stat: async () => ({ isFile: () => false, isDirectory: () => false }),
        realpath: async (path) => path,
      },
    );
    expect(errors[0]).toContain("does not resolve");
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});
