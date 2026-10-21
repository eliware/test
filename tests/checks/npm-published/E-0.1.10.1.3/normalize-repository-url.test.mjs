import { expect, test } from "@jest/globals";
import { normalizeRepositoryUrl } from "../../../../src/checks/npm-published/E-0.1.10.1.3/normalize-repository-url.mjs";

test.each([
  "https://github.com/Eliware/Test.git",
  "git+https://github.com/Eliware/Test",
  "git@github.com:Eliware/Test.git",
  "ssh://git@github.com/Eliware/Test.git",
])("normalizes GitHub repository URLs: %s", (value) => {
  expect(normalizeRepositoryUrl(value)).toBe("github.com/eliware/test");
});

test.each([undefined, "", 12, "https://example.com/eliware/test", "https://github.com/../test"])(
  "rejects invalid repository URLs: %s",
  (value) => {
    expect(normalizeRepositoryUrl(value)).toBeNull();
  },
);
