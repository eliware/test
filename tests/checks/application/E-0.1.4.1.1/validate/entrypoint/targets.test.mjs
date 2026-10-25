import { expect, jest, test } from "@jest/globals";
import { validateEntrypointTargets } from "../../../../../../src/checks/application/E-0.1.4.1.1/validate/entrypoint/targets.mjs";

test("validates each target and returns all filesystem errors", async () => {
  const checkPath = jest.fn(async () => {
    throw new Error("missing");
  });
  await expect(
    validateEntrypointTargets(["bin/first.mjs", "bin/second.mjs"], "repo", checkPath),
  ).resolves.toEqual([
    "Entrypoint target does not exist: bin/first.mjs.",
    "Entrypoint target does not exist: bin/second.mjs.",
  ]);
  expect(checkPath).toHaveBeenCalled();
});

test("accepts an empty target list without reading the file system", async () => {
  const checkPath = jest.fn();
  await expect(validateEntrypointTargets([], "repo", checkPath)).resolves.toEqual([]);
  expect(checkPath).not.toHaveBeenCalled();
});
