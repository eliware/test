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
              id: "E-1",
              dos: ["Do this."],
              donts: ["Do not do that."],
              examples: [{ markdown: "example" }],
            },
          ],
        },
      },
    ],
    "8.0",
  );
  expect(authority.profiles.general).toEqual({ profile: "general" });
  expect(authority.rules["E-1"]).toEqual({
    id: "E-1",
    dos: ["Do this."],
    donts: ["Do not do that."],
    examples: [{ markdown: "example" }],
  });
});

test("rejects profile documents without directives", () => {
  expect(() =>
    buildProfileAuthority([{ source: "general.json", document: { version: "8.0" } }], "8.0"),
  ).toThrow("no directive list");
});
