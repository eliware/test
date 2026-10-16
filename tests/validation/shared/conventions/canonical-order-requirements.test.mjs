import { expect, test } from "@jest/globals";
import { canonicalOrderRequirements } from "../../../../src/validation/shared/conventions/canonical-order-requirements.mjs";

const requiredFields = {
  "agents-sections.yaml": ["baseSections", "profileOrder", "profileHeadings"],
  "ci-workflow.yaml": ["validationSteps", "stepValues", "checkoutOptions"],
  "eliware-apply.yaml": ["profiles"],
  "ordering-data-schema.yaml": [
    "documentFields",
    "orderValueTypes",
    "requiredFields",
    "requiredEntries",
    "requiredTypes",
  ],
  "package-files.yaml": ["baseEntries", "profileEntries", "profileEntryOrder"],
  "package-json.yaml": ["topLevelKeys", "eliwareKeys"],
  "publication-workflow.yaml": ["profiles", "jobs", "jobDependencies"],
  "readme-sections.yaml": [
    "header",
    "headerLines",
    "tableOfContentsHeading",
    "badgeOrder",
    "generalSections",
    "profileOrder",
    "profileSections",
    "finalSections",
    "linksSectionOrder",
    "headerTemplates",
    "sharedSections",
    "supportBlock",
    "licenseLink",
  ],
  "specification-indexes.yaml": ["directYamlFiles", "subdirectoryIndexes", "placement"],
};

test("defines required fields for every canonical ordering file", () => {
  expect(Object.keys(canonicalOrderRequirements).sort()).toEqual(
    Object.keys(requiredFields).sort(),
  );
  for (const [name, requirements] of Object.entries(canonicalOrderRequirements)) {
    expect(Object.keys(requirements.fields).sort()).toEqual(requiredFields[name].sort());
    for (const keys of Object.values(requirements.maps ?? {}))
      expect(keys.length).toBeGreaterThan(0);
    for (const entries of Object.values(requirements.nestedTypes ?? {})) {
      for (const values of Object.values(entries))
        for (const type of Object.values(values)) expect(type).toEqual(expect.any(String));
    }
  }
  expect(canonicalOrderRequirements["package-files.yaml"].maps.profileEntries).toContain(
    "npm-published",
  );
});
