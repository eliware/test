import { expect, test } from "@jest/globals";
import { findLibraryEntryPoints } from "../../../../../src/checks/general/E-1/E-1.5/find-library-entrypoints.mjs";

test("resolves library entrypoint metadata across export shapes", () => {
  expect(findLibraryEntryPoints({
    eliware: { apply: ["library"] },
    exports: { ".": { import: "./src/index.mjs", default: "./src/index.mjs" } },
    main: "src/index.mjs",
    module: "src/index.mjs",
  })).toEqual(["src/index.mjs", "src/index.mjs"]);
  expect(findLibraryEntryPoints({
    eliware: { apply: ["library"] },
    exports: "./src/index.mjs",
  })).toEqual(["src/index.mjs"]);
  expect(findLibraryEntryPoints({ exports: "./src/index.mjs" })).toEqual([]);
});
