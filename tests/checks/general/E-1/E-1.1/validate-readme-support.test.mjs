import { expect, test } from "@jest/globals";
import { validateReadmeSupport } from "../../../../../src/checks/general/E-1/E-1.1/validate-readme-support.mjs";

test("requires the standard Discord support block", () => {
  const support =
    "## Support\n[Discord](https://discord.gg/M6aTR9eTwN) eliware.org on Discord\n## License";
  expect(validateReadmeSupport(support)).toBeNull();
  expect(
    validateReadmeSupport(support.replace("eliware.org on Discord", "GitHub issues")),
  ).toContain("Discord support");
  expect(validateReadmeSupport(support.replace("## Support", "## Help"))).toContain(
    "Discord support",
  );
});
