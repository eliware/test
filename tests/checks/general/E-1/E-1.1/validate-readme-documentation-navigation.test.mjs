import { expect, test } from "@jest/globals";
import { validateReadmeDocumentationNavigation } from "../../../../../src/checks/general/E-1/E-1.1/validate-readme-documentation-navigation.mjs";

const navigation =
  "Documentation: [docs](docs/README.md) [specifications](specs/README.md) [examples](examples/README.md)";

test("requires documentation and specification navigation", () => {
  expect(validateReadmeDocumentationNavigation(navigation)).toBeNull();
  expect(
    validateReadmeDocumentationNavigation(navigation.replace("Documentation:", "Docs:")),
  ).toContain("Documentation navigation");
  expect(
    validateReadmeDocumentationNavigation(navigation.replace("specifications", "specs")),
  ).toContain("Documentation navigation");
});

test("requires the examples index only when examples exist", () => {
  expect(
    validateReadmeDocumentationNavigation(
      navigation.replace(" [examples](examples/README.md)", ""),
      {
        examplesRequired: false,
      },
    ),
  ).toBeNull();
  expect(
    validateReadmeDocumentationNavigation(
      navigation.replace(" [examples](examples/README.md)", ""),
    ),
  ).toContain("Documentation navigation");
});
