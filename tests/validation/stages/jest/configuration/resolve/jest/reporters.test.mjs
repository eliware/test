import { expect, jest, test } from "@jest/globals";

const readFile = jest.fn();
jest.unstable_mockModule("node:fs/promises", () => ({ readFile }));

const { resolveJestReporters } =
  await import("../../../../../../../src/validation/stages/jest/configuration/resolve/jest/reporters.mjs");

test("combines configured reporters with quiet harness defaults", async () => {
  readFile.mockResolvedValue(JSON.stringify({ jest: { reporters: ["summary", "default"] } }));
  const reporters = await resolveJestReporters("repo");
  expect(readFile).toHaveBeenCalledWith(expect.stringMatching(/repo[\\/]package\.json$/), "utf8");
  expect(reporters).toContain("summary");
  expect(reporters.filter((reporter) => reporter === "default")).toHaveLength(1);
  expect(reporters.some((reporter) => reporter.endsWith("jest-progress-reporter.mjs"))).toBe(true);
});

test("rejects reporter options that cannot be forwarded by the CLI", async () => {
  readFile.mockResolvedValue(JSON.stringify({ jest: { reporters: [["summary", {}]] } }));
  await expect(resolveJestReporters("repo")).rejects.toThrow("per-reporter options");
});

test.each([undefined, "{}"])(
  "uses quiet defaults when package reporters are absent: %s",
  async (source) => {
    readFile.mockResolvedValue(source ?? "{}");
    const reporters = await resolveJestReporters("repo");
    expect(reporters).toContain("default");
    expect(reporters.some((reporter) => reporter.endsWith("jest-progress-reporter.mjs"))).toBe(
      true,
    );
    expect(reporters).toHaveLength(2);
  },
);

test("rejects reporters that are not a string array", async () => {
  readFile.mockResolvedValue(JSON.stringify({ jest: { reporters: "summary" } }));
  await expect(resolveJestReporters("repo")).rejects.toThrow("per-reporter options");
});
