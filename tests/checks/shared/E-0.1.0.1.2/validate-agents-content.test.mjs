import { expect, test } from "@jest/globals";
import { validateAgentsContent } from "../../../../src/checks/shared/E-0.1.0.1.2/validate-agents-content.mjs";

test("accepts required markers and shared commands", () => {
  expect(
    validateAgentsContent(
      "Node.js 26; native ESM; npm test; npm run lint; npm run audit; npm run format; npm run format:check",
    ),
  ).toEqual([]);
});

test("reports missing markers and commands", () => {
  expect(validateAgentsContent("Node.js 26")).toEqual([
    "AGENTS.md must include: native ESM, npm test, npm run lint, npm run audit, npm run format, npm run format:check.",
  ]);
});
