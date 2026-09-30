import { expect, test } from "@jest/globals";
import { validateReadmeDocumentationNavigation } from "../../../../../src/checks/general/E-0.1/E-0.1.1/validate-readme-documentation-navigation.mjs";

const navigation = "Documentation: [specifications](specs/README.md)";

test("requires the specifications navigation in every repository", () => {
  expect(validateReadmeDocumentationNavigation(navigation)).toBeNull();
  expect(
    validateReadmeDocumentationNavigation(navigation.replace("Documentation:", "Docs:")),
  ).toContain("Documentation navigation");
  expect(
    validateReadmeDocumentationNavigation(navigation.replace("specifications", "specs")),
  ).toContain("Documentation navigation");
});

test("requires docs navigation only for applications and libraries", () => {
  expect(
    validateReadmeDocumentationNavigation(`${navigation} [docs](docs/README.md)`, {
      docsRequired: true,
    }),
  ).toBeNull();
  expect(validateReadmeDocumentationNavigation(navigation, { docsRequired: true })).toContain(
    "Documentation navigation",
  );
});
