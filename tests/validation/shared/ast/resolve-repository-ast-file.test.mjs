import { expect, test } from "@jest/globals";
import { join } from "node:path";
import { resolveRepositoryAstFile } from "../../../../src/validation/shared/ast/resolve-repository-ast-file.mjs";

test("resolves repository-relative and absolute in-repository source paths", () => {
  const root = join(process.cwd(), "repository-root");
  expect(resolveRepositoryAstFile(root, "src/module.mjs")).toEqual({
    repositoryFile: "src/module.mjs",
    absoluteFile: join(root, "src/module.mjs"),
  });
  expect(resolveRepositoryAstFile(root, join(root, "src/module.mjs"))).toEqual({
    repositoryFile: "src/module.mjs",
    absoluteFile: join(root, "src/module.mjs"),
  });
  expect(resolveRepositoryAstFile(root, "src/name:part.mjs")).toMatchObject({
    repositoryFile: "src/name:part.mjs",
  });
});

test("rejects relative and absolute source paths outside the repository", () => {
  const root = join(process.cwd(), "repository-root");
  for (const file of ["../outside.mjs", join(root, "..", "outside.mjs")]) {
    expect(() => resolveRepositoryAstFile(root, file)).toThrow(
      "AST source file must be inside the repository",
    );
  }
});
