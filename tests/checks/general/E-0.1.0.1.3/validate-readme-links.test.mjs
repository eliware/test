import { expect, test } from "@jest/globals";
import { validateReadmeLinks } from "../../../../src/checks/general/E-0.1.0.1.3/validate-readme-links.mjs";

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
