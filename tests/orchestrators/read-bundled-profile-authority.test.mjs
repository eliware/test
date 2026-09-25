import { expect, test } from "@jest/globals";
import {
  bundledConventionVersion,
  expandAppliedProfiles,
  readBundledProfileAuthority,
  validateAppliedProfiles,
} from "../../src/orchestrators/read-bundled-profile-authority.mjs";

const profileDocuments = [
  {
    source: "general.json",
    document: {
      version: "8.0",
      directives: [
        {
          id: "E-1",
          dos: ["General rule."],
          donts: ["General prohibition."],
          directives: [
            {
              id: "A-1.0",
              dos: ["Specific rule."],
              donts: ["Specific prohibition."],
              examples: [{ purpose: "Example", markdown: "A literal example." }],
            },
          ],
        },
      ],
    },
  },
  {
    source: "application.json",
    document: {
      version: "8.0",
      directives: [{ id: "E-1.130", dos: ["Application rule."], donts: ["Bad application."] }],
    },
  },
];

test("derives profiles and complete rule records from local specification documents", () => {
  const authority = readBundledProfileAuthority({ documents: profileDocuments });
  expect(authority.version).toBe(bundledConventionVersion);
  expect(Object.keys(authority.profiles)).toEqual(["general", "application"]);
  expect(authority.directives).toEqual({
    "E-1": "general",
    "A-1.0": "general",
    "E-1.130": "application",
  });
  expect(authority.rules["A-1.0"]).toEqual({
    id: "A-1.0",
    dos: ["Specific rule."],
    donts: ["Specific prohibition."],
    examples: [{ purpose: "Example", markdown: "A literal example." }],
  });
  expect(readBundledProfileAuthority().profiles.general).toEqual({ profile: "general" });
});

test("validates explicit profile selections without inferred inheritance", () => {
  const authority = readBundledProfileAuthority();
  expect(validateAppliedProfiles(["general", "application", "cli"], authority)).toBeNull();
  expect(validateAppliedProfiles(["cli"], authority)).toBeNull();
  expect(expandAppliedProfiles(["cli"], authority)).toEqual(["cli"]);
  expect(expandAppliedProfiles(["general", "cli", "general"], authority)).toEqual([
    "general",
    "cli",
  ]);
  expect(expandAppliedProfiles(["general", "not-a-profile"], authority)).toEqual(["general"]);
  expect(validateAppliedProfiles(["general", "unknown"], authority)).toContain("Unknown");
  expect(validateAppliedProfiles(["general", "fork"], authority)).toContain("excludes");
});

test("uses local profile specs by default when validating and expanding", () => {
  const profiles = Object.keys(readBundledProfileAuthority().profiles);
  expect(validateAppliedProfiles(profiles.filter((profile) => profile !== "fork"))).toBeNull();
  expect(expandAppliedProfiles(profiles)).toEqual(profiles);
});

test("rejects empty, mismatched, duplicate, or malformed local profile specs", () => {
  expect(() => readBundledProfileAuthority({ documents: [] })).toThrow("cannot be empty");
  expect(() =>
    readBundledProfileAuthority({
      documents: [{ source: "general.json", document: { version: "7.0", directives: [] } }],
    }),
  ).toThrow(`must match Convention v${bundledConventionVersion}`);
  expect(() =>
    readBundledProfileAuthority({
      documents: [
        ...profileDocuments,
        { source: "other.json", document: profileDocuments[0].document },
      ],
    }),
  ).toThrow("Duplicate bundled convention directive ID: E-1");
  expect(() =>
    readBundledProfileAuthority({
      documents: [{ source: "../general.json", document: profileDocuments[0].document }],
    }),
  ).toThrow("invalid name");
  expect(() =>
    readBundledProfileAuthority({
      documents: [{ source: "Invalid Name.json", document: profileDocuments[0].document }],
    }),
  ).toThrow("invalid name");
  expect(() =>
    readBundledProfileAuthority({
      documents: [
        profileDocuments[0],
        { source: profileDocuments[0].source, document: profileDocuments[1].document },
      ],
    }),
  ).toThrow("Duplicate bundled convention profile");
  expect(() =>
    readBundledProfileAuthority({
      documents: [{ source: "general.json", document: { version: "8.0" } }],
    }),
  ).toThrow("no directive list");
  expect(() =>
    readBundledProfileAuthority({
      documents: [
        {
          source: "general.json",
          document: {
            version: bundledConventionVersion,
            directives: [{ id: "E-1", dos: ["rule"], donts: ["bad"], examples: {} }],
          },
        },
      ],
    }),
  ).toThrow("malformed directive");
  expect(() =>
    readBundledProfileAuthority({
      documents: [
        {
          source: "general.json",
          document: { version: bundledConventionVersion, directives: [{ id: "bad", dos: [] }] },
        },
      ],
    }),
  ).toThrow("malformed directive");
});
