import { expect, test } from "@jest/globals";
import { hasProhibitedMarkdownCommandReferences } from "../../../../../../../src/checks/application/E-0.1.4.1.3/validate/test-tool-references/markdown/command-references.mjs";

test("checks shell code blocks and ignores prose or non-shell blocks", () => {
  expect(hasProhibitedMarkdownCommandReferences("```bash\nnpx jest\n```")).toBe(true);
  expect(hasProhibitedMarkdownCommandReferences("Run `npx jest` to inspect tests.")).toBe(false);
  expect(hasProhibitedMarkdownCommandReferences("```javascript\nrun('npx jest')\n```")).toBe(false);
});
