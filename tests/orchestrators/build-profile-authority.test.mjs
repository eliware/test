import { expect, test } from "@jest/globals";
import { buildProfileAuthority } from "../../src/orchestrators/build-profile-authority.mjs";

test("builds profile applicability and complete directive records", () => {
  const authority = buildProfileAuthority(
    [
      {
        source: "general.json",
        document: {
          version: "8.0",
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
    "8.0",
  );
  expect(authority.profiles.general).toEqual({ profile: "general" });
  expect(authority.rules["E-0.1"]).toEqual({
    id: "E-0.1",
    dos: ["Do this."],
    donts: ["Do not do that."],
    examples: [{ markdown: "example" }],
  });
  expect(authority.rules["A-0.1.1"].dos).toEqual(["Nested."]);
});

test("rejects profile documents without directives", () => {
  expect(() =>
    buildProfileAuthority([{ source: "general.json", document: { version: "8.0" } }], "8.0"),
  ).toThrow("no directive list");
});

test("rejects invalid names, versions, duplicate identifiers, and malformed directives", () => {
  const directive = { id: "E-0.1", dos: ["rule"], donts: ["bad"] };
  const document = { version: "8.0", directives: [directive] };
  expect(() => buildProfileAuthority([], "8.0")).toThrow("cannot be empty");
  expect(() => buildProfileAuthority([{ source: "../general.json", document }], "8.0"))
    .toThrow("invalid name");
  expect(() => buildProfileAuthority([{ source: "Invalid Name.json", document }], "8.0"))
    .toThrow("invalid name");
  expect(() => buildProfileAuthority([{ source: "general.json", document: { ...document, version: "7.0" } }], "8.0"))
    .toThrow("must match Convention v8.0");
  expect(() => buildProfileAuthority([
    { source: "general.json", document },
    { source: "general.json", document },
  ], "8.0")).toThrow("Duplicate bundled convention profile");
  expect(() => buildProfileAuthority([
    { source: "general.json", document },
    { source: "application.json", document },
  ], "8.0")).toThrow("Duplicate bundled convention directive ID");
  expect(() => buildProfileAuthority([
    { source: "general.json", document: { version: "8.0", directives: [{ ...directive, examples: {} }] } },
  ], "8.0")).toThrow("malformed directive");
});
