import { expect, test } from "@jest/globals";
import { ruleId, run } from "../../../src/checks/general/E-0.1.0.1.9.mjs";

function createInventory(files, contents) {
  return {
    repositoryFiles: async () => files,
    readBytes: async (path) => Buffer.from(contents[path] ?? "", "utf8"),
  };
}

test("accepts a clean repository inventory", async () => {
  const result = await run({
    repositoryInventory: createInventory(["README.md"], {
      "README.md": "Project files. Runtime data may use /var/lib/service.",
    }),
  });
  expect(result).toEqual({ ruleId, status: "pass", message: "" });
});

const machinePaths = [
  ["C:", "Users", "eli", "project"].join("\\"),
  ["E:", "home", "eli", "project"].join("\\"),
  ["C:", "srv", "service"].join("\\"),
  ["D:", "var", "lib", "service"].join("\\"),
  ["", "home", "eli", "project"].join("/"),
  ["", "users", "eli", "project"].join("/"),
  ["", "srv", "service"].join("/"),
  ["C:", "eliware", "test"].join("\\"),
  ["D:", "Users", "eli", "src", "project"].join("/"),
];

test.each(machinePaths)("rejects machine-specific path %s", async (value) => {
  const result = await run({
    repositoryInventory: createInventory(["README.md"], { "README.md": value }),
  });
  expect(result).toMatchObject({ ruleId, status: "fail" });
  expect(result.message).toContain("README.md");
});

test("fails closed when discovery or file reads fail", async () => {
  await expect(run()).resolves.toMatchObject({ ruleId, status: "fail" });
  await expect(
    run({
      repositoryInventory: {
        repositoryFiles: async () => {
          throw new Error("list failed");
        },
        readBytes: async () => Buffer.from(""),
      },
    }),
  ).resolves.toMatchObject({
    ruleId,
    status: "fail",
    message: expect.stringContaining("list failed"),
  });
  const inventory = {
    repositoryFiles: async () => ["README.md"],
    readBytes: async () => {
      throw new Error("read failed");
    },
  };
  await expect(run({ repositoryInventory: inventory })).resolves.toMatchObject({
    ruleId,
    status: "fail",
    message: expect.stringContaining("read failed"),
  });
});
