import { expect, jest, test } from "@jest/globals";
import { runSmokeCommand } from "../../../../../src/validation/stages/smoke/cli/command.mjs";

test("reads the package manifest and runs smoke with the selected target", async () => {
  const read = jest.fn(async () => JSON.stringify({ name: "@eliware/example" }));
  const smoke = jest.fn(async () => "Smoke passed");
  const write = jest.fn();

  await expect(
    runSmokeCommand({ root: "repo", target: "consumer", write, read, smoke }),
  ).resolves.toBe("Smoke passed");
  expect(read).toHaveBeenCalledWith(expect.stringMatching(/repo[\\/]package\.json$/u), "utf8");
  expect(smoke).toHaveBeenCalledWith({
    root: "repo",
    packageJson: { name: "@eliware/example" },
    target: "consumer",
    write,
  });
});

test("rejects malformed package metadata before smoke runs", async () => {
  const smoke = jest.fn();
  await expect(
    runSmokeCommand({
      root: "repo",
      target: "consumer",
      write: jest.fn(),
      read: async () => "{",
      smoke,
    }),
  ).rejects.toThrow();
  expect(smoke).not.toHaveBeenCalled();
});
