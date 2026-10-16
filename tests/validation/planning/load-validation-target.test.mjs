import { beforeEach, expect, jest, test } from "@jest/globals";
import { join } from "node:path";

const readFile = jest.fn();

jest.unstable_mockModule("node:fs/promises", () => ({ readFile }));

const { loadValidationTarget } =
  await import("../../../src/validation/planning/load-validation-target.mjs");

beforeEach(() => readFile.mockReset());

test("loads the target package metadata", async () => {
  readFile.mockResolvedValue(
    JSON.stringify({ name: "@eliware/fixture", eliware: { apply: ["general"] } }),
  );

  const packageJson = await loadValidationTarget("C:/repo");
  expect(packageJson.name).toBe("@eliware/fixture");
  expect(packageJson.eliware.apply).toEqual(["general"]);
  expect(readFile).toHaveBeenCalledWith(join("C:/repo", "package.json"), "utf8");
});
