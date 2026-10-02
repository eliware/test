import { expect, test } from "@jest/globals";
import {
  normalizeRepositoryUrl,
  validateReadmeLinks,
} from "../../../../../src/checks/general/E-0.1/E-0.1.1/validate-readme-links.mjs";

const metadata = {
  name: "@eliware/fixture",
  repository: "git+https://github.com/eliware/fixture.git",
  homepage: "https://github.com/eliware/fixture#readme",
  eliware: { apply: ["application", "npm-published"] },
};
const links = `## Links
[Home Page](${metadata.homepage})
[GitHub repository](https://github.com/eliware/fixture.git)
[Eliware](https://eliware.org)
[GitHub organization](https://github.com/eliware)
[Discord](https://discord.gg/M6aTR9eTwN)
[docs](docs/README.md)
[specifications](specs/README.md)
[npm Package](https://www.npmjs.com/package/@eliware/fixture)
[Release Notes](RELEASE_NOTES.md)`;

test("requires the exact homepage, canonical repository, organization, docs, and footer links", () => {
  expect(
    validateReadmeLinks(links, metadata, undefined, {
      docsRequired: true,
      releaseNotesPresent: true,
    }),
  ).toBeNull();
  expect(
    validateReadmeLinks(`${links}\n## Next`, metadata, undefined, { docsRequired: true }),
  ).toBeNull();
});

test("rejects incorrect labels and targets, including repository URLs without .git", () => {
  for (const changed of [
    links.replace(metadata.homepage, "https://eliware.org"),
    links.replace("[GitHub repository]", "[GitHub Repo]"),
    links.replace("https://github.com/eliware/fixture.git", "https://github.com/eliware/fixture"),
    links.replace("[Discord](https://discord.gg/M6aTR9eTwN)", "[Discord](https://example.test)"),
    links.replace("[specifications](specs/README.md)", "[specifications](specs/index.md)"),
  ]) {
    expect(validateReadmeLinks(changed, metadata, undefined, { docsRequired: true })).toContain(
      "exact",
    );
  }
  expect(
    validateReadmeLinks(links.replace("[docs](docs/README.md)\n", ""), metadata, undefined, {
      docsRequired: true,
    }),
  ).toContain("docs");
  expect(
    validateReadmeLinks(
      links.replace("[Release Notes](RELEASE_NOTES.md)", ""),
      metadata,
      undefined,
      {
        docsRequired: true,
        releaseNotesPresent: true,
      },
    ),
  ).toContain("Release Notes");
});

test("requires a package homepage and a valid canonical GitHub repository", () => {
  expect(validateReadmeLinks(links, { ...metadata, homepage: " " })).toContain(
    "package.json.homepage",
  );
  expect(validateReadmeLinks("## Links", undefined)).toContain("valid GitHub repository URL");
  expect(validateReadmeLinks(links, { ...metadata, name: undefined })).toContain("npm Package");
  expect(
    validateReadmeLinks(links, { ...metadata, repository: "ssh://example.invalid/repo" }),
  ).toContain("valid GitHub repository URL");
  expect(validateReadmeLinks(links, { ...metadata, repository: { url: 7 } })).toContain(
    "valid GitHub repository URL",
  );
});

test("rejects a missing Links section", () => {
  expect(
    validateReadmeLinks("## Support\nnone", metadata, undefined, { docsRequired: true }),
  ).toContain("exact Home Page");
});

test("requires an npm package link only for the npm-published profile", () => {
  const common = { ...metadata, eliware: { apply: ["application"] } };
  expect(validateReadmeLinks(links, common)).toContain("profile-appropriate package");
  const withoutNpm = links.replace(
    "[npm Package](https://www.npmjs.com/package/@eliware/fixture)\n",
    "",
  );
  expect(validateReadmeLinks(withoutNpm, common)).toBeNull();
  expect(
    validateReadmeLinks(withoutNpm, {
      ...metadata,
      eliware: { apply: ["application", "npm-published"] },
    }),
  ).toContain("npm Package");
});

test("normalizes accepted GitHub package repository metadata", () => {
  expect(normalizeRepositoryUrl("git+https://github.com/eliware/fixture.git/")).toBe(
    "https://github.com/eliware/fixture",
  );
  expect(normalizeRepositoryUrl()).toBeNull();
  expect(normalizeRepositoryUrl(" ")).toBeNull();
  expect(normalizeRepositoryUrl("ssh://github.com/eliware/fixture")).toBeNull();
});
