import { expect, test } from "@jest/globals";
import { validateProfileTestGuidance } from "../../../../../../src/validation/shared/conventions/validate/profile/test-guidance.mjs";

const guidance = [
  "For a small change, run one or more focused tests.",
  "Run one test file with `npm test -- tests/path/to/example.test.mjs`.",
  "Run multiple test files with `npm test -- tests/path/to/first.test.mjs tests/path/to/second.test.mjs`.",
  "Run the full `npm test` suite before a commit or milestone.",
].join("\n");

function inventory(content) {
  return { readText: async () => content };
}

test.each(["application", "library"])("accepts focused guidance for %s", async (profile) => {
  const heading = profile === "application" ? "Application" : "Library";
  await expect(
    validateProfileTestGuidance(profile, inventory(`## ${heading}\n${guidance}\n## CLI`)),
  ).resolves.toEqual([]);
});

test("requires all focused guidance in the selected profile section", async () => {
  await expect(
    validateProfileTestGuidance("application", inventory("## Application\nRun one test.")),
  ).resolves.toEqual(
    guidance.split("\n").map((line) => `AGENTS.md ## Application must include: ${line}`),
  );
});

test("does not require focused guidance for other profiles", async () => {
  await expect(validateProfileTestGuidance("web", {})).resolves.toEqual([]);
});

test("reports guidance when the profile section is absent", async () => {
  await expect(
    validateProfileTestGuidance("application", inventory(`## Library\n${guidance}`)),
  ).resolves.toHaveLength(guidance.split("\n").length);
});

test("reports an unreadable AGENTS file", async () => {
  await expect(
    validateProfileTestGuidance("library", {
      readText: async () => Promise.reject(new Error("denied")),
    }),
  ).resolves.toEqual(["AGENTS.md could not be read: denied"]);
});
