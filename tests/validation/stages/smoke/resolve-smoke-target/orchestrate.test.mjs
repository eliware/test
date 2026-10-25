import { expect, jest, test } from "@jest/globals";
import { orchestrateSmokeTarget } from "../../../../../src/validation/stages/smoke/resolve-smoke-target/orchestrate.mjs";

test("skips identity checks when the source and target paths overlap", async () => {
  const inspect = jest.fn();
  const resolvePath = jest.fn(async (path) => path);

  await expect(
    orchestrateSmokeTarget("/repo", "/repo/nested", inspect, resolvePath),
  ).resolves.toMatchObject({
    error: expect.stringContaining("outside the source"),
  });
  expect(inspect).not.toHaveBeenCalled();
});

test("returns a target identity error when inspection fails", async () => {
  const inspect = jest.fn().mockRejectedValue(new Error("missing"));
  const resolvePath = jest.fn(async (path) => path);

  await expect(
    orchestrateSmokeTarget("/repo", "/consumer", inspect, resolvePath),
  ).resolves.toMatchObject({
    error: expect.stringContaining("existing directory"),
  });
});
