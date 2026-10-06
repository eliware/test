import { expect, test } from "@jest/globals";
import { validateApplicationLineLimits } from "../../../../src/checks/application/E-0.1.4.1.2/validate-application-line-limits.mjs";

test("counts source lines and test lines, including empty files", async () => {
  const read = async (path) => (path.endsWith("a.mjs") ? Array(102).fill("x").join("\n") : "");
  await expect(
    validateApplicationLineLimits(["src/a.mjs", "tests/b.test.mjs"], read, "repo"),
  ).resolves.toEqual(["src/a.mjs has 102 physical lines; maximum is 100."]);
});

test("accepts the maximum when the final newline is present", async () => {
  const source = Array(100).fill("").join("\n") + "\n";
  await expect(
    validateApplicationLineLimits(["src/a.mjs"], async () => source, "repo"),
  ).resolves.toEqual([]);
});

test("fails when it cannot read a source file", async () => {
  await expect(
    validateApplicationLineLimits(
      ["src/a.mjs"],
      async () => {
        throw new Error("read failed");
      },
      "repo",
    ),
  ).resolves.toEqual(["src/a.mjs could not be read for its line limit."]);
});
