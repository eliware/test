import { expect, test } from "@jest/globals";
import {
  bundledConventionVersion,
  readBundledProfileCatalog,
} from "../../../src/validation/check-discovery/read-bundled-profile-catalog.mjs";

const documents = [
  {
    source: "general.yaml",
    document: {
      version: bundledConventionVersion,
      requires: [],
      conflicts: [],
      directives: [{ id: "E-0.1", dos: ["Do this."], donts: ["Avoid that."] }],
    },
  },
];

test("returns the cached bundled profile catalog", () => {
  const first = readBundledProfileCatalog();
  expect(readBundledProfileCatalog()).toBe(first);
  expect(first.version).toBe(bundledConventionVersion);
  expect(first.profiles.general).toEqual({ profile: "general", requires: [], conflicts: [] });
});

test("builds an uncached catalog for explicitly supplied documents", () => {
  const catalog = readBundledProfileCatalog({ documents });
  expect(catalog).not.toBe(readBundledProfileCatalog());
  expect(catalog.profiles.general).toEqual({ profile: "general", requires: [], conflicts: [] });
  expect(catalog.directives["E-0.1"]).toBe("general");
});
