import { expect, jest, test } from "@jest/globals";
import { join } from "node:path";
import { verifySmokeTargetInstallation } from "../../../../../src/validation/stages/smoke/load-smoke-target/installed-state.mjs";

test("checks the installed dependency tree and package", async () => {
  const read = jest.fn().mockResolvedValue("installed");
  await expect(
    verifySmokeTargetInstallation("C:/consumer", "@eliware/test", read),
  ).resolves.toBeUndefined();
  expect(read.mock.calls).toEqual([
    [join("C:/consumer", "node_modules", ".package-lock.json")],
    [join("C:/consumer", "node_modules", "@eliware", "test", "package.json")],
  ]);
});

test("reports missing installed dependency files", async () => {
  await expect(
    verifySmokeTargetInstallation(
      "C:/consumer",
      "@eliware/test",
      jest.fn().mockRejectedValue(Error()),
    ),
  ).rejects.toThrow();
});
