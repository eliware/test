import { expect, test } from "@jest/globals";
import { validateReadmeStructure } from "../../../../src/checks/general/E-0.1.0.1.3/validate-readme-structure.mjs";

const expected = ["Table of Contents", "Features", "Support", "License", "Links"];
const brand =
  "# [![eliware.org](https://eliware.org/logos/brand.png)](https://discord.gg/M6aTR9eTwN)";
const valid = `${brand}\n\nfixture\n\n## Table of Contents\n\n- [Features](#features)\n- [Support](#support)\n- [License](#license)\n- [Links](#links)\n\n## Features\n\n## Support\n\n## License\n\n## Links`;

test("accepts canonical section and link order", () => {
  expect(validateReadmeStructure(valid, expected, { name: "fixture" })).toBeNull();
});

test("rejects invalid brand, title, headings, and contents list", () => {
  expect(validateReadmeStructure("bad", expected, { name: "fixture" })).toContain("logo header");
  expect(
    validateReadmeStructure(`${brand}\n\nwrong\n\n## Table of Contents`, expected, {
      name: "fixture",
    }),
  ).toContain("title");
  expect(
    validateReadmeStructure(valid.replace("## Features", "## Other"), expected, {
      name: "fixture",
    }),
  ).toContain("headings");
  expect(
    validateReadmeStructure(valid.replace("#features", "#wrong"), expected, { name: "fixture" }),
  ).toContain("Table of Contents");
  expect(validateReadmeStructure(`${brand}\n\nfixture`, expected, { name: "fixture" })).toContain(
    "Table of Contents",
  );
  expect(
    validateReadmeStructure(`${brand}\n\nfixture\n\nextra\n\n## Table of Contents`, expected, {
      name: "fixture",
    }),
  ).toContain("title");
  expect(validateReadmeStructure(valid, expected)).toContain("title");
});
