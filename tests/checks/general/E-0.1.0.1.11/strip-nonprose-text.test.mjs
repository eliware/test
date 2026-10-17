import { describe, expect, test } from "@jest/globals";
import { stripNonProseText } from "../../../../src/checks/general/E-0.1.0.1.11/strip-nonprose-text.mjs";

describe("stripNonProseText", () => {
  test("removes inline code", () => {
    expect(stripNonProseText("Use `package.json` in the repository.")).toBe(
      "Use   in the repository.",
    );
  });

  test("removes HTTP and mailto URLs", () => {
    expect(stripNonProseText("See https://example.com and mailto:help@example.com.")).toBe(
      "See   and  .",
    );
  });

  test("keeps text without code or URLs", () => {
    expect(stripNonProseText("Keep this sentence.")).toBe("Keep this sentence.");
  });
});
