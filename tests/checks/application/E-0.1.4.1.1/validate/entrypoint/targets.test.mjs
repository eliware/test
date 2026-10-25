import { expect, jest, test } from "@jest/globals";
import { validateEntrypointTargets } from "../../../../../../src/checks/application/E-0.1.4.1.1/validate/entrypoint/targets.mjs";

test("validates each target and returns all target errors", async () => {
  await expect(
    validateEntrypointTargets(["src/tool.mjs", "bin/../escape.mjs"], "repo", async () => ({
      isFile: () => true,
      isDirectory: () => false,
      isSymbolicLink: () => false,
    })),
  ).resolves.toEqual([
    "Entrypoint target must use a canonical path under bin/: src/tool.mjs.",
    "Entrypoint target must use a canonical path under bin/: bin/../escape.mjs.",
  ]);
});

test("accepts an empty target list without reading the file system", async () => {
  const checkPath = jest.fn();
  await expect(validateEntrypointTargets([], "repo", checkPath)).resolves.toEqual([]);
  expect(checkPath).not.toHaveBeenCalled();
});
