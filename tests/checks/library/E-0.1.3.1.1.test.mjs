import { expect, test } from "@jest/globals";
import { ruleId, run } from "../../../src/checks/library/E-0.1.3.1.1.mjs";

test("requires explicit main and exports targets under src", async () => {
  const stat = async () => ({ isFile: () => true });
  await expect(
    run(
      {
        packageJson: {
          main: "./src/index.mjs",
          exports: { ".": "./src/index.mjs" },
          scripts: { typecheck: "tsc --noEmit" },
          devDependencies: { typescript: "*" },
        },
      },
      { stat },
    ),
  ).resolves.toEqual({ ruleId, status: "pass", message: "" });
  await expect(run({}, { stat })).resolves.toMatchObject({
    status: "fail",
    message: expect.stringContaining("Libraries must declare a runtime main under src/."),
  });
});

test("uses default context and dependencies", async () => {
  await expect(run()).resolves.toMatchObject({ status: "fail" });
});

test("rejects entrypoints outside src and missing target files", async () => {
  const stat = async () => {
    throw new Error("missing");
  };
  const outside = await run(
    { packageJson: { main: "./dist/index.mjs", exports: { ".": "./src/index.mjs" } } },
    { stat },
  );
  expect(outside.message).toContain("must target a file under src/");
  const missing = await run(
    { packageJson: { main: "./src/index.mjs", exports: { ".": "./src/index.mjs" } } },
    { stat },
  );
  expect(missing.message).toContain("target does not exist");
});

test("requires declarations to sit beside their implementation", async () => {
  const stat = async (path) => ({ isFile: () => !path.endsWith("index.mjs") });
  const result = await run(
    {
      packageJson: {
        main: "./src/index.mjs",
        exports: { ".": { import: "./src/index.mjs", types: "./src/index.d.ts" } },
        types: "./src/index.d.ts",
        scripts: { typecheck: "tsc --noEmit" },
        devDependencies: { typescript: "*" },
      },
    },
    { stat },
  );
  expect(result.status).toBe("fail");
  expect(result.message).toContain("same-basename .mjs file");
});

test("rejects internal pure barrels and allows primary and index barrels", async () => {
  const files = ["src/index.mjs", "src/internal.mjs", "src/nested/index.mjs"];
  const inventory = {
    files: async () => files,
    readText: async (path) =>
      path.endsWith("internal.mjs")
        ? 'import { value } from "./value.mjs"; export { value };'
        : 'export { value } from "./value.mjs";',
  };
  const stat = async () => ({ isFile: () => true });
  const result = await run(
    {
      root: "/repo",
      packageJson: {
        main: "./src/index.mjs",
        exports: { ".": "./src/index.mjs", "./nested": "./src/nested/index.mjs" },
        scripts: { typecheck: "tsc --noEmit" },
        devDependencies: { typescript: "*" },
      },
      repositoryInventory: inventory,
    },
    { stat },
  );
  expect(result).toEqual({
    ruleId,
    status: "fail",
    message: "src/internal.mjs is an internal pure export barrel.",
  });
});
