import { expect, test } from "@jest/globals";
import { formatConventionFailure } from "../../src/orchestrators/format-convention-failure.mjs";

const rule = {
  id: "E-1.1.0",
  dos: ["Use the canonical README heading order.", "Include package metadata verbatim."],
  donts: ["Do not omit a required heading."],
  examples: [{ purpose: "README structure", markdown: "## Features\n## Requirements" }],
};
const authority = { rules: { [rule.id]: rule } };

test("prints the observed failure and the complete matching directive", () => {
  const message = "README.md has a missing required heading";
  const formattedRule = JSON.stringify(rule, null, 2)
    .split("\n")
    .map((line) => `    ${line}`)
    .join("\n");
  expect(formatConventionFailure({ ruleId: rule.id, message }, authority)).toBe(
    `${rule.id}: ${message}\n  Rule:\n${formattedRule}`,
  );
});

test("includes every do, don't, and example without selecting a subset", () => {
  const output = formatConventionFailure({ ruleId: rule.id, message: "failed" }, authority);
  expect(output).toContain("Use the canonical README heading order.");
  expect(output).toContain("Include package metadata verbatim.");
  expect(output).toContain("Do not omit a required heading.");
  expect(output).toContain("README structure");
  expect(output).toContain("## Features\\n## Requirements");
  expect(output).not.toContain("How to resolve:");
});

test("uses the complete bundled rule by default and handles a missing diagnostic", () => {
  expect(formatConventionFailure({ ruleId: "E-1.1.0" })).toContain(
    "The check failed without a diagnostic.",
  );
  expect(formatConventionFailure({ ruleId: "E-1.1.0" })).toContain('"donts":');
});

test("reports an unknown rule identity without inventing a directive", () => {
  expect(formatConventionFailure({ ruleId: "E-9", message: "failed" }, authority)).toBe(
    "E-9: failed\n  Rule: No bundled convention rule was found for this check.",
  );
});
