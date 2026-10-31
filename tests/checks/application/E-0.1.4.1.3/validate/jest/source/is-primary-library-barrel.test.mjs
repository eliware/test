import { expect, test } from "@jest/globals";
import { isPrimaryLibraryBarrel } from "../../../../../../../src/checks/application/E-0.1.4.1.3/validate/jest/source/is-primary-library-barrel.mjs";

test("allows only the declared primary entrypoint for a library-only package", () => {
  expect(
    isPrimaryLibraryBarrel(
      { main: "./src/index.mjs", eliware: { apply: ["general", "library"] } },
      "src/index.mjs",
    ),
  ).toBe(true);
});

test("rejects a package without declared profiles", () => {
  expect(isPrimaryLibraryBarrel({ main: "./src/index.mjs" }, "src/index.mjs")).toBe(false);
});

test.each([
  [{ main: "./src/index.mjs", eliware: { apply: ["library", "application"] } }, "src/index.mjs"],
  [{ main: "./src/index.mjs", eliware: { apply: ["general"] } }, "src/index.mjs"],
  [{ main: "./src/index.mjs", eliware: { apply: ["library"] } }, "src/other.mjs"],
  [{ main: "src/index.mjs", eliware: { apply: ["library"] } }, "src/index.mjs"],
  [{ main: 7, eliware: { apply: ["library"] } }, "src/index.mjs"],
])("rejects unsupported library barrel exceptions", (packageJson, path) => {
  expect(isPrimaryLibraryBarrel(packageJson, path)).toBe(false);
});
