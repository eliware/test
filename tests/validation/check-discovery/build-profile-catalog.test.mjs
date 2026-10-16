import { expect, test } from "@jest/globals";
import {
  conventionVersion,
  otherConventionVersion,
  profileDocument,
} from "../../../test-fixtures/profile-catalog-test-fixtures.mjs";
import { buildProfileCatalog } from "../../../src/validation/check-discovery/build-profile-catalog.mjs";

test("builds profile applicability and complete directive records", () => {
  const catalog = buildProfileCatalog(
    [
      {
        source: "general.yaml",
        document: {
          version: conventionVersion,
          directives: [
            {
              id: "E-0.1",
              dos: ["Do this."],
              donts: ["Do not do that."],
              examples: [{ markdown: "example" }],
              children: [{ id: "E-0.1.1", dos: ["Nested."], donts: ["Do not skip it."] }],
            },
          ],
        },
      },
    ],
    conventionVersion,
  );
  expect(catalog.profiles.general).toEqual({ profile: "general" });
  expect(catalog.rules["E-0.1"]).toEqual({
    id: "E-0.1",
    dos: ["Do this."],
    donts: ["Do not do that."],
    examples: [{ markdown: "example" }],
    children: [{ id: "E-0.1.1", dos: ["Nested."], donts: ["Do not skip it."] }],
  });
  expect(catalog.rules["E-0.1.1"].dos).toEqual(["Nested."]);
  const withDependency = buildProfileCatalog(
    [
      profileDocument("general-semantic.yaml", "E-1"),
      profileDocument("application-semantic.yaml", "E-2"),
      profileDocument("cli-deterministic.yaml", "E-3"),
    ],
    conventionVersion,
  );
  expect(withDependency.profiles.cli).toEqual({ profile: "cli" });
});

test("rejects profile documents without directives", () => {
  expect(() =>
    buildProfileCatalog(
      [{ source: "general.yaml", document: { version: conventionVersion } }],
      conventionVersion,
    ),
  ).toThrow("no directive list");
});

test("rejects invalid names, versions, duplicate identifiers, and malformed directives", () => {
  const directive = { id: "E-0.1", dos: ["rule"], donts: ["bad"] };
  const document = {
    version: conventionVersion,
    directives: [directive],
  };
  expect(() => buildProfileCatalog([], conventionVersion)).toThrow("cannot be empty");
  expect(() =>
    buildProfileCatalog([{ source: "../general.yaml", document }], conventionVersion),
  ).toThrow("invalid name");
  expect(() =>
    buildProfileCatalog([{ source: "Invalid Name.yaml", document }], conventionVersion),
  ).toThrow("invalid name");
  expect(() =>
    buildProfileCatalog(
      [{ source: "general.yaml", document: { ...document, version: otherConventionVersion } }],
      conventionVersion,
    ),
  ).toThrow(`must match Convention v${conventionVersion}`);
  expect(() =>
    buildProfileCatalog(
      [
        { source: "general.yaml", document },
        { source: "general.yaml", document },
      ],
      conventionVersion,
    ),
  ).toThrow("Duplicate bundled convention profile");
  expect(() =>
    buildProfileCatalog(
      [
        { source: "general.yaml", document },
        { source: "application.yaml", document },
      ],
      conventionVersion,
    ),
  ).toThrow("Duplicate bundled convention directive ID");
  expect(() =>
    buildProfileCatalog(
      [
        {
          source: "general.yaml",
          document: { version: conventionVersion, directives: [{ ...directive, examples: {} }] },
        },
      ],
      conventionVersion,
    ),
  ).toThrow("malformed directive");
});
