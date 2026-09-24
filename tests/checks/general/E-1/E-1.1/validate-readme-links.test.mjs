import { expect, test } from "@jest/globals";
import {
  normalizeRepositoryUrl,
  validateReadmeLinks,
} from "../../../../../src/checks/general/E-1/E-1.1/validate-readme-links.mjs";

const links =
  "## Links\nHome https://eliware.org GitHub https://github.com/eliware Repo https://github.com/eliware/fixture npm https://www.npmjs.com/package/@eliware/fixture";

test("requires exact organization, repository, package, and home links", () => {
  const metadata = { name: "@eliware/fixture", repository: "https://github.com/eliware/fixture", eliware: { apply: ["npm-published"] } };
  expect(validateReadmeLinks(links, metadata)).toBeNull();
  expect(
    validateReadmeLinks(
      links.replace("github.com/eliware Repo", "github.com/other Repo"),
      metadata,
    ),
  ).toContain("Links section");
  expect(
    validateReadmeLinks(links.replace("/package/@eliware/fixture", "/package/wrong"), metadata),
  ).toContain("Links section");
  expect(
    validateReadmeLinks(links.replace("https://eliware.org", "https://other.org"), metadata),
  ).toContain("Links section");
});

test("accepts repository metadata forms and rejects invalid GitHub URLs", () => {
  expect(
    validateReadmeLinks("## Links\nhttps://eliware.org https://github.com/eliware"),
  ).toBeNull();
  expect(
    validateReadmeLinks(links.replace(/ npm https:\/\/www\.npmjs\.com\/package\/[^\s]+/u, ""), { repository: { url: "https://github.com/eliware/fixture" } }),
  ).toBeNull();
  expect(validateReadmeLinks(links, { repository: "ssh://example.invalid/repo" })).toContain(
    "valid GitHub repository URL",
  );
  expect(validateReadmeLinks(links, { repository: { url: 7 } })).toContain(
    "valid GitHub repository URL",
  );
  expect(normalizeRepositoryUrl()).toBe("https://github.com/eliware/fixture");
  expect(normalizeRepositoryUrl("")).toBeNull();
  expect(normalizeRepositoryUrl("git+https://github.com/eliware/fixture.git/")).toBe(
    "https://github.com/eliware/fixture",
  );
});

test("requires npm links only for npm-published and rejects public package links otherwise", () => {
  const common = { name: "@eliware/fixture", repository: "https://github.com/eliware/fixture" };
  const noNpmLink = links.replace(/ npm https:\/\/www\.npmjs\.com\/package\/[^\s]+/u, "");
  expect(validateReadmeLinks(noNpmLink, common)).toBeNull();
  expect(validateReadmeLinks(noNpmLink, { ...common, eliware: { apply: ["npm-published"] } })).toContain("Links section");
  expect(validateReadmeLinks(links, common)).toContain("Links section");
});
