const profiles = [
  "application",
  "cli",
  "discord",
  "mcp-server",
  "web",
  "library",
  "infrastructure",
  "workspace",
  "documentation",
  "npm-published",
  "ghcr-published",
  "private",
];

export const canonicalOrderRequirements = {
  "agents-sections.yaml": {
    fields: { baseSections: "text-list", profileOrder: "text-list", profileHeadings: "text-map" },
    maps: { profileHeadings: profiles },
  },
  "ci-workflow.yaml": {
    fields: { validationSteps: "text-list", stepValues: "text-map" },
    maps: { stepValues: ["checkout", "setup-node", "install-npm", "npm-ci", "npm-test"] },
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
      finalOptionalEntries: "text-list",
      environmentExampleProfiles: "text-list",
    },
    maps: { profileEntries: ["application", "library", "npm-published"] },
  },
  "package-json.yaml": { fields: { topLevelKeys: "text-list", eliwareKeys: "text-list" } },
  "publication-workflow.yaml": {
    fields: { profiles: "text-list", jobs: "text-list" },
  },
  "readme-sections.yaml": {
    fields: {
      header: "text-list",
      headerLines: "number-map",
      tableOfContentsHeading: "text",
      badgeOrder: "text-list",
      generalSections: "text-list",
      profileOrder: "text-list",
      profileSections: "text-list-map",
      finalSections: "text-list",
      sharedSections: "object-map",
    },
    maps: {
      headerLines: ["brand", "title-and-badges", "description", "table-of-contents"],
      profileSections: profiles,
      sharedSections: ["Commands"],
    },
    nestedMaps: { sharedSections: { Commands: ["profiles"] } },
    nestedTypes: { sharedSections: { Commands: { profiles: "nonempty-text-list" } } },
  },
  "specification-indexes.yaml": {
    fields: { directYamlFiles: "text", subdirectoryIndexes: "text", placement: "text" },
  },
};
