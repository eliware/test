import { expect, test } from "@jest/globals";
import { validateRepoMapMetadata } from "../../../../src/checks/general/E-0.1/validate-repo-map-metadata.mjs";

const record = {
  id: "E-7",
  repository: "eliware/example",
  description: "Example repository",
  keywords: "eliware, example",
  profiles: "general, application",
};
const packageJson = {
  eliware: { id: "E-7", apply: ["general", "application"] },
  description: "Example repository",
  keywords: ["eliware", "example"],
};

test("accepts package metadata that matches the repo map", () => {
  expect(validateRepoMapMetadata(packageJson, record)).toBeNull();
});

test("reports each package identity field that differs from the repo map", () => {
  expect(
    validateRepoMapMetadata(
      {
        ...packageJson,
        eliware: { id: "E-8", apply: ["general"] },
        description: "Wrong",
        keywords: ["other"],
      },
      record,
    ),
  ).toBe(
    [
      "package.json.eliware.id must match repo-map.yaml.",
      "package.json.description must match repo-map.yaml.",
      "package.json.keywords must match repo-map.yaml.",
      "package.json.eliware.apply must match repo-map.yaml.",
    ].join("\n"),
  );
});

test.each([
  [{ ...record, id: "bad" }, "valid identity metadata"],
  [{ ...record, keywords: [] }, "keywords and profiles"],
  [{ ...record, keywords: "eliware, " }, "keywords and profiles"],
  [{ ...record, profiles: null }, "keywords and profiles"],
])("rejects malformed repo-map metadata", (invalidRecord, message) => {
  expect(validateRepoMapMetadata(packageJson, invalidRecord)).toContain(message);
});

test("accepts list-valued repo-map keywords and profiles", () => {
  expect(
    validateRepoMapMetadata(packageJson, {
      ...record,
      keywords: ["eliware", "example"],
      profiles: ["general", "application"],
    }),
  ).toBeNull();
});
