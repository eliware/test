import { expect, test } from "@jest/globals";
import { requiredIgnoreCases } from "../../../../../../../src/checks/general/E-0.1.0.1.8/validate/ignore-patterns.mjs";
import { parseGitIgnoreProbeResults } from "../../../../../../../src/checks/general/E-0.1.0.1.8/validate/git/ignore/parse-probe-results.mjs";

test("accepts valid output for required paths from the repository ignore file", () => {
  const path = requiredIgnoreCases.find(([, shouldIgnore]) => shouldIgnore)[0];
  const ignored = parseGitIgnoreProbeResults(`.gitignore:3:coverage\t${path}`, "repo");

  expect(ignored).toEqual(new Set([path]));
});

test("ignores malformed output, unknown paths, and other ignore sources", () => {
  const path = requiredIgnoreCases.find(([, shouldIgnore]) => shouldIgnore)[0];
  const output = [
    "malformed output",
    `.gitignore:no-line:coverage\t${path}`,
    `.git/info/exclude:1:coverage\t${path}`,
    ".gitignore:1:coverage\tunqueried/path",
  ].join("\n");

  expect(parseGitIgnoreProbeResults(output, "repo")).toEqual(new Set());
});
