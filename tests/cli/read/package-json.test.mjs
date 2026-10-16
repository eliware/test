import { expect, jest, test } from "@jest/globals";
import { join } from "node:path";

const readFile = jest.fn();

jest.unstable_mockModule("node:fs/promises", () => ({ readFile }));

const { readPackageJson } = await import("../../../src/cli/read/package-json.mjs");

test("reads package metadata with Eliware configuration", async () => {
  readFile.mockResolvedValue(
    JSON.stringify({ name: "@eliware/example", eliware: { apply: ["general"] } }),
  );

  await expect(readPackageJson("/repo")).resolves.toEqual(
    expect.objectContaining({ name: "@eliware/example" }),
  );
  expect(readFile).toHaveBeenCalledWith(join("/repo", "package.json"), "utf8");
});

test("rejects package metadata without an eliware object", async () => {
  readFile.mockResolvedValue(JSON.stringify({ name: "@eliware/example" }));

  await expect(readPackageJson("/repo")).rejects.toThrow("package.json.eliware is required");
});
