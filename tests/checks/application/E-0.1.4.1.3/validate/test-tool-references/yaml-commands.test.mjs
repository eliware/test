import { expect, test } from "@jest/globals";
import { extractYamlCommands } from "../../../../../../src/checks/application/E-0.1.4.1.3/validate/test-tool-references/yaml-commands.mjs";

test("collects inline and literal block command fields", () => {
  expect(
    extractYamlCommands(
      'steps:\n  - run: "npm test"\n  - command: >-\n      npm ci\n      npm test\n  - script: vitest run',
    ),
  ).toBe("npm test\nnpm ci\nnpm test\nvitest run");
});

test("stops command blocks at the next peer field", () => {
  expect(extractYamlCommands("run: |\n  npm test\nname: next\nscript: >\n  npm ci\n")).toBe(
    "npm test\nnpm ci",
  );
});

test("ignores content without command keys", () => {
  expect(extractYamlCommands('description: "run: npm test"')).toBe("");
});
