import { expect, test } from "@jest/globals";
import {
  bundledConventionVersion,
  readBundledProfileAuthority,
} from "../../src/orchestrators/read-bundled-profile-authority.mjs";

const documents = [
  {
    source: "general.json",
    document: {
      version: bundledConventionVersion,
      directives: [{ id: "E-0.1", dos: ["Do this."], donts: ["Avoid that."] }],
    },
  },
];

test("returns the cached bundled profile authority", () => {
  const first = readBundledProfileAuthority();
  expect(readBundledProfileAuthority()).toBe(first);
  expect(first.version).toBe(bundledConventionVersion);
  expect(first.profiles.general).toEqual({ profile: "general" });
});

test("builds an uncached authority for explicitly supplied documents", () => {
  const authority = readBundledProfileAuthority({ documents });
  expect(authority).not.toBe(readBundledProfileAuthority());
  expect(authority.profiles.general).toEqual({ profile: "general" });
  expect(authority.directives["E-0.1"]).toBe("general");
});
