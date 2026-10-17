import { expect, test } from "@jest/globals";
import { extractMarkdownShellCommands } from "../../../../../../../src/checks/application/E-0.1.4.1.3/validate/test-tool-references/markdown/shell-commands.mjs";

test("collects fenced shell commands and ignores other code fences", () => {
  expect(
    extractMarkdownShellCommands(
      "```javascript\nrun('jest')\n```\n\n~~~bash\nnpm test\n~~~\n```pwsh\nnode test.mjs\n```",
    ),
  ).toBe("npm test\nnode test.mjs");
});

test("ignores unfenced text and non-shell fences", () => {
  expect(extractMarkdownShellCommands('npm test\n```json\n{"command":"jest"}\n```')).toBe("");
});
