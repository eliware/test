import { expect, test } from "@jest/globals";
import { isUserAgentValue } from "../../../../../src/checks/general/E-0.1.0.1.11/extract/is-user-agent-value.mjs";

test.each(["userAgent", "user_agent", "user-agent"])(
  "recognizes User-Agent variable names: %s",
  (name) => {
    expect(isUserAgentValue({}, { type: "VariableDeclarator", id: { name } })).toBe(true);
  },
);

test("recognizes User-Agent object keys and rejects other strings", () => {
  expect(isUserAgentValue({}, { type: "ObjectProperty", key: { value: "user-agent" } })).toBe(true);
  expect(isUserAgentValue({}, { type: "VariableDeclarator", id: { name: "description" } })).toBe(
    false,
  );
  expect(isUserAgentValue({}, { type: "VariableDeclarator" })).toBe(false);
  expect(isUserAgentValue({}, { type: "ObjectProperty", key: {} })).toBe(false);
  expect(isUserAgentValue({}, null)).toBe(false);
});
