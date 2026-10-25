import { expect, test } from "@jest/globals";
import { validateApplicationLineLimits } from "../../../../../../src/checks/application/E-0.1.4.1.2/validate/application/line-limits.mjs";

test("counts source lines and test lines, including empty files", async () => {
  const read = async (path) => (path.endsWith("a.mjs") ? Array(152).fill("x").join("\n") : "");
  await expect(
    validateApplicationLineLimits(["src/a.mjs", "tests/b.test.mjs"], read, "repo", [
      { path: "tests/b.test.mjs", content: "", readError: false },
    ]),
  ).resolves.toEqual(["src/a.mjs has 152 physical lines. The maximum is 150."]);
});

test("accepts the maximum when the final newline is present", async () => {
  const source = Array(150).fill("").join("\n") + "\n";
  await expect(
    validateApplicationLineLimits(["src/a.mjs"], async () => source, "repo", []),
  ).resolves.toEqual([]);
});

test("counts an extra trailing blank line", async () => {
  const source = Array(151).fill("").join("\n") + "\n";
  await expect(
    validateApplicationLineLimits(["src/a.mjs"], async () => source, "repo", []),
  ).resolves.toEqual(["src/a.mjs has 151 physical lines. The maximum is 150."]);
});

test("applies the test file limit of 300 physical lines", async () => {
  const source = Array(300).fill("").join("\n");
  await expect(
    validateApplicationLineLimits(["tests/a.test.mjs"], async () => source, "repo", [
      { path: "tests/a.test.mjs", content: source, readError: false },
    ]),
  ).resolves.toEqual([]);
  await expect(
    validateApplicationLineLimits(
      ["tests/a.test.mjs"],
      async () => `${Array(300).fill("x").join("\n")}\nx`,
      "repo",
      [
        {
          path: "tests/a.test.mjs",
          content: `${Array(300).fill("x").join("\n")}\nx`,
          readError: false,
        },
      ],
    ),
  ).resolves.toEqual(["tests/a.test.mjs has 301 physical lines. The maximum is 300."]);
});

test("fails when it cannot read a source file", async () => {
  await expect(
    validateApplicationLineLimits(
      ["src/a.mjs"],
      async () => {
        throw new Error("read failed");
      },
      "repo",
      [],
    ),
  ).resolves.toEqual(["src/a.mjs could not be read for its line limit."]);
});

test("reports a test file that the coordinator could not read", async () => {
  await expect(
    validateApplicationLineLimits(["tests/a.test.mjs"], async () => "", "repo", [
      { path: "tests/a.test.mjs", content: "", readError: true },
    ]),
  ).resolves.toEqual(["tests/a.test.mjs could not be read for its line limit."]);
});
