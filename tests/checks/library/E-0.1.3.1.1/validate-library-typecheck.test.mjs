import { expect, test } from "@jest/globals";
import { validateLibraryTypecheck } from "../../../../src/checks/library/E-0.1.3.1.1/validate-library-typecheck.mjs";

test("requires one direct typechecker command and declared tool", () => {
  expect(
    validateLibraryTypecheck({
      scripts: { typecheck: "tsc --noEmit" },
      devDependencies: { typescript: "*" },
    }),
  ).toEqual([]);
  expect(validateLibraryTypecheck({})).toEqual([
    "package.json The typecheck script must be nonempty.",
  ]);
  expect(
    validateLibraryTypecheck({
      scripts: { typecheck: "tsc --noEmit && echo done" },
      devDependencies: { typescript: "*" },
    })[0],
  ).toContain("one command");
  expect(validateLibraryTypecheck({ scripts: { typecheck: "tsc --noEmit" } })[0]).toContain(
    "typescript must be declared",
  );
});
