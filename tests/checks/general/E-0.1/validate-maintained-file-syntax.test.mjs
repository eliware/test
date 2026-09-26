import { mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, expect, jest, test } from "@jest/globals";
import { validateMaintainedFileSyntax } from "../../../../src/checks/general/E-0.1/validate-maintained-file-syntax.mjs";

let root;

afterEach(async () => {
  if (root) await rm(root, { recursive: true, force: true });
  root = undefined;
});

test.each([
  ["module.mjs", "export const value = 1;"],
  ["module.js", "export const value = 1;"],
  ["module.cjs", "const value = 1;"],
  ["module.jsx", "export const view = <div />;"],
  ["module.ts", "export const value: number = 1;"],
  ["module.tsx", "export const view = <div />;"],
  ["package.json", '{"name":"valid"}'],
  ["workflow.yml", "name: ci\n"],
  ["workflow.yaml", "name: ci\n"],
  ["README.md", "# Valid\n"],
])("accepts valid %s syntax", async (file, content) => {
  root = await mkdtemp(join(tmpdir(), "eliware-syntax-"));
  await writeFile(join(root, file), content);
  await expect(validateMaintainedFileSyntax(root, [file])).resolves.toEqual([]);
});

test.each([
  ["module.mjs", "export const = ;"],
  ["module.js", "export const = ;"],
  ["module.ts", "export const value: = 1;"],
  ["package.json", '{"name":}'],
  ["workflow.yml", "name: [unterminated"],
  ["workflow.yaml", "name: [unterminated"],
])("reports invalid %s syntax", async (file, content) => {
  root = await mkdtemp(join(tmpdir(), "eliware-syntax-"));
  await writeFile(join(root, file), content);
  await expect(validateMaintainedFileSyntax(root, [file])).resolves.toHaveLength(1);
});

test("reports a Markdown parser failure", async () => {
  root = await mkdtemp(join(tmpdir(), "eliware-syntax-"));
  await writeFile(join(root, "README.md"), "content");
  const syntaxParsers = new Map([
    [
      ".md",
      () => {
        throw new Error("invalid markdown");
      },
    ],
  ]);
  await expect(
    validateMaintainedFileSyntax(root, ["README.md"], { syntaxParsers }),
  ).resolves.toEqual(["README.md: invalid markdown"]);
});

test("ignores extensions outside the maintained syntax policy", async () => {
  await expect(validateMaintainedFileSyntax("/repo", ["image.svg"])).resolves.toEqual([]);
});

test("fails closed when a required maintained extension has no parser", async () => {
  await expect(validateMaintainedFileSyntax("/repo", ["README.md"], {
    syntaxParsers: new Map(),
  })).resolves.toEqual([
    "README.md: no syntax parser is configured for maintained .md files.",
  ]);
});

test("reports read failures as file syntax diagnostics", async () => {
  await expect(validateMaintainedFileSyntax("/repo", ["README.md"])).resolves.toEqual([
    expect.stringContaining("README.md:"),
  ]);
});

test("uses the shared AST cache for maintained module syntax", async () => {
  const read = jest.fn();
  const parseAst = jest.fn().mockResolvedValue({ type: "File" });

  await expect(
    validateMaintainedFileSyntax("/repo", ["src/module.mjs"], { read, parseAst }),
  ).resolves.toEqual([]);
  expect(read).not.toHaveBeenCalled();
  expect(parseAst).toHaveBeenCalledWith("/repo", "src/module.mjs", { sourceType: "module" });
});
