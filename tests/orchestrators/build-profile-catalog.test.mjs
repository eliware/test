import { expect, test } from "@jest/globals";
import packageMetadata from "../../package.json" with { type: "json" };
import { buildProfileCatalog } from "../../src/orchestrators/build-profile-catalog.mjs";

const conventionVersion = packageMetadata.version.split(".").slice(0, 2).join(".");
const [conventionMajor, conventionMinor] = conventionVersion.split(".");
const otherConventionVersion = `${conventionMajor}.${Number(conventionMinor) + 1}`;

test("builds profile applicability and complete directive records", () => {
  const catalog = buildProfileCatalog(
    [
      {
        source: "general.yaml",
        document: {
          version: conventionVersion,
          requires: [],
          directives: [
            {
              id: "E-0.1",
              dos: ["Do this."],
              donts: ["Do not do that."],
              examples: [{ markdown: "example" }],
              directives: [{ id: "A-0.1.1", dos: ["Nested."], donts: ["Do not skip it."] }],
            },
          ],
        },
      },
    ],
    conventionVersion,
  );
  expect(catalog.profiles.general).toEqual({ profile: "general", requires: [] });
  expect(catalog.rules["E-0.1"]).toEqual({
    id: "E-0.1",
    dos: ["Do this."],
    donts: ["Do not do that."],
    examples: [{ markdown: "example" }],
  });
  expect(catalog.rules["A-0.1.1"].dos).toEqual(["Nested."]);
  const withDependency = buildProfileCatalog(
    [
      {
        source: "general.yaml",
        document: {
          version: conventionVersion,
          requires: [],
          directives: [{ id: "E-1", dos: ["Do."], donts: ["Do not."] }],
        },
      },
      {
        source: "application.yaml",
        document: {
          version: conventionVersion,
          requires: [],
          directives: [{ id: "E-2", dos: ["Do."], donts: ["Do not."] }],
        },
      },
      {
        source: "cli.yaml",
        document: {
          version: conventionVersion,
          requires: ["application"],
          directives: [{ id: "E-3", dos: ["Do."], donts: ["Do not."] }],
        },
      },
    ],
    conventionVersion,
  );
  expect(withDependency.profiles.cli.requires).toEqual(["application"]);
});

test("rejects profile documents without directives", () => {
  expect(() =>
    buildProfileCatalog(
      [{ source: "general.yaml", document: { version: conventionVersion } }],
      conventionVersion,
    ),
  ).toThrow("no directive list");
});

test("requires every profile document to declare a valid dependency list", () => {
  const directives = [{ id: "E-0.1", dos: ["Do."], donts: ["Do not."] }];
  expect(() =>
    buildProfileCatalog(
      [{ source: "general.yaml", document: { version: conventionVersion, directives } }],
      conventionVersion,
    ),
  ).toThrow("invalid requires list");
  for (const requires of [["general", "general"], ["general"], [3]]) {
    expect(() =>
      buildProfileCatalog(
        [
          {
            source: "general.yaml",
            document: { version: conventionVersion, requires, directives },
          },
        ],
        conventionVersion,
      ),
    ).toThrow("invalid requires list");
  }
});

test("requires paired profile files to declare the same dependencies", () => {
  const base = {
    version: conventionVersion,
    requires: [],
    directives: [{ id: "E-0.1", dos: ["Do."], donts: ["Do not."] }],
  };
  expect(() =>
    buildProfileCatalog(
      [
        { source: "general-semantic.yaml", document: base },
        {
          source: "general-deterministic.yaml",
          document: {
            ...base,
            requires: ["application"],
            directives: [{ id: "E-0.2", dos: ["Do."], donts: ["Do not."] }],
          },
        },
      ],
      conventionVersion,
    ),
  ).toThrow("mismatched dependencies");
});

test("rejects invalid names, versions, duplicate identifiers, and malformed directives", () => {
  const directive = { id: "E-0.1", dos: ["rule"], donts: ["bad"] };
  const document = { version: conventionVersion, requires: [], directives: [directive] };
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
  expect(() =>
    buildProfileCatalog(
      [{ source: "general.yaml", document: { ...document, requires: ["missing"] } }],
      conventionVersion,
    ),
  ).toThrow("requires unknown profiles");
  expect(() =>
    buildProfileCatalog(
      [{ source: "general.yaml", document: { ...document, requires: ["general"] } }],
      conventionVersion,
    ),
  ).toThrow("invalid requires list");
});
