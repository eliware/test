import { expect, test } from "@jest/globals";
import { ruleId, run } from "../../../src/checks/general/E-0.1.0.1.10.mjs";

test("accepts source and test files without repeated prefixes", async () => {
  await expect(
    run({
      repositoryInventory: { repositoryFiles: async () => ["src/task.mjs", "tests/task.test.mjs"] },
    }),
  ).resolves.toEqual({ ruleId, status: "pass", message: "" });
});

test("reports source and matching test moves for a repeated prefix", async () => {
  const result = await run({
    repositoryInventory: {
      repositoryFiles: async () => [
        "src/maintask-subtaskA.mjs",
        "src/maintask-subtaskB.mjs",
        "tests/maintask-subtaskA.test.mjs",
        "tests/maintask-subtaskB.test.mjs",
      ],
    },
  });
  expect(result).toMatchObject({ ruleId, status: "fail" });
  expect(result.message).toContain("src/maintask-subtaskA.mjs to src/maintask/subtaskA.mjs");
  expect(result.message).toContain(
    "tests/maintask-subtaskA.test.mjs to tests/maintask/subtaskA.test.mjs",
  );
});

test("reports a missing paired test destination", async () => {
  const result = await run({
    repositoryInventory: {
      repositoryFiles: async () => [
        "src/task-a.mjs",
        "src/task-b.mjs",
        "tests/task-a.test.mjs",
        "tests/task-b.test.mjs",
      ],
    },
  });
  expect(result.message).toContain("Move tests/task-a.test.mjs to tests/task/a.test.mjs");
});

test("rejects a repeated parent name in a source or test path", async () => {
  const result = await run({
    repositoryInventory: {
      repositoryFiles: async () => ["src/task/task-child.mjs", "tests/task/task-child.test.mjs"],
    },
  });
  expect(result.message).toContain("src/task/task-child.mjs repeats its parent folder name");
  expect(result.message).toContain("tests/task/task-child.test.mjs repeats its parent folder name");
});

test("ignores rule ID prefixes and groups multiword prefixes as one folder", async () => {
  const result = await run({
    repositoryInventory: {
      repositoryFiles: async () => [
        "src/E-0.1.0.1.2.mjs",
        "src/E-0.1.0.1.3.mjs",
        "src/create-repository-directory-read-cache.mjs",
        "src/create-repository-entry-index.mjs",
      ],
    },
  });
  expect(result.message).toContain(
    "src/create-repository-directory-read-cache.mjs to src/create-repository/directory-read-cache.mjs",
  );
  expect(result.message).not.toContain("E-0.1.0.1.2");
});

test("reports repository discovery failures", async () => {
  await expect(run()).resolves.toMatchObject({ ruleId, status: "fail" });
  await expect(
    run({
      repositoryInventory: {
        repositoryFiles: async () => {
          throw new Error("list failed");
        },
      },
    }),
  ).resolves.toMatchObject({
    ruleId,
    status: "fail",
    message: expect.stringContaining("list failed"),
  });
});
