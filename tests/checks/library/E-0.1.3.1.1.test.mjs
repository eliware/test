import { expect, test } from "@jest/globals";
import { ruleId, run } from "../../../src/checks/library/E-0.1.3.1.1.mjs";

const validEntrypoints = {
  main: "./src/index.mjs",
  exports: { ".": "./src/index.mjs" },
};

test("passes valid entrypoints when the typecheck script uses a declared tool", async () => {
  const result = await run(
    {
      packageJson: {
        ...validEntrypoints,
        scripts: { typecheck: "tsc --noEmit" },
        devDependencies: { typescript: "*" },
      },
    },
    { stat: async () => ({ isFile: () => true }) },
  );

  expect(result).toEqual({ ruleId, status: "pass", message: "" });
});

test("combines entrypoint and typecheck failures", async () => {
  const result = await run({
    packageJson: {
      main: "./dist/index.mjs",
      exports: { ".": "./src/index.mjs" },
    },
  });

  expect(result).toMatchObject({ ruleId, status: "fail" });
  expect(result.message).toContain("must target a file under src/");
  expect(result.message).toContain("The typecheck script must be nonempty.");
});

test("uses default context and dependencies", async () => {
  await expect(run()).resolves.toMatchObject({ ruleId, status: "fail" });
});
