import { expect, test } from "@jest/globals";
import { ruleId } from "../../../src/checks/general/E-0.1.0.1.15.mjs";
import run from "../../../src/checks/general/E-0.1.0.1.15.mjs";

test("reports CommonJS package entrypoints under the native ESM rule", async () => {
  await expect(
    run({
      packageJson: { main: "./index.cjs" },
      repositoryFiles: [],
    }),
  ).resolves.toMatchObject({
    ruleId,
    status: "fail",
    message: "package.json: CommonJS entrypoint or export",
  });
});

test("reports CommonJS source syntax", async () => {
  await expect(
    run({
      root: "/repo",
      packageJson: {},
      repositoryFiles: ["invalid.mjs"],
      parseAst: async () => {
        throw new Error("blocked");
      },
    }),
  ).resolves.toMatchObject({
    ruleId,
    status: "fail",
    message: "invalid.mjs: invalid module syntax (blocked)",
  });
});

test("passes when the repository uses native ESM", async () => {
  await expect(run({ packageJson: {}, repositoryFiles: [] })).resolves.toEqual({
    ruleId,
    status: "pass",
    message: "",
  });
});

test("uses the default context", async () => {
  await expect(run(undefined, { scanSources: async () => [] })).resolves.toMatchObject({
    ruleId,
    status: "pass",
  });
});
