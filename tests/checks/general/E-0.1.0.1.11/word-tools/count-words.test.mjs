import { expect, test } from "@jest/globals";
import method from "../../../../../src/checks/general/E-0.1.0.1.11/word-tools/count-words.mjs";

test("exports one default method", () => {
  expect(typeof method).toBe("function");
});
