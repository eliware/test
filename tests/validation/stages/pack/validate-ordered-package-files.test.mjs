import { validateOrderedPackageFiles } from "../../../../src/validation/stages/pack/validate-ordered-package-files.mjs";

const required = ["src/", "docs/", "README.md", "AGENTS.md", "LICENSE", "RELEASE_NOTES.md", "bin/"];

test("accepts required entries followed by runtime entries", () => {
  expect(validateOrderedPackageFiles([...required, "assets/", "data.json"], required)).toBeNull();
});

test("accepts .env.example as the final entry", () => {
  expect(
    validateOrderedPackageFiles([...required, ".env.example"], [...required, ".env.example"]),
  ).toBeNull();
});

test("rejects non-string entries and duplicate paths", () => {
  expect(validateOrderedPackageFiles([...required, null], required)).toContain("only string paths");
  expect(validateOrderedPackageFiles([...required, "assets/", "assets/"], required)).toContain(
    "duplicate paths",
  );
});

test("rejects missing or misordered required entries", () => {
  expect(validateOrderedPackageFiles(required.slice(1), required)).toContain(
    "must start with required entries in this order",
  );
  expect(validateOrderedPackageFiles(["bin/", ...required.slice(0, -1)], required)).toContain(
    "must start with required entries in this order",
  );
});

test("requires .env.example to be last", () => {
  expect(validateOrderedPackageFiles([...required, ".env.example", "assets/"], required)).toContain(
    ".env.example must be the final",
  );
});
