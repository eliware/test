import { canonicalProfileOrder } from "./profiles.mjs";

export const readmeSectionsRequirements = {
  fields: {
    header: "text-list",
    headerLines: "number-map",
    tableOfContentsHeading: "text",
    badgeOrder: "text-list",
    generalSections: "text-list",
    profileOrder: "text-list",
    profileSections: "text-list-map",
    finalSections: "text-list",
    linksSectionOrder: "text-list",
    sharedSections: "object-map",
    headerTemplates: "text-map",
    supportBlock: "text",
    licenseLink: "text",
  },
  maps: {
    headerLines: ["brand", "title-and-badges", "description", "table-of-contents"],
    headerTemplates: [
      "brand",
      "title",
      "npmBadge",
      "licenseBadge",
      "privateLicenseBadge",
      "ciBadge",
    ],
    profileSections: canonicalProfileOrder,
    sharedSections: ["Commands"],
  },
  nestedMaps: { sharedSections: { Commands: ["profiles"] } },
  nestedTypes: { sharedSections: { Commands: { profiles: "nonempty-text-list" } } },
};
