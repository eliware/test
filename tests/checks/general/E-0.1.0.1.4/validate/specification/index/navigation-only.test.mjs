import { expect, test } from "@jest/globals";
import { isNavigationOnlyIndex } from "../../../../../../../src/checks/general/E-0.1.0.1.4/validate/specification/index/navigation-only.mjs";

test("accepts headings, inline links, and reference links", () => {
  expect(
    isNavigationOnlyIndex(
      "# Specs\n\n- [Rules](rules.yaml)\n- [Nested][nested]\n\n[nested]: <nested/README.md> label",
    ),
  ).toBe(true);
});

test("rejects prose and unsupported Markdown structures", () => {
  expect(isNavigationOnlyIndex("# Specs\n\nRead this overview.")).toBe(false);
  expect(isNavigationOnlyIndex("> [Rules](rules.yaml)")).toBe(false);
});
