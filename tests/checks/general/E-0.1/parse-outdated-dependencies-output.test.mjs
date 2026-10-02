import { expect, test } from "@jest/globals";
import { parseOutdatedDependenciesOutput } from "../../../../src/checks/general/E-0.1/parse-outdated-dependencies-output.mjs";

test("parses successful output for npm outdated exit codes zero and one", () => {
  expect(parseOutdatedDependenciesOutput('{"alpha":{"latest":"2"}}', "", 0, {})).toEqual({
    alpha: { latest: "2" },
  });
  expect(parseOutdatedDependenciesOutput("{}", "", 1, {})).toEqual({});
});

test("rejects empty output for report-bearing npm outdated exit codes", () => {
  for (const code of [0, 1]) {
    expect(() => parseOutdatedDependenciesOutput("", "", code, {})).toThrow(
      "npm outdated returned empty output.",
    );
  }
  expect(() => parseOutdatedDependenciesOutput(undefined, "", 0, {})).toThrow(
    "npm outdated returned empty output.",
  );
  expect(() => parseOutdatedDependenciesOutput("", "registry unavailable", 1, {})).toThrow(
    "npm outdated returned empty output: registry unavailable",
  );
});

test("reports redacted diagnostics for unexpected exits", () => {
  expect(() =>
    parseOutdatedDependenciesOutput("{}", "NPM_TOKEN=secret registry failure", 2, {
      NPM_TOKEN: "secret",
    }),
  ).toThrow("NPM_TOKEN=[REDACTED] registry failure");
  expect(() => parseOutdatedDependenciesOutput("{}", "", 2, {})).toThrow(
    "npm outdated exited with 2.",
  );
});

test("reports invalid JSON with redacted or generic diagnostics", () => {
  expect(() =>
    parseOutdatedDependenciesOutput("not json", "NPM_TOKEN=secret registry unavailable", 0, {
      NPM_TOKEN: "secret",
    }),
  ).toThrow("npm outdated returned invalid JSON: NPM_TOKEN=[REDACTED] registry unavailable");
  expect(() => parseOutdatedDependenciesOutput("not json", "", 0, {})).toThrow(
    "npm outdated returned invalid JSON.",
  );
  expect(() => parseOutdatedDependenciesOutput("not json", "", 1, {})).toThrow(
    "npm outdated returned invalid JSON.",
  );
});
