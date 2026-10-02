import { beforeEach, expect, jest, test } from "@jest/globals";

const validateReadmeDocumentationNavigation = jest.fn();
const validateReadmeLicense = jest.fn();
const validateReadmeLinks = jest.fn();
const validateReadmePackageBadges = jest.fn();
const validateReadmeStructure = jest.fn();
const validateReadmeSupport = jest.fn();

jest.unstable_mockModule(
  "../../../../../src/checks/general/E-0.1/E-0.1.1/validate-readme-documentation-navigation.mjs",
  () => ({ validateReadmeDocumentationNavigation }),
);
jest.unstable_mockModule(
  "../../../../../src/checks/general/E-0.1/E-0.1.1/validate-readme-license.mjs",
  () => ({ validateReadmeLicense }),
);
jest.unstable_mockModule(
  "../../../../../src/checks/general/E-0.1/E-0.1.1/validate-readme-links.mjs",
  () => ({ validateReadmeLinks }),
);
jest.unstable_mockModule(
  "../../../../../src/checks/general/E-0.1/E-0.1.1/validate-readme-package-badges.mjs",
  () => ({ validateReadmePackageBadges }),
);
jest.unstable_mockModule(
  "../../../../../src/checks/general/E-0.1/E-0.1.1/validate-readme-structure.mjs",
  () => ({ validateReadmeStructure }),
);
jest.unstable_mockModule(
  "../../../../../src/checks/general/E-0.1/E-0.1.1/validate-readme-support.mjs",
  () => ({ validateReadmeSupport }),
);

const { validateReadmeRequiredContent } =
  await import("../../../../../src/checks/general/E-0.1/E-0.1.1/validate-readme-required-content.mjs");
const validators = [
  validateReadmeStructure,
  validateReadmePackageBadges,
  validateReadmeDocumentationNavigation,
  validateReadmeSupport,
  validateReadmeLinks,
  validateReadmeLicense,
];

function resetValidators() {
  jest.resetAllMocks();
  for (const validator of validators) validator.mockReturnValue(null);
}

beforeEach(resetValidators);

test("runs focused README validators in order and passes their shared inputs", () => {
  const readme = "README";
  const packageJson = { name: "@eliware/fixture" };
  const options = { sections: new Map() };

  expect(validateReadmeRequiredContent(readme, packageJson, options)).toBeNull();
  expect(validators.map((validator) => validator.mock.invocationCallOrder[0])).toEqual(
    [...validators].map((validator) => validator.mock.invocationCallOrder[0]).sort((a, b) => a - b),
  );
  expect(validateReadmeDocumentationNavigation).toHaveBeenCalledWith(readme, options);
  expect(validateReadmeSupport).toHaveBeenCalledWith(readme, options.sections);
  expect(validateReadmeLinks).toHaveBeenCalledWith(readme, packageJson, options.sections, options);
  expect(validateReadmeLicense).toHaveBeenCalledWith(readme, options.sections);
});

test("collects findings from every independent README validator", () => {
  for (const [index, validator] of validators.entries()) {
    resetValidators();
    validator.mockReturnValueOnce("invalid README");

    expect(validateReadmeRequiredContent("README")).toBe("invalid README");
    for (const earlierValidator of validators.slice(0, index)) {
      expect(earlierValidator).toHaveBeenCalled();
    }
    for (const laterValidator of validators.slice(index + 1)) {
      expect(laterValidator).toHaveBeenCalled();
    }
  }
});
