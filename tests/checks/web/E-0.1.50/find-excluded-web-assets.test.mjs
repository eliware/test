import { expect, test } from "@jest/globals";
import { findExcludedWebAssets } from "../../../../src/checks/web/E-0.1.50/find-excluded-web-assets.mjs";

test("returns each path matching at least one configured exclusion", () => {
  expect(
    findExcludedWebAssets(
      ["public/index.html", "public/dist/app.js", "public/build/site.css"],
      ["dist", "build"],
    ),
  ).toEqual(["public/dist/app.js", "public/build/site.css"]);
});

test("returns no excluded paths when the inventory is empty or matches nothing", () => {
  expect(findExcludedWebAssets([], ["dist"])).toEqual([]);
  expect(findExcludedWebAssets(["public/assets/app.js"], ["dist", "build"])).toEqual([]);
});
