import { expect, jest, test } from "@jest/globals";
import { ruleId, run } from "../../../src/checks/npm-published/E-0.1.10.1.3.mjs";

test("validates the npm package origin through an injected Git runner", async () => {
  const runGit = jest.fn().mockResolvedValue({ stdout: "https://github.com/eliware/test.git\n" });
  await expect(
    run({
      root: "repo",
      packageJson: { repository: { url: "git+https://github.com/eliware/test.git" } },
      runGit,
    }),
  ).resolves.toMatchObject({ ruleId, status: "pass" });
  expect(runGit).toHaveBeenCalledTimes(1);
});

test("reports a failed npm package origin check", async () => {
  await expect(
    run({
      root: "repo",
      packageJson: { repository: { url: "git+https://github.com/eliware/test.git" } },
      runGit: jest.fn().mockResolvedValue({ stdout: "https://github.com/eliware/other.git" }),
    }),
  ).resolves.toMatchObject({
    ruleId,
    status: "fail",
    message: "Git origin must match package.json.repository.url.",
  });
});

test("fails when the package has no repository URL", async () => {
  await expect(run()).resolves.toMatchObject({
    ruleId,
    status: "fail",
    message: "package.json.repository.url must identify a GitHub repository.",
  });
});
