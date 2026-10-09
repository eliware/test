import { expect, test } from "@jest/globals";
import { validateReadmeLinks } from "../../../../src/checks/shared/E-0.1.0.1.3/validate-readme-links.mjs";

const pkg = {
  name: "@eliware/fixture",
  repository: "git+https://github.com/eliware/fixture.git",
};
const invite = "https://discord.gg/M6aTR9eTwN";
const support = `For help, questions, or to chat with the author and community, visit:\n\n[![Discord](https://eliware.org/logos/discord_96.png)](${invite})[![eliware.org](https://eliware.org/logos/eliware_96.png)](${invite})\n\n**[eliware.org on Discord](${invite})**`;
const links = `- [Home Page](https://eliware.org)\n- [GitHub Org](https://github.com/eliware)\n- [GitHub Repo](https://github.com/eliware/fixture)\n- [Bug Reports](https://github.com/eliware/fixture/issues)\n- [Discord](${invite})`;
const license = "[MIT © Eliware](LICENSE)";

test("requires the exact canonical footer", () => {
  const readme = `## Support\n\n${support}\n\n## Links\n\n${links}\n\n## License\n\n${license}`;
  expect(validateReadmeLinks(readme, pkg)).toBeNull();
  expect(validateReadmeLinks(readme, { ...pkg, repository: { url: pkg.repository } })).toBeNull();
});

test("requires the npm link only for npm-published repositories", () => {
  const npmLinks = links.replace(
    `- [Discord](${invite})`,
    `- [npm](https://www.npmjs.com/package/${pkg.name})\n- [Discord](${invite})`,
  );
  const packageJson = { ...pkg, eliware: { apply: ["npm-published"] } };
  expect(
    validateReadmeLinks(
      `## Support\n${support}\n## Links\n${npmLinks}\n## License\n${license}`,
      packageJson,
    ),
  ).toBeNull();
  expect(
    validateReadmeLinks(
      `## Support\n${support}\n## Links\n${npmLinks}\n## License\n${license}`,
      pkg,
    ),
  ).toContain("canonical links");
});

test("rejects changed support copy, link order, labels, targets, and license text", () => {
  const footer = `## Support\n${support}\n## Links\n${links}\n## License\n${license}`;
  const reordered = links.replace(
    "- [Home Page](https://eliware.org)\n- [GitHub Org](https://github.com/eliware)",
    "- [GitHub Org](https://github.com/eliware)\n- [Home Page](https://eliware.org)",
  );
  for (const invalid of [
    footer.replace("For help", "For support"),
    footer.replace("GitHub Org", "GitHub organization"),
    footer.replace("Home Page", "GitHub Home"),
    footer.replace("[MIT © Eliware](LICENSE)", "[license](LICENSE)"),
    footer.replace(links, reordered),
  ])
    expect(validateReadmeLinks(invalid, pkg)).not.toBeNull();
});

test("rejects invalid repository metadata", () => {
  expect(validateReadmeLinks("", {})).toContain("canonical GitHub repository");
  expect(validateReadmeLinks("", { repository: "https://example.com/fixture" })).toContain(
    "canonical GitHub repository",
  );
  expect(validateReadmeLinks("", pkg)).toContain("canonical links");
});

test("requires a package name for the optional npm link", () => {
  expect(
    validateReadmeLinks("", {
      repository: pkg.repository,
      eliware: { apply: ["npm-published"] },
    }),
  ).toContain("package.json.name");
});
