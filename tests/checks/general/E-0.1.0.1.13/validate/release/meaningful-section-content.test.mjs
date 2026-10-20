import { expect, test } from "@jest/globals";
import { validateMeaningfulSectionContent } from "../../../../../../src/checks/general/E-0.1.0.1.13/validate/release/meaningful-section-content.mjs";

test.each([
  [[]],
  [["TBD"]],
  [["TODO"]],
  [["N/A"]],
  [["None"]],
  [["No change"]],
  [["---"]],
  [["1"]],
])("rejects section content without a meaningful change: %j", (content) => {
  expect(validateMeaningfulSectionContent("## 1.0.0", "Added", content)).toEqual([
    "## 1.0.0 subsection Added must contain user-visible change text.",
  ]);
});

test("accepts a section that contains meaningful change text", () => {
  expect(validateMeaningfulSectionContent("## 1.0.0", "Added", ["TBD", "Useful change."])).toEqual(
    [],
  );
});
