import { expect, test } from "@jest/globals";
import { validateReadmeLinks } from "../../../../src/checks/shared/E-0.1.0.1.3/validate-readme-links.mjs";

const pkg = {
  homepage: "https://github.com/eliware/fixture#readme",
  repository: "https://github.com/eliware/fixture",
};
const support =
  "[![Discord](https://eliware.org/logos/discord_96.png)](https://discord.gg/M6aTR9eTwN)\n\n**[eliware.org on Discord](https://discord.gg/M6aTR9eTwN)**";
const links = `[Home Page](${pkg.homepage}) [GitHub repository](https://github.com/eliware/fixture.git) [Eliware](https://eliware.org) [GitHub organization](https://github.com/eliware) [Discord](https://discord.gg/M6aTR9eTwN) [specifications](specs/README.md)`;
const license = "[license](LICENSE)";

test("requires canonical links and Discord support block", () => {
  expect(
    validateReadmeLinks(`## Links\n${links}\n## License\n${license}\n## Support\n${support}`, pkg),
  ).toBeNull();
  expect(validateReadmeLinks("", pkg)).toContain("Eliware");
  expect(
    validateReadmeLinks(`## Links\n${links}\n## License\n${license}\n## Support`, pkg),
  ).toContain("Discord support block");
  expect(
    validateReadmeLinks(`## Links\n${links}\n## License\n## Support\n${support}`, pkg),
  ).toContain("License must link");
  expect(validateReadmeLinks(`${links}\n${license}\n${support}`, pkg)).toContain("Eliware");
  expect(validateReadmeLinks("", undefined)).toContain("Eliware");
});

test("does not count canonical links or support text inside code", () => {
  const fake = `## Links\n\`\`\`md\n${links}\n\`\`\`\n## License\n\`\`\`md\n${license}\n\`\`\`\n## Support\n\`\`\`md\n${support}\n\`\`\``;
  expect(validateReadmeLinks(fake, pkg)).toContain("Eliware");
});

test("accepts canonical links written as reference links or HTML anchors", () => {
  const referenceLinks = `[Home Page][home] [GitHub repository][repo] [Eliware][eli] [GitHub organization][org] [Discord][discord] [specifications][spec]\n[home]: ${pkg.homepage}\n[repo]: <https://github.com/eliware/fixture.git>\n[eli]: https://eliware.org\n[org]: https://github.com/eliware\n[discord]: https://discord.gg/M6aTR9eTwN\n[spec]: specs/README.md`;
  const htmlLinks = `<a href="${pkg.homepage}">Home Page</a> <a href="https://github.com/eliware/fixture.git">GitHub repository</a> <a href="https://eliware.org">Eliware</a> <a href="https://github.com/eliware">GitHub organization</a> <a href="https://discord.gg/M6aTR9eTwN">Discord</a> <a href="specs/README.md">specifications</a>`;
  for (const canonicalLinks of [referenceLinks, htmlLinks])
    expect(
      validateReadmeLinks(
        `## Links\n${canonicalLinks}\n## License\n[license][license]\n[license]: LICENSE\n## Support\n${support}`,
        pkg,
      ),
    ).toBeNull();
  const collapsed = referenceLinks
    .replace("[Home Page][home]", "[Home Page][]")
    .replace(`[home]: ${pkg.homepage}`, `[Home Page]: ${pkg.homepage}`);
  expect(
    validateReadmeLinks(
      `## Links\n${collapsed}\n## License\n${license}\n## Support\n${support}`,
      pkg,
    ),
  ).toBeNull();
  const missing = referenceLinks.replace("[Home Page][home]", "[Home Page][missing]");
  expect(
    validateReadmeLinks(
      `## Links\n${missing}\n## License\n${license}\n## Support\n${support}`,
      pkg,
    ),
  ).toContain("Home Page");
});

test("rejects HTML anchors with the wrong destination or label", () => {
  const broken = links.replace(`[Home Page](${pkg.homepage})`, '<a href="wrong">Home Page</a>');
  expect(
    validateReadmeLinks(`## Links\n${broken}\n## License\n${license}\n## Support\n${support}`, pkg),
  ).toContain("Home Page");
});
