import { expect, test } from "@jest/globals";
import { createValidationContext } from "../../src/orchestrators/create-validation-context.mjs";

test("creates the complete execution context from validation options", () => {
  const timing = {};
  const writeOutput = () => {};
  expect(
    createValidationContext(
      "root",
      { name: "fixture" },
      {
        executeJest: true,
        executeLint: true,
        executeAudit: true,
        executeOutdated: true,
        executePack: true,
        executeTypecheck: true,
        executeBuild: true,
        executePackageChecks: true,
        executeFormat: true,
        mode: "focused",
        modeRuleId: null,
        jestArgs: ["tests/example.test.mjs"],
        toolArgs: ["--watch"],
        timing,
        writeOutput,
      },
    ),
  ).toEqual({
    root: "root",
    packageJson: { name: "fixture" },
    executeJest: true,
    executeLint: true,
    executeAudit: true,
    executeOutdated: true,
    executePack: true,
    executeTypecheck: true,
    executeBuild: true,
    executePackageChecks: true,
    executeFormat: true,
    mode: "focused",
    modeRuleId: null,
    repositoryInventory: expect.objectContaining({
      files: expect.any(Function),
    }),
    parseAst: expect.any(Function),
    jestArgs: ["tests/example.test.mjs"],
    toolArgs: ["--watch"],
    timing,
    writeOutput,
  });
});

test("creates default options without enabling stages", () => {
  expect(createValidationContext("root", {})).toEqual({
    root: "root",
    packageJson: {},
    executeJest: false,
    executeLint: false,
    executeAudit: false,
    executeOutdated: false,
    executePack: false,
    executeTypecheck: false,
    executeBuild: false,
    executePackageChecks: false,
    executeFormat: false,
    mode: null,
    modeRuleId: null,
    repositoryInventory: expect.objectContaining({
      files: expect.any(Function),
    }),
    parseAst: expect.any(Function),
    jestArgs: [],
    toolArgs: [],
    timing: undefined,
    writeOutput: undefined,
  });
});

test("preserves an invocation environment in the validation context", () => {
  const env = { PATH: "invocation-path" };
  expect(createValidationContext("root", {}, { env })).toEqual(expect.objectContaining({ env }));
});

test("preserves a shared AST parser and optional run scope data", () => {
  const parseAst = () => {};
  const repositoryFiles = ["src/index.mjs"];
  const focusedScope = { paths: repositoryFiles };

  expect(createValidationContext("root", {}, { parseAst, repositoryFiles, focusedScope })).toEqual({
    root: "root",
    packageJson: {},
    executeJest: false,
    executeLint: false,
    executeAudit: false,
    executeOutdated: false,
    executePack: false,
    executeTypecheck: false,
    executeBuild: false,
    executePackageChecks: false,
    executeFormat: false,
    mode: null,
    modeRuleId: null,
    jestArgs: [],
    toolArgs: [],
    timing: undefined,
    writeOutput: undefined,
    repositoryInventory: expect.objectContaining({ files: expect.any(Function) }),
    parseAst,
    repositoryFiles,
    focusedScope,
  });
});
