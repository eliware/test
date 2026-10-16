import { expect, jest, test } from "@jest/globals";
import { run, ruleId } from "../../../src/checks/general/E-0.1.0.1.11.mjs";

const emptyExamples = async () => new Set();

test("checks prose files and reports unapproved terms with alternatives", async () => {
  const files = ["README.md", "image.bin", "tests/helper.mjs"];
  const inventory = {
    files: jest.fn(async () => files),
    readText: jest.fn(async () => "abrupt."),
  };
  const result = await run(
    { repositoryInventory: inventory },
    { loadExactExamples: emptyExamples },
  );
  expect(result).toEqual({
    ruleId,
    status: "fail",
    message:
      'README.md:1 uses "abrupt". Suggested alternatives: SUDDEN (adj), SUDDENLY (adv). The alternatives are examples. They are not requirements. Rewrite the text with grammatical wording that omits the listed term.',
  });
  expect(inventory.readText).toHaveBeenCalledTimes(1);
});

test("returns pass when supported repository files contain clean prose", async () => {
  await expect(
    run(
      {
        repositoryInventory: {
          files: async () => ["README.md", "src/file.txt"],
          readText: async () => "unlistedterm.",
        },
      },
      { loadExactExamples: emptyExamples },
    ),
  ).resolves.toEqual({ ruleId, status: "pass", message: "" });
});

test("uses bundled example loading when callers inject file access only", async () => {
  const list = jest.fn(async () => [
    { name: "example.yaml", isDirectory: () => false, isFile: () => true },
  ]);
  const read = jest.fn(async () => 'examples: ["A canonical sentence."]');
  const result = await run(
    {
      repositoryInventory: {
        files: async () => ["README.md"],
        readText: async () => "A canonical sentence.",
      },
    },
    { exampleFiles: { list, read } },
  );
  expect(result).toEqual({ ruleId, status: "pass", message: "" });
  expect(read).toHaveBeenCalledTimes(1);
});

test("reports inventory failures and missing inventory methods", async () => {
  await expect(run()).resolves.toEqual({
    ruleId,
    status: "fail",
    message: "Repository language files could not be inspected.",
  });
  await expect(run({ repositoryInventory: { files: async () => [] } })).resolves.toMatchObject({
    status: "fail",
    ruleId,
  });
  await expect(
    run(
      {
        repositoryInventory: {
          files: async () => {
            throw new Error("list failed");
          },
          readText: async () => "",
        },
      },
      { loadExactExamples: emptyExamples },
    ),
  ).resolves.toMatchObject({
    status: "fail",
    message: "Repository language files could not be inspected: list failed",
  });
});

test("reports file read failures", async () => {
  await expect(
    run(
      {
        repositoryInventory: {
          files: async () => ["README.md"],
          readText: async () => {
            throw new Error("read failed");
          },
        },
      },
      { loadExactExamples: emptyExamples },
    ),
  ).resolves.toMatchObject({ status: "fail", message: expect.stringContaining("read failed") });
});
