import { expect, test } from "@jest/globals";
import readReadmeSection from "../../../../../../src/checks/shared/E-0.1.0.1.3/validate-readme/sections/read.mjs";
test("reads a section body up to the next level-two heading", () => {
  expect(readReadmeSection("## Links\nfirst\n\n### Nested\nbody\n## License\nMIT", "Links")).toBe(
    "first\n\n### Nested\nbody",
  );
});
test("returns an empty body for a missing section and reads through end of file", () => {
  expect(readReadmeSection("## Links\nbody", "License")).toBe("");
  expect(readReadmeSection("## Links\nbody", "Links")).toBe("body");
});
