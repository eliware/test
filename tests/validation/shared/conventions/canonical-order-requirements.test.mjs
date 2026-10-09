import { expect, test } from "@jest/globals";
import { readFileSync } from "node:fs";
import { parse } from "yaml";
import { canonicalOrderRequirements } from "../../../../src/validation/shared/conventions/canonical-order-requirements.mjs";

test("defines required fields for every canonical ordering file", () => {
  expect(Object.keys(canonicalOrderRequirements).sort()).toEqual([
    "agents-sections.yaml",
    "ci-workflow.yaml",
    "eliware-apply.yaml",
    "ordering-data-schema.yaml",
    "package-files.yaml",
    "package-json.yaml",
    "publication-workflow.yaml",
    "readme-sections.yaml",
    "specification-indexes.yaml",
  ]);
  const schemaUrl = new URL(
    "../../../../specs/conventions/ordering/ordering-data-schema.yaml",
    import.meta.url,
  );
  const schema = parse(readFileSync(schemaUrl, "utf8")).orders;
  for (const [name, requirements] of Object.entries(canonicalOrderRequirements)) {
    expect(Object.keys(requirements.fields).sort()).toEqual(schema.requiredFields[name].sort());
    for (const [field, keys] of Object.entries(requirements.maps ?? {})) {
      const schemaKeys = schema.requiredEntries[name]?.[field];
      expect(keys).toEqual(schemaKeys);
    }
    for (const [field, entries] of Object.entries(requirements.nestedTypes ?? {})) {
      for (const [entry, values] of Object.entries(entries)) {
        for (const [key, type] of Object.entries(values)) {
          expect(schema.requiredTypes[name]?.[`${field}.${entry}.${key}`]).toBe(type);
        }
      }
    }
    for (const [field, entries] of Object.entries(requirements.nestedMaps ?? {})) {
      for (const [entry, keys] of Object.entries(entries)) {
        expect(schema.requiredEntries[name]?.[`${field}.${entry}`]).toEqual(keys);
      }
    }
  }
  expect(canonicalOrderRequirements["package-files.yaml"].maps.profileEntries).toContain(
    "npm-published",
  );
});
