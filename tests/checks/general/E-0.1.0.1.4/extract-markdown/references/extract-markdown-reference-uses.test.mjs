import { expect, test } from "@jest/globals";
import method from "../../../../../../src/checks/general/E-0.1.0.1.4/extract-markdown/references/extract-markdown-reference-uses.mjs";

test("exports one default method", () => {
  expect(typeof method).toBe("function");
});
