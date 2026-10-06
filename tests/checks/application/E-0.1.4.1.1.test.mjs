import { expect, test } from "@jest/globals";
import { ruleId, run } from "../../../src/checks/application/E-0.1.4.1.1.mjs";

test("E-0.1.4.1.1 accepts existing entrypoints and matching start tokens", async () => {
  const result = await run(
    {
      root: "repo",
      packageJson: { bin: { app: "bin/app.mjs" }, scripts: { start: 'node "bin/app.mjs"' } },
    },
    { lstat: async () => ({ isFile: () => true, isSymbolicLink: () => false }) },
  );
  expect(result).toEqual({ ruleId, status: "pass", message: "" });
});

test("E-0.1.4.1.1 rejects escaping paths and invalid command names", async () => {
  const result = await run({
    packageJson: { bin: { "bad name": "../app.mjs" }, main: "src/app.mjs" },
  });
  expect(result).toMatchObject({ ruleId, status: "fail" });
  expect(result.message).toContain("command name is invalid");
  expect(result.message).toContain("canonical path under bin/");
});

test("E-0.1.4.1.1 rejects missing entrypoint files and start tokens", async () => {
  const result = await run({
    packageJson: { bin: "bin/app.mjs", scripts: { start: "node app" } },
  });
  expect(result.status).toBe("fail");
  expect(result.message).toContain("does not exist");
  expect(result.message).toContain("standalone token");
});

test("E-0.1.4.1.1 uses its default context", async () => {
  await expect(run(undefined)).resolves.toMatchObject({ ruleId, status: "fail" });
});
