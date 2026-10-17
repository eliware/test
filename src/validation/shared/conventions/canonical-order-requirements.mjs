import { canonicalProfileOrder } from "./canonical-order-requirements/profiles.mjs";
import { readmeSectionsRequirements } from "./canonical-order-requirements/readme-sections.mjs";

export const canonicalOrderRequirements = {
  "agents-sections.yaml": {
    fields: { baseSections: "text-list", profileOrder: "text-list", profileHeadings: "text-map" },
    maps: { profileHeadings: canonicalProfileOrder },
  },
  "ci-workflow.yaml": {
    fields: {
      validationSteps: "text-list",
      stepValues: "text-map",
      checkoutOptions: "number-map",
    },
    maps: {
      stepValues: ["checkout", "setup-node", "install-npm", "npm-ci", "npm-test"],
      checkoutOptions: ["fetch-depth"],
    },
  },
  "eliware-apply.yaml": { fields: { profiles: "text-list" } },
  "ordering-data-schema.yaml": {
    fields: {
      documentFields: "text-list",
      orderValueTypes: "text-list",
      requiredFields: "text-list-map",
      requiredEntries: "object-map",
      requiredTypes: "object-map",
    },
    maps: {
      requiredFields: [
        "agents-sections.yaml",
        "ci-workflow.yaml",
        "eliware-apply.yaml",
        "ordering-data-schema.yaml",
        "package-files.yaml",
        "package-json.yaml",
        "publication-workflow.yaml",
        "readme-sections.yaml",
        "specification-indexes.yaml",
      ],
      requiredEntries: [
        "agents-sections.yaml",
        "ci-workflow.yaml",
        "ordering-data-schema.yaml",
        "package-files.yaml",
        "readme-sections.yaml",
      ],
      requiredTypes: ["readme-sections.yaml"],
    },
  },
  "package-files.yaml": {
    fields: {
      baseEntries: "text-list",
      profileEntries: "text-map",
      profileEntryOrder: "text-list",
    },
    maps: { profileEntries: ["application", "library", "npm-published"] },
  },
  "package-json.yaml": { fields: { topLevelKeys: "text-list", eliwareKeys: "text-list" } },
  "publication-workflow.yaml": {
    fields: {
      profiles: "text-list",
      workflowFiles: "text-map",
    },
    maps: { workflowFiles: ["npm-published", "ghcr-published"] },
  },
  "readme-sections.yaml": readmeSectionsRequirements,
  "specification-indexes.yaml": {
    fields: { directYamlFiles: "text", subdirectoryIndexes: "text", placement: "text" },
  },
};
