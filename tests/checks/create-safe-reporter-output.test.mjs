import { expect, test } from "@jest/globals";
import {
  createSafeReporterOutput,
  repositoryRelativePath,
} from "../../src/checks/create-safe-reporter-output.mjs";

test("keeps test paths inside the repository relative", () => {
  expect(repositoryRelativePath("tests/a.test.mjs")).toBe("tests/a.test.mjs");
  expect(repositoryRelativePath("C:/repo/tests/a.test.mjs", "C:/repo")).toBe("tests/a.test.mjs");
  expect(repositoryRelativePath("C:/elsewhere/a.test.mjs", "C:/repo")).toBe("[outside repository]");
  expect(repositoryRelativePath(null, "C:/repo")).toBe("unknown");
  expect(repositoryRelativePath("", "C:/repo")).toBe("unknown");
});

test("redacts environment secrets from reporter messages", () => {
  const output = [];
  const report = createSafeReporterOutput("test", {
    write: (text) => output.push(text),
    env: { API_TOKEN: "private-token" },
  });
  report("name private-token");
  expect(output).toEqual(["[test] name [REDACTED]\n"]);
});

test("limits reporter line and total output lengths", () => {
  const output = [];
  const report = createSafeReporterOutput("test", {
    write: (text) => output.push(text),
    maxLineLength: 8,
    maxOutputLength: 20,
  });
  report("1234567890");
  report("abcdefghij");
  report("ignored");
  expect(output).toEqual(["[test] 12345678\n", "[tes"]);
  expect(output.join("").length).toBeLessThanOrEqual(20);
});

test("uses stderr when no reporter writer is injected", () => {
  const previous = process.stderr.write;
  const output = [];
  process.stderr.write = (text) => output.push(text);
  try {
    createSafeReporterOutput("default")("message");
  } finally {
    process.stderr.write = previous;
  }
  expect(output).toEqual(["[default] message\n"]);
});
