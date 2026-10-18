import { expect, test } from "@jest/globals";
import { isUserFacingAttribute } from "../../../../../../../src/checks/general/E-0.1.0.1.11/extract/javascript-prose/output/attributes.mjs";

test.each(["alt", "aria-label", "placeholder", "title"])("accepts visible attribute %s", (name) =>
  expect(isUserFacingAttribute(name)).toBe(true),
);

test.each(["className", "data-label", "style", undefined])(
  "rejects non-visible attribute %s",
  (name) => expect(isUserFacingAttribute(name)).toBe(false),
);
