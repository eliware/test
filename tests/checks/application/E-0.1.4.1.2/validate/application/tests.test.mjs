import { expect, jest, test } from "@jest/globals";
import { validateApplicationTests } from "../../../../../../src/checks/application/E-0.1.4.1.2/validate/application/tests.mjs";

test("validates mirrored test content and reads each test file once", async () => {
  const files = ["src/widget.mjs", "tests/widget.test.mjs"];
  const readText = jest.fn(async () => 'test("works", () => {});');

  await expect(validateApplicationTests(files, readText, "repo")).resolves.toEqual([]);
  expect(readText.mock.calls.filter(([path]) => path.endsWith("widget.test.mjs"))).toHaveLength(1);
});

test("reports missing executable tests", async () => {
  const files = ["src/widget.mjs", "tests/widget.test.mjs"];

  await expect(
    validateApplicationTests(files, async () => "const value = true;", "repo"),
  ).resolves.toContain("tests/widget.test.mjs must declare an executable Jest test.");
});
