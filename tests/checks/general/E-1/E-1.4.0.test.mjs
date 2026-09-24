import { expect, jest, test } from "@jest/globals";
import { run } from "../../../../src/checks/general/E-1/E-1.4.0.mjs";

test("skips syntax validation when lint is not executing", async () => {
  const validateFiles = jest.fn();
  await expect(run({ validateFiles })).resolves.toMatchObject({ status: "pass" });
  await expect(run({ executeLint: false, validateFiles })).resolves.toMatchObject({
    status: "pass",
  });
  await expect(run({ executeLint: true, mode: "test", validateFiles })).resolves.toMatchObject({
    status: "pass",
  });
  expect(validateFiles).not.toHaveBeenCalled();
});

test("validates the repository inventory for lint mode", async () => {
  const validateFiles = jest.fn(async () => []);
  await expect(
    run({
      root: "/repo",
      repositoryFiles: ["README.md"],
      executeLint: true,
      mode: "lint",
      validateFiles,
    }),
  ).resolves.toEqual({
    ruleId: "E-1.4.0",
    status: "pass",
    message: "",
  });
  expect(validateFiles).toHaveBeenCalledWith("/repo", ["README.md"]);
});

test("runs the default syntax validator when lint execution is enabled without a mode", async () => {
  await expect(
    run({ root: process.cwd(), repositoryFiles: ["package.json"], executeLint: true }),
  ).resolves.toMatchObject({ status: "pass" });
});

test("uses focused paths instead of the repository inventory", async () => {
  const validateFiles = jest.fn(async () => []);
  await run({
    root: "/repo",
    repositoryFiles: ["other.md"],
    executeLint: true,
    focusedScope: { paths: ["tests/a.test.mjs"] },
    validateFiles,
  });
  expect(validateFiles).toHaveBeenCalledWith("/repo", ["tests/a.test.mjs"]);
});

test("fails closed when the repository inventory is unavailable", async () => {
  await expect(run({ executeLint: true })).resolves.toEqual({
    ruleId: "E-1.4.0",
    status: "fail",
    message: "Repository file inventory is unavailable for syntax validation.",
  });
});

test("reports invalid maintained files", async () => {
  await expect(
    run({
      executeLint: true,
      repositoryFiles: ["bad.json"],
      validateFiles: async () => ["bad.json: unexpected token"],
    }),
  ).resolves.toEqual({
    ruleId: "E-1.4.0",
    status: "fail",
    message: "Maintained files must parse successfully:\nbad.json: unexpected token",
  });
});
