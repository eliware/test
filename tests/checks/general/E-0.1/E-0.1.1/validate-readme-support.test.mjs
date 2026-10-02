import { expect, test } from "@jest/globals";
import { validateReadmeSupport } from "../../../../../src/checks/general/E-0.1/E-0.1.1/validate-readme-support.mjs";

test("requires the standard Discord support block", () => {
  const support =
    "## Support\n[![Discord](https://eliware.org/logos/discord_96.png)](https://discord.gg/M6aTR9eTwN)\n\n**[eliware.org on Discord](https://discord.gg/M6aTR9eTwN)**\n## License";
  expect(validateReadmeSupport(support)).toBeNull();
  expect(
    validateReadmeSupport(support.replace("eliware.org on Discord", "GitHub issues")),
  ).toContain("Discord support");
  expect(validateReadmeSupport(support.replace("## Support", "## Help"))).toContain(
    "Discord support",
  );
});
