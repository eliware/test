import { expect, test } from "@jest/globals";
import { validateMirroredTests } from "../../../../src/checks/application/E-0.1.4.1.2/validate-mirrored-tests.mjs";

test("requires matching executable tests that import their source", async () => {
  const files = ["src/a.mjs", "tests/a.test.mjs"];
  const readText = async () =>
    'import { test } from "@jest/globals"; import { value } from "../src/a.mjs"; test("a", () => value);';
  await expect(validateMirroredTests(files, readText, "repo")).resolves.toEqual([]);
});

test("reports missing, unmatched, support, and non-executable test files", async () => {
  const files = ["src/a.mjs", "tests/b.test.mjs", "tests/support.mjs"];
  const errors = await validateMirroredTests(files, async () => "const value = 1;", "repo");
  expect(errors.join("\n")).toContain("tests/a.test.mjs is required");
  expect(errors.join("\n")).toContain("tests/support.mjs is not a mirrored");
  expect(errors.join("\n")).toContain("tests/b.test.mjs has no matching source");
  expect(errors.join("\n")).toContain("must declare an executable Jest test");
  expect(errors.join("\n")).toContain("must import its exact source");
});

test("reports unreadable test source", async () => {
  const errors = await validateMirroredTests(
    ["src/a.mjs", "tests/a.test.mjs"],
    async () => {
      throw new Error("read failed");
    },
    "repo",
  );
  expect(errors).toHaveLength(2);
});

test("does not accept a test name inside a comment", async () => {
  const files = ["src/a.mjs", "tests/a.test.mjs"];
  const readText = async () =>
    'import { value } from "../src/a.mjs"; // test("comment", () => value);';
  await expect(validateMirroredTests(files, readText, "repo")).resolves.toContain(
    "tests/a.test.mjs must declare an executable Jest test.",
  );
});
