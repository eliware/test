import { expect, jest, test } from "@jest/globals";
import { run, ruleId } from "../../../src/checks/general/E-0.1.0.1.5.mjs";

const packageJson = {
  name: "@eliware/test",
  repository: { url: "git+https://github.com/eliware/test.git" },
  scripts: {
    test: "node bin/eliware-test.mjs",
    lint: "node bin/eliware-test.mjs --lint",
    audit: "node bin/eliware-test.mjs --audit",
    format: "node bin/eliware-test.mjs --format",
    "format:check": "node bin/eliware-test.mjs --format-check",
    pack: "node bin/eliware-test.mjs --pack",
    smoke: "node src/validation/stages/smoke/smoke-cli.mjs",
  },
  prettier: {
    printWidth: 100,
    tabWidth: 2,
    useTabs: false,
    semi: true,
    singleQuote: false,
    quoteProps: "as-needed",
    jsxSingleQuote: false,
    trailingComma: "all",
    bracketSpacing: true,
    bracketSameLine: false,
    arrowParens: "always",
    proseWrap: "preserve",
    endOfLine: "lf",
  },
};
const stageResults = {
  lint: { code: 0, status: "pass" },
  format: { code: 0, status: "pass" },
};

test("passes for this repository's canonical scripts, formatter, and cached stages", async () => {
  await expect(run({ packageJson, stageResults })).resolves.toEqual({
    ruleId,
    status: "pass",
    message: "",
  });
});

test("requires local validator files in scripts/", async () => {
  await expect(
    run({
      packageJson: {
        ...packageJson,
        scripts: { ...packageJson.scripts, validate: "node src/validate.mjs" },
      },
      stageResults,
    }),
  ).resolves.toMatchObject({
    status: "fail",
    message: expect.stringContaining(
      "package.json.scripts.validate must keep local validator files under scripts/.",
    ),
  });
  await expect(
    run({
      packageJson: {
        ...packageJson,
        scripts: { ...packageJson.scripts, validate: "node scripts/validate.mjs" },
      },
      stageResults,
    }),
  ).resolves.toMatchObject({ status: "pass" });
});

test("reports script, formatter, and missing stage failures", async () => {
  const result = await run({
    packageJson: { scripts: { test: "", extra: "npm publish" }, prettier: {} },
    stageResults: { lint: { code: 1, status: "fail" } },
  });
  expect(result.status).toBe("fail");
  expect(result.message).toContain("package.json.scripts.test");
  expect(result.message).toContain("package.json.scripts.extra");
  expect(result.message).toContain("package.json.prettier");
  expect(result.message).toContain("format-check stage");
});

test("rejects a non-object scripts value", async () => {
  await expect(run({ packageJson: { scripts: [] }, stageResults })).resolves.toMatchObject({
    message: expect.stringContaining("package.json.scripts must be an object"),
  });
});

test("uses an empty context when the caller provides no context", async () => {
  await expect(run()).resolves.toMatchObject({ status: "fail" });
});

test("reports standalone formatter configuration files", async () => {
  await expect(
    run({ repositoryInventory: { files: async () => ["nested/.prettierrc.json"] } }),
  ).resolves.toMatchObject({
    message: expect.stringContaining("Standalone Prettier configuration files"),
  });
});

test("accepts a mocked Git adapter without running it when no ignore text exists", async () => {
  const runGit = jest.fn();
  await expect(
    run({
      repositoryInventory: { files: async () => [".gitignore"] },
      runGit,
    }),
  ).resolves.toMatchObject({ ruleId, status: "fail" });
  expect(runGit).not.toHaveBeenCalled();
});

test("selects the default Git adapter without calling it when no ignore text exists", async () => {
  await expect(
    run({ repositoryInventory: { files: async () => [".gitignore"] } }),
  ).resolves.toMatchObject({ ruleId, status: "fail" });
});
